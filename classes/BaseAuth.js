'use strict';

const Base = require('./Base');


module.exports = class BaseAuth extends Base {
	constructor (app) {
		super(app);

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
