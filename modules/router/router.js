'use strict';

const {BaseModule} = require('../../');


/* eslint global-require:0 */
module.exports = class Router extends BaseModule {
	async init () {
		// do nothing
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}

	/**
	 * Return matched controller or throw error with code 404 or 405
	 * Match controller by req.method and req.path
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

	/**
	 * Append req object with necessary data (e.g. params)
	 * @param req
	 * @param controller
	 */
	appendReq (req, controller) {
		for (let i = 0; i < controller._pathParts.length; i += 1) {
			const pathPart = controller._pathParts[i];

			if (pathPart.startsWith(':')) {
				let paramName = pathPart.substr(1);

				req.params[paramName] = req.pathParts[i];
			}
		}
	}
};
