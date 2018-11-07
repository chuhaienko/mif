'use strict';

const {BaseModule} = require('../../');
const p            = require('util').promisify;
const Joi          = require('joi');
const http         = require('http');
const path         = require('path');
const glob         = p(require('glob'));
const _            = require('lodash');


/* eslint global-require:0 */
module.exports = class Controllers extends BaseModule {
	async init () {
		this.app.controllers = {};
		this.allowedMethods = http.METHODS.concat('ALL');

		const configSchema = Joi.object().keys({
			description: Joi.string().required(),
			auth:        Joi.object().keys({
				type:   Joi.string().required(),
				method: Joi.string(),
			}).options({allowUnknown: true}),
			validate: [Joi.func(), Joi.object()],
			handler:  Joi.func().required()
		}).options({allowUnknown: true});

		const cwd = path.resolve(this.app._appDir, 'controllers');
		const globOptions = {
			cwd:       cwd,
			matchBase: true,
			absolute:  true
		};

		let files = await glob('*.js', globOptions);
		files.reverse();

		files.forEach((filePath) => {
			let module = require(filePath);

			let controllerPath = filePath.substr(cwd.length);

			if (controllerPath.endsWith('/index.js')) {
				controllerPath = controllerPath.substr(0, controllerPath.length - 9);
			} else if (controllerPath.endsWith('.js')) {
				controllerPath = controllerPath.substr(0, controllerPath.length - 3);
			}

			_.forEach(module, (config, methodName) => {
				if (this.allowedMethods.includes(methodName)) {
					let result = Joi.validate(config, configSchema);

					if (result.error) {
						throw result.error;
					}

					if (config.auth) {
						if (this.app.auth[config.auth.type]) {
							if (config.auth.method) {
								if (typeof this.app.auth[config.auth.type][config.auth.method] !== 'function') {
									throw new this.app.AppError({
										code:    'NO_AUTH_METHOD',
										message: `Controller "${methodName} ${controllerPath}" requires auth method "${config.auth.type}.${config.auth.method}"`
									});
								}
							}
						} else {
							throw new this.app.AppError({
								code:    'NO_AUTH',
								message: `Controller "${methodName} ${controllerPath}" requires auth type "${config.auth.type}"`
							});
						}
					}

					this.app.controllers[`${methodName} ${controllerPath}`] = config;
				}
			});
		});
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}
};
