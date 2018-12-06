'use strict';

const {BaseModule} = require('mif');

module.exports = class Items extends BaseModule {
	async init () {
		this.app.local.items = [];
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}
};
