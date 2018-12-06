'use strict';

const BaseModule = require('./BaseModule');
const bs58       = require('bs58');
const crypto     = require('crypto');
const util       = require('util');
const _          = require('lodash');


module.exports = class BaseServer extends BaseModule {
	constructor (app, config) {
		super(app, config);

		this.priority = {
			init:  Number(_.get(this.config, 'priority.init'))  || 0,
			start: Number(_.get(this.config, 'priority.start')) || 0,
			close: Number(_.get(this.config, 'priority.close')) || 0,
		};

		const methods = [
			'init',
			'start',
			'stop'
		];

		methods.forEach((method) => {
			if (typeof this[method] !== 'function') {
				throw new Error(`Module class must override method ${method}`);
			}
		});

		this.pre = {
			controller: [],
			auth:       [],
			handler:    [],
			response:   []
		};
	}

	async handleRequest (req) {
		let response;

		req.type      = req.type      || this.type;
		req.startedAt = req.startedAt || Date.now();
		req.id        = req.id        || this.genId();
		req.local     = req.local     || {};

		this.app.logger.http(`${req.type} request.req ${req.id} from ${req.from}: ${req.method} ${req.path}`);

		await this.app.runPre('request', req);

		try {
			this.runPre('controller', req);

			// Select corresponded route and controller
			const route = this.app.modules.router.selectRoute(req);
			const controller = route.controller;

			// Prepare req object {method, path, query, body, params, headers, ip, auth}
			this.app.modules.router.appendReq(req, route);

			this.runPre('auth', req, controller);

			// Run auth
			req.auth = await this.runAuth(req, controller.auth);

			this.runPre('handler', req, controller);

			// Run handler
			response = await controller.handler.call(this.app, req);

			response = await this.runPre('response', req, controller, response);

		} catch (err) {
			if (err.isAppError) {
				this.app.logger.warn(`${req.type} request.err ${req.id}: ${req.method} ${req.path} ${err}`);
			} else {
				this.app.logger.warn(`${req.type} request.err ${req.id}: ${req.method} ${req.path} ${util.inspect(err)}`);
			}

			this.app.logger.warn(`${req.type} request.res ${req.id}: ${req.method} ${req.path} ${Date.now() - req.startedAt} ms`);
			throw err;
		}

		this.app.logger.http(`${req.type} request.res ${req.id}: ${req.method} ${req.path} ${Date.now() - req.startedAt} ms`);

		return response;
	}

	async runAuth (req, authConfig) {
		if (!authConfig) {
			return;
		}

		const authInstance = this.app.auth[authConfig.type];

		let authResult = await authInstance.auth.call(this.app, req, authConfig);

		if (authConfig.mode) {
			authResult = await authInstance[authConfig.mode].call(this.app, req, authConfig, authResult);
		}

		return authResult;
	}

	addPre (type, func) {
		if (typeof func !== 'function') {
			throw new this.app.AppError({
				code:    'INVALID_PRE_FUNCTION',
				message: 'Pre-function must be a function'
			});
		}

		this.pre[type].push(func);
	}

	async runPre (type, ...args) {
		if (type === 'response') {
			let response = args.pop();

			if (this.pre[type]) {
				for (let i = 0; i < this.pre[type].length; i += 1) {
					response = await this.pre[type][i].call(this.app, ...args, response);
				}
			}

			return response;

		} else if (this.pre[type]) {
			for (let i = 0; i < this.pre[type].length; i += 1) {
				await this.pre[type][i].call(this.app, ...args);
			}
		}
	}

	genId () {
		return bs58.encode(crypto.randomBytes(8)).substr(-8) + '_' +  String(Date.now()).substr(-4);
	}
};
