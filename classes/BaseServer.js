'use strict';

const BaseModule = require('./BaseModule');
const bs58       = require('bs58');
const crypto     = require('crypto');
const util       = require('util');
const _          = require('lodash');

const KEYS_FOR_VALIDATION = ['body', 'query', 'headers', 'params'];
const VALIDATION_OPTIONS = {
	abortEarly:   false,
	stripUnknown: true
};


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

	async handleRequest (req, params) {
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

			// Validate req
			this.validate(req, controller);

			this.runPre('auth', req, controller);

			// Run auth
			req.auth = await this.runAuth(req, controller.auth);

			this.runPre('handler', req, controller);

			// Run handler
			response = await controller.handler.call(this.app, req, params);

			response = await this.runPre('response', req, controller, response, params);

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
			let params = args.pop();
			let response = args.pop();

			if (this.pre[type]) {
				for (let i = 0; i < this.pre[type].length; i += 1) {
					response = await this.pre[type][i].call(this.app, ...args, response, params);
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

	validate (req, controller) {
		let schema;

		if (typeof controller.validate === 'function') {
			// Compile and cache
			schema = controller.validate(this.app.validator);
			controller.validate = schema;

		} else if (typeof controller.validate === 'object') {
			schema = controller.validate;
		}

		KEYS_FOR_VALIDATION.forEach((key) => {
			if (!schema || !schema[key]) {
				return;
			}

			let validationResult = this.app.validator.validate(req[key], schema[key], VALIDATION_OPTIONS);
			req[key] = validationResult.value;

			if (validationResult.error) {
				validationResult.error.source = key;
				throw new this.app.AppError({
					code:    400,
					message: `Wrong values in ${key}`,
					details: _.get(validationResult.error, ['details', 0, 'message'])
				});
			}
		});
	}
};
