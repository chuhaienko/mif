'use strict';

const requireDir = require('require-dir');
const path       = require('path');
const AppError   = require('./AppError');
const BaseModule = require('./BaseModule');
const _          = require('lodash');


module.exports = class Framework {
	constructor () {
		this._initializedAt = null;
		this._startedAt     = null;
		this._stoppedAt     = null;

		this._appDir  = process.env.PWD;
		this._mifDir  = path.resolve(__dirname, '../');

		this.config  = {};
		this.modules = {};

		this.AppError = AppError;

		this._flags = {
			isStopping: false
		};
	}

	async init () {
		this._env = this._loadEnv();

		let mifConfig = this._loadConfigs(path.resolve(this._mifDir, 'config'));
		let appConfig = this._loadConfigs(path.resolve(this._appDir, 'config'));
		this.config = _.merge(mifConfig, appConfig);

		this.modules = this._loadModules();

		this.modulesOrder = this._getModulesOrder();

		// Init modules
		let modulesNames = this.modulesOrder.init;
		for (let i = 0; i < modulesNames.length; i += 1) {
			const module = this.modules[modulesNames[i]];

			this.logger && this.logger.info(`Module ${modulesNames[i]} is initializing`);
			await module.init();
			this.logger && this.logger.info(`Module ${modulesNames[i]} is initialized`);
		}
	}

	async start () {
		// Start modules
		let modulesNames = this.modulesOrder.start;
		for (let i = 0; i < modulesNames.length; i += 1) {
			const module = this.modules[modulesNames[i]];

			this.logger && this.logger.info(`Module ${modulesNames[i]} is starting`);
			await module.start();
			this.logger && this.logger.info(`Module ${modulesNames[i]} is started`);
		}
	}

	async stop () {
		if (!this._flags.isStopping) {
			this._flags.isStopping = true;
		} else {
			return;
		}

		await new Promise(async (resolve, reject) => {
			// Timeout for stop
			let timeout = setTimeout(() => {
				return reject(new this.AppError({
					code:    'TIMEOUT_ERROR',
					message: 'Framework can not stop correctly in time'
				}));
			}, this.config.mif.stopTimeout);

			// Stop modules
			let modulesNames = this.modulesOrder.stop;
			for (let i = 0; i < modulesNames.length; i += 1) {
				const module = this.modules[modulesNames[i]];

				this.logger && this.logger.info(`Module ${modulesNames[i]} is stopping`);
				await module.stop();
				this.logger && this.logger.info(`Module ${modulesNames[i]} is stopped`);
			}

			clearTimeout(timeout);

			return resolve();
		});
	}

	/**
	 * Return value of env variable or default value
	 * @param keyPath
	 * @param defaultValue
	 * @returns {*}
	 */
	env (keyPath, defaultValue) {
		return _.get(this._env, keyPath, defaultValue);
	}

	_loadEnv () {
		return _.mapValues(process.env, (it, key) => {
			try {
				return JSON.parse(it);
			} catch (err) {
				return it;
			}
		});
	}

	/**
	 * Load configs from directory. Resolve only default and {env} config. Merge them
	 * @param configDir
	 * @returns {Object}
	 * @private
	 */
	_loadConfigs (configDir) {
		const fullConfig = requireDir(configDir);

		return _.mapValues(fullConfig, (confObj, name) => {
			if (confObj) {
				let config = {};

				if (confObj.default) {
					config.default = this._resolveConfigObj(confObj.default);
				}

				if (confObj[this._env.NODE_ENV]) {
					config[this._env.NODE_ENV] = this._resolveConfigObj(confObj[this._env.NODE_ENV]);
				}

				return _.merge(config.default, config[this._env.NODE_ENV]);
			} else {
				return confObj;
			}
		});
	}

	/**
	 * Load modules corresponded to config. First try module from app dir, after try from mif dir
	 * @returns {Object}
	 * @private
	 */
	_loadModules () {
		/* eslint global-require: 0*/
		let config = {};

		_.each(this.config, (confObj, name) => {
			if (!confObj.moduleIsActive) {
				return;
			}

			let Module;

			// Try app module
			try {
				let modulePath = path.resolve(this._appDir, `modules/${name}/${name}.js`);
				Module = require(modulePath);
			} catch (appErr) {
				try {
					let modulePath = path.resolve(this._mifDir, `modules/${name}/${name}.js`);
					Module = require(modulePath);
				} catch (mifErr) {
					throw new this.AppError({
						code:    'MODULE_DOES_NOT_EXIST',
						message: `File for module ${name} does not exist`,
						details: {
							appErr: appErr,
							mifErr: mifErr
						}
					});
				}
			}

			if (!(Module.prototype instanceof BaseModule)) {
				throw new this.AppError({
					code:    'MODULE_IS_INVALID',
					message: `Module ${name} does not extend BaseModule`
				});
			}

			config[name] = new Module(this, confObj);
		});

		return config;
	}

	/**
	 * Return call order lists of modules
	 * @returns {{init: Array, start: Array, stop: Array}}
	 * @private
	 */
	_getModulesOrder () {
		let order = {
			init:  [],
			start: [],
			stop:  [],
		};

		let priorities = Object.keys(this.config)
		.filter((name) => {
			return this.config[name].moduleIsActive;
		})
		.map((name) => {
			return {
				name:  name,
				init:  Number(_.get(this.config[name], 'priority.init'))  || 0,
				start: Number(_.get(this.config[name], 'priority.start')) || 0,
				stop:  Number(_.get(this.config[name], 'priority.stop'))  || 0,
			};
		});

		Object.keys(order).forEach((step) => {
			order[step] = priorities.sort((a, b) => {
				return a[step] - b[step];
			})
			.map((it) => {
				return it.name;
			});
		});

		return order;
	}

	/**
	 * Recursive function for resolving values from functions
	 * @param confObj
	 * @returns {*}
	 * @private
	 */
	_resolveConfigObj (confObj) {
		if (typeof confObj === 'function') {
			return this._resolveConfigObj(confObj.call(this));

		} else if (typeof confObj === 'object') {
			return _.mapValues(confObj, (it) => {
				return this._resolveConfigObj(it);
			});

		} else if (Array.isArray(confObj)) {
			return confObj.map((it) => {
				return this._resolveConfigObj(it);
			});

		} else {
			return confObj;
		}
	}
};
