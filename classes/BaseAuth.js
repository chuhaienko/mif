'use strict';

module.exports = class BaseModule {
	constructor (app) {
		this.app = app;

		const methods = [
			'init',
			'auth'
		];

		methods.forEach((method) => {
			if (typeof this[method] !== 'function') {
				throw new Error(`Auth class must override method ${method}`);
			}
		});
	}
};
