'use strict';

const {BaseServer} = require('../../');
const Poster       = require('amqp-poster');
const {resolve}    = require('path');
const p            = require('util').promisify;
const glob         = p(require('glob'));


/* eslint global-require:0 */
module.exports = class AMQPServer extends BaseServer {
	async init () {
		// Prepare subscribers
		const dirPath = resolve(this.app._appDir, 'controllers/_subscribers/');
		const subscribers = await glob('*.js', {
			cwd:       dirPath,
			matchBase: true,
			absolute:  true
		});

		this.app.logger.info(`amqp-server >>> server ${this.app.name}`);

		// Init server
		this.server = new Poster({
			name:     this.app.name,
			uid:      String(process.pid),
			prefetch: this.config.prefetch,
			server:   {
				port:     this.config.port,
				protocol: this.config.proto,
				hostname: this.config.host,
				username: this.config.user,
				password: this.config.pass
			},
			subscribe: subscribers.map((subscriber) => {
				let exchangeName = subscriber.substring(dirPath.length + 1, subscriber.length - 3);
				exchangeName = exchangeName.replace(/[\\/]/g, '_');

				this.app.logger.info(`amqp-server >>> subscriber ${exchangeName}`);

				return {
					exchange:       exchangeName,
					oncePerService: this.config.subscribersOnce
				};
			})
		});

		this.app.services = {
			request: this.request.bind(this, {}),
			publish: this.publish.bind(this, {}),
		};

		this.app.addPre('request', this.preRequest.bind(this));

		this.type = 'amqp';
	}

	async start () {
		await this.server.init();
		this.server.setMessageHandler(this._requestHandler.bind(this));
		this.server.setBroadcastHandler(this._requestHandler.bind(this));
	}

	async stop () {
		await this.server.close();
	}

	async _requestHandler (message) {
		const req = {
			method: message.method,
			path:   message.path,
			body:   message.body,
			id:     message.reqId,
			ip:     message.ip,
			auth:   message.auth,
			caller: message.caller
		};

		req.from = req.caller;

		return this.handleRequest(req);
	}

	request (req, serviceName, method, path, body) {
		const logger = (req.logger || this.app.logger);
		const createdAt = Date.now();
		const reqId = req.id || this.genId();

		method = String(method).toUpperCase();

		logger.info(`AMQP.REQ --> ${serviceName} ${method} ${path}`);

		return this.server.send(serviceName, {
			method: method,
			path:   path,
			body:   body,
			reqId:  reqId,
			ip:     req.ip,
			auth:   req.auth,
			caller: this.app.name,
		})
		.then((res) => {
			logger.info(`AMQP.RES <-- ${serviceName} ${method} ${path} ${Date.now() - createdAt} ms`);
			return res;
		})
		.catch((err) => {
			if (err.isAppError) {
				err = this.app.AppError.from(err);
			}

			logger.warn(`AMQP.ERR <-- ${serviceName} ${method} ${path} ${err} ${Date.now() - createdAt} ms`);
			throw this.app.AppError.from(err);
		});
	}

	publish (req, to, body) {
		const logger = (req.logger || this.app.logger);
		const reqId = req.id || this.genId();

		logger.info(`AMQP.PUB --> ${to} ${reqId}`);

		const exchangeName = `${this.app.name}_${to}`;
		const path         = `/_subscribers/${exchangeName.replace(/_/g, '/')}`;
		return this.server.publish(exchangeName, {
			method: 'POST',
			path:   path,
			body:   body,
			reqId:  reqId,
			ip:     req.ip,
			auth:   req.auth,
			caller: this.app.name,
		});
	}

	preRequest (req) {
		req.services = {
			request: this.request.bind(this, req),
			publish: this.publish.bind(this, req),
		};
	}
};
