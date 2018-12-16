'use strict';

const {BaseServer} = require('../../');
const express      = require('express');
const _            = require('lodash');


/* eslint global-require:0 */
module.exports = class WebServer extends BaseServer {
	async init () {
		this.server = express();

		this.server.use(express.json({
			limit: this.config.bodyLimit
		}));
		this.server.use(express.urlencoded({
			extended: false,
			limit:    this.config.bodyLimit
		}));

		this.type = 'web';
	}

	async start () {
		this.server.all('*', this._requestHandler.bind(this));

		await new Promise((resolve, reject) => {
			this.app.logger.info(`web-server >>> server ${this.config.port}`);

			this.netServer = this.server.listen(this.config.port, () => {
				this.netServer.removeAllListeners('error');

				let addr = this.netServer.address();
				this.app.logger.info(`web-server >>> started on ${addr.family} ${addr.address}:${addr.port}`);
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

	async _requestHandler (req, res) {
		let response;
		let params = {
			headers: {},
			status:  undefined
		};

		try {
			req.from = req.ip;

			response = await this.handleRequest(req, params);
		} catch (err) {
			response = err;
		}

		// Send response
		if (response instanceof Error) {
			if (response instanceof this.app.AppError) {
				if (Number(response.code) < 500) {
					res.status(Number(response.code));
				} else {
					res.status(500);
				}
			} else {
				res.status(500);
				response = this.app.AppError.from(response);
			}
		}

		// Set headers
		_.each(params.headers, (value, name) => {
			res.set(String(name), String(value));
		});

		// Set status if exists
		if (Number(params.status)) {
			res.status(Number(params.status));
		}

		/* eslint callback-return: 0 */
		res.send(response);
	}
};
