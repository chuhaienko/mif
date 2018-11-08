'use strict';

const {BaseModule} = require('../../');
const express      = require('express');


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
		try {
			// Run preController

			// Select corresponded controller
			const controller = this.selectController(req);

			// Prepare req object
			// {method, path, query, body, params, headers, ip}
			this.prepareReqParams(req, controller);

			// Run auth

			// Run preHandler
			// Run handler
			// Run postHandler

			// Run postController

			// send response
			return res.send({
				date: new Date()
			});
		} catch (err) {
			return res.send(this.app.AppError.from(err));
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
};
