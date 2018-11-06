'use strict';

const {BaseModule, BaseAuth} = require('../../');
const requireDir             = require('require-dir');
const path                   = require('path');


/* eslint global-require:0 */
module.exports = class Auth extends BaseModule {
	async init () {
		this.app.auth = {};

		const authClasses = requireDir(path.resolve(this.app.getDirs().app, 'auth'));

		const modeNames = Object.keys(authClasses);

		for (let i = 0; i < modeNames.length; i += 1) {
			const modeName = modeNames[i];
			const AuthClass = authClasses[modeName];

			if (AuthClass.prototype instanceof BaseAuth) {
				this.app.auth[modeName] = new AuthClass(this.app);
				await this.app.auth[modeName].init();
			} else {
				throw new this.app.AppError({
					code:    'AUTH_IS_INVALID',
					message: `Auth "${modeName}" does not extend BaseAuth`
				});
			}
		}
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}
};
