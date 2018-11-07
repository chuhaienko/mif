'use strict';

const {BaseModule} = require('../../');
const express      = require('express');


/* eslint global-require:0 */
module.exports = class WebServer extends BaseModule {
	async init () {
		this.server = express();

		this.server.all('*', this.requestHandler.bind(this));
	}

	async start () {
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
		// TODO: ===
		// Run preController

		// Select corresponded controller

		// Run auth

		// Run preHandler
		// Run handler
		// Run postHandler

		// Run postController

		// send response

		res.send({
			date: new Date()
		});
	}
};
