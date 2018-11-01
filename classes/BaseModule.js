'use strict';

const _ = require('lodash');


module.exports = class BaseModule {
	constructor (app, config) {
		this.app    = app;
		this.config = config;

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
