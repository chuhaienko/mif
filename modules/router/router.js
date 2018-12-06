'use strict';

const {BaseModule} = require('../../');
const path         = require('path');
const requireDir   = require('require-dir');
const joi          = require('joi');
const http         = require('http');
const _            = require('lodash');


/* eslint global-require:0 */
module.exports = class Router extends BaseModule {
	async init () {
		this.app.routes = [];

		const routeSchema = joi.object().keys({
			method:     joi.string().valid(['ALL'].concat(http.METHODS)).required(),
			path:       joi.string().required(),
			controller: joi.object().keys({
				handler: joi.func().required()
			}).options({allowUnknown: true}).required(),
		});

		let routes = {};

		try {
			routes = requireDir(path.resolve(this.app.getDirs().app, 'routes'));
		} catch (err) {
			routes = {};
		}

		_.each(routes, (routesFn, name) => {
			if (typeof routesFn !== 'function') {
				throw new this.app.AppError({
					code:    'INVALID_ROUTES',
					message: `Route file ${name} must exports function`
				});
			}

			const routesArr = routesFn.call(this.app);

			if (!Array.isArray(routesArr)) {
				throw new this.app.AppError({
					code:    'INVALID_ROUTES',
					message: `Route file ${name} must exports function return array of routes`
				});
			}

			routesArr.forEach((route, i) => {
				let routeObj;

				if (Array.isArray(route) && route.length === 3) {
					routeObj = {
						method:     route[0],
						path:       route[1],
						controller: route[2]
					};
				} else if (route.method && route.path && route.controller) {
					routeObj = {
						method:     route.method,
						path:       route.path,
						controller: route.controller
					};
				} else {
					throw new this.app.AppError({
						code:    'INVALID_ROUTE',
						message: `Route file ${name} contains invalid route by index ${i}`
					});
				}

				let result = joi.validate(routeObj, routeSchema);

				if (result.error) {
					throw new this.app.AppError({
						code:    'INVALID_ROUTE',
						message: `Route file ${name} contains invalid route by index ${i}`,
						details: {
							err: result.error.message
						}
					});
				}

				this.app.routes.push(result.value);
			});
		});

		this._sortRoutes();
		this._prepareRoutes();
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}

	/**
	 * Return matched route or throw error with code 404 or 405
	 * Match controller by req.method and req.path
	 * @param req
	 * @returns {*}
	 */
	selectRoute (req) {
		let pathIsExists = false;

		req.pathParts = req.path.split('/');

		let matchedRoute;

		for (let i = 0; i < this.app.routes.length; i += 1) {
			let route = this.app.routes[i];

			// Compare paths lengths
			if (req.pathParts.length === route.pathParts.length) {

				// Compare paths
				let pathIsMatched = req.pathParts.every((pathPart, i) => {
					let routerPath = route.pathParts[i];

					if (routerPath.startsWith(':')) {
						return true;
					} else if (routerPath === pathPart) {
						return true;
					} else {
						return false;
					}
				});

				if (pathIsMatched) {
					pathIsExists = true;

					if (route.method === req.method || route.method === 'ALL') {
						matchedRoute = route; // Our controller
						break;
					}

				} else { // Path is exists but there is not corresponded method
					if (pathIsExists) {
						break;
					}
				}
			}
		}

		if (matchedRoute) {
			return matchedRoute;
		} else {
			if (pathIsExists) {
				throw new this.app.AppError({
					code:    405,
					message: `Method Not Allowed for Path ${req.path}`
				});
			} else {
				throw new this.app.AppError({
					code:    404,
					message: `Not Found Path ${req.path}`
				});
			}
		}
	}

	/**
	 * Append req object with necessary data (e.g. params)
	 * @param req
	 * @param route
	 */
	appendReq (req, route) {
		for (let i = 0; i < route.pathParts.length; i += 1) {
			const pathPart = route.pathParts[i];

			if (pathPart.startsWith(':')) {
				let paramName = pathPart.substr(1);

				req.params[paramName] = req.pathParts[i];
			}
		}
	}

	_sortRoutes () {
		this.app.routes.sort((a, b) => { // Move routes with method ALL to end of list
			return a.method === 'ALL';
		});

		this.app.routes.sort((a, b) => { // Sort routers by path
			return a.path > b.path;
		});
	}

	_prepareRoutes () {
		this.app.routes.forEach((route) => {
			route.pathParts = this._getPathParts(route.path);
		});
	}

	_getPathParts (urlPath) {
		let parts = urlPath.split('/');

		return parts;
	}
};
