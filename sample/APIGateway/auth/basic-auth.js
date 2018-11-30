'use strict';

const {BaseAuth} = require('mif');


module.exports = class BasicAuth extends BaseAuth {
	async init () {
		// do nothing
	}

	async auth (req, authConfig) {
		let credentials = String(req.headers['authorization']).split(' ');

		if (credentials && credentials.length === 2) {
			credentials = Buffer.from(credentials[1], 'base64').toString().split(':');

			if (credentials && credentials.length === 2) {
				let [user, pass] = credentials;

				return req.services.request('APIGateway', 'POST', '/auth', {
					user: user,
					pass: pass
				});
			}
		}
	}

	async try (req, authConfig, authResult) {
		return authResult;
	}

	async required (req, authConfig, authResult) {
		if (!authResult) {
			throw new this.AppError({
				code: 401
			});
		} else {
			return authResult;
		}
	}
};
