'use strict';

const Base = require('./Base');
const _    = require('lodash');


module.exports = class BaseModule extends Base {
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
	}
};
