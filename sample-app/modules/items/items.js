'use strict';

const {BaseModule} = require('mif');

module.exports = class Items extends BaseModule {
	async init () {
		this.app.misc.items = [];
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}
};
