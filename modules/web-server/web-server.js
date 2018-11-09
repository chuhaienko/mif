'use strict';

const {BaseModule} = require('../../');
const express      = require('express');
const bs58         = require('bs58');
const crypto       = require('crypto');
const util         = require('util');


/* eslint global-require:0 */
module.exports = class WebServer extends BaseModule {
	async init () {
		this.server = express();

		this.server.use(express.json({
			limit: this.config.bodyLimit
		}));
		this.server.use(express.urlencoded({
			extended: false,
			limit:    this.config.bodyLimit
		}));
	}

	async start () {
		this.server.all('*', this.requestHandler.bind(this));

		await new Promise((resolve, reject) => {
			this.netServer = this.server.listen(this.config.port, () => {
				this.netServer.removeAllListeners('error');

				let addr = this.netServer.address();
				this.app.logger.info(`=== === === WebServer started on ${addr.family} ${addr.address}:${addr.port}`);
				return resolve();
			});

			this.netServer.on('error', (err) => {
				return reject(new this.app.AppError({
					code:    'WEBSERVER_ERROR',
					message: err.message,
					details: {
						error: err
					}
				}));
			});
		});
	}

	async stop () {
		await new Promise((resolve, reject) => {
			this.netServer.close((err) => {
				if (err) {
					return reject(err);
				} else {
					return resolve();
				}
			});
		});
	}

	async requestHandler (req, res) {
		let result;

		req.startedAt = Date.now();
		req.id = bs58.encode(crypto.randomBytes(8)).substr(-8) + '-' +  String(Date.now()).substr(-4);

		this.app.logger.http(`<-- ${req.ip} ${req.method} ${req.path} ${req.id}`);

		try {
			// Run preController

			// Select corresponded controller
			const controller = this.selectController(req);

			// Prepare req object {method, path, query, body, params, headers, ip, auth}
			this.prepareReqParams(req, controller);

			// Run auth
			req.auth = await this.runAuth(req, controller.auth);

			// Run preHandler

			// Run handler
			result = await controller.handler.call(this.app, req, res);

			// Run postHandler

		} catch (err) {
			if (!res.headersSent) {
				let error;

				if (err.isAppError) {
					error = err;
				} else {
					this.app.logger.error(util.inspect(err));

					error = new this.app.AppError({
						code: 500
					});
				}

				res.status(Number(error.code) || 400);
				result = error;
			}
		}

		// Run postController

		// Send response
		if (!res.headersSent) {
			let logger = this.app.logger.http;

			if (result instanceof Error) {
				if (res.statusCode >= 500) {
					logger = this.app.logger.error;
					logger(JSON.stringify(result));

				} else {
					logger = this.app.logger.warn;
					logger(JSON.stringify(result));
				}
			}

			logger(`--> ${req.ip} ${req.method} ${req.path} ${req.id} ${res.statusCode} ${Date.now() - req.startedAt} ms`);

			return res.send(result);
		}
	}

	/**
	 * Return matched controller or throw error with code 404 or 405
	 * @param req
	 * @returns {*}
	 */
	selectController (req) {
		let pathIsExists = false;

		req.pathParts = req.path.split('/');

		let selected;

		for (let i = 0; i < this.app.controllers.length; i += 1) {
			let controller = this.app.controllers[i];

			// Compare paths lengths
			if (req.pathParts.length === controller._pathParts.length) {

				// Compare paths
				let pathIsMatched = req.pathParts.every((pathPart, i) => {
					let controllerPart = controller._pathParts[i];

					if (controllerPart.startsWith(':')) {
						return true;
					} else if (controllerPart === pathPart) {
						return true;
					} else {
						return false;
					}
				});

				if (pathIsMatched) {
					pathIsExists = true;

					if (controller._method === req.method || controller._method === 'ALL') {
						selected = controller; // Our controller
						break;
					}
				} else { // Path is exists but there is not corresponded method
					if (pathIsExists) {
						break;
					}
				}
			}
		}

		if (selected) {
			return selected;
		} else {
			throw new this.app.AppError({
				code: (pathIsExists ? 405 : 404)
			});
		}
	}

	prepareReqParams (req, controller) {
		for (let i = 0; i < controller._pathParts.length; i += 1) {
			const pathPart = controller._pathParts[i];

			if (pathPart.startsWith(':')) {
				let paramName = pathPart.substr(1);

				req.params[paramName] = req.pathParts[i];
			}
		}
	}

	async runAuth (req, authConfig) {
		if (!authConfig) {
			return;
		}

		const authInstance = this.app.auth[authConfig.type];

		let authResult = await authInstance.auth.call(this.app, req, authConfig);

		if (authConfig.method) {
			authResult = await authInstance[authConfig.method].call(this.app, req, authConfig, authResult);
		}

		return authResult;
	}
};
