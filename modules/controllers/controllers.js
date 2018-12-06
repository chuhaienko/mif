'use strict';

const {BaseModule} = require('../../');
const p            = require('util').promisify;
const joi          = require('joi');
const path         = require('path');
const glob         = p(require('glob'));
const _            = require('lodash');


/* eslint global-require:0 */
module.exports = class Controllers extends BaseModule {
	async init () {
		this.app.controllers = {};

		const controllerSchema = joi.object().keys({
			description: joi.string().required(),
			auth:        joi.object().keys({
				type:   joi.string().required(),
				method: joi.string(),
			}).options({allowUnknown: true}),
			validate: [joi.func(), joi.object()],
			handler:  joi.func().required()
		}).options({allowUnknown: true});

		const cwd = path.resolve(this.app._appDir, 'controllers');
		const globOptions = {
			cwd:       cwd,
			matchBase: true,
			absolute:  true
		};

		let files = await glob('*.js', globOptions);

		files.forEach((filePath) => {
			let controller = require(filePath);

			let controllerPath = filePath.substr(cwd.length + 1, filePath.length - cwd.length - 4);
			let pathParts = controllerPath.split(/[\\/]/);

			let result = joi.validate(controller, controllerSchema);

			if (result.error) {
				throw result.error;
			}

			controller = result.value;

			if (controller.auth) {
				if (this.app.auth[controller.auth.type]) {
					if (controller.auth.method) {
						if (typeof this.app.auth[controller.auth.type][controller.auth.method] !== 'function') {
							throw new this.app.AppError({
								code:    'NO_AUTH_METHOD',
								message: `Controller "${controllerPath}" requires auth method "${controller.auth.type}.${controller.auth.method}"`
							});
						}
					}
				} else {
					throw new this.app.AppError({
						code:    'NO_AUTH',
						message: `Controller "${controllerPath}" requires auth type "${controller.auth.type}"`
					});
				}
			}

			this.app.logger.info(`controller >>> ${pathParts.join('.')} ${controller.description}`);

			_.set(this.app.controllers, pathParts, controller);
		});
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}
};
