'use strict';

const requireDir = require('require-dir');
const path       = require('path');
const AppError   = require('./AppError');
const BaseModule = require('./BaseModule');
const _          = require('lodash');


module.exports = class Framework {
	constructor () {
		this.appDir = process.env.PWD;
		this.mifDir = path.resolve(__dirname, '../');
		this.nodeEnv = process.env.NODE_ENV;

		this.config  = {};
		this.modules = {};

		this.AppError = AppError;

		this.flags = {
			isStopping: false
		};
	}

	async init () {
		let mifConfig = this._loadConfigs(path.resolve(this.mifDir, 'config'));
		let appConfig = this._loadConfigs(path.resolve(this.appDir, 'config'));
		this.config = _.merge(mifConfig, appConfig);

		this.modules = this._loadModules();

		this.modulesOrder = this._getModulesOrder();

		// Init modules
		let modulesNames = this.modulesOrder.init;
		for (let i = 0; i < modulesNames.length; i += 1) {
			const module = this.modules[modulesNames[i]];

			this.logger && this.logger.info(`Module ${modulesNames[i]} is initing`);
			await module.init();
			this.logger && this.logger.info(`Module ${modulesNames[i]} is inited`);
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
		if (!this.flags.isStopping) {
			this.flags.isStopping = true;
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
					config.default = Framework.resolveConfigObj(confObj.default);
				}

				if (confObj[this.nodeEnv]) {
					config[this.nodeEnv] = Framework.resolveConfigObj(confObj[this.nodeEnv]);
				}

				return _.merge(config.default, config[this.nodeEnv]);
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
				let modulePath = path.resolve(this.appDir, `modules/${name}/${name}.js`);
				Module = require(modulePath);
			} catch (appErr) {
				try {
					let modulePath = path.resolve(this.mifDir, `modules/${name}/${name}.js`);
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
	 */
	static resolveConfigObj (confObj) {
		if (typeof confObj === 'function') {
			return Framework.resolveConfigObj(confObj());
		} else if (typeof confObj === 'object') {
			return _.mapValues(confObj, Framework.resolveConfigObj);
		} else if (Array.isArray(confObj)) {
			return confObj.map(Framework.resolveConfigObj);
		} else {
			return confObj;
		}
	}
};
