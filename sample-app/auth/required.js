'use strict';

const {BaseAuth} = require('mif');


module.exports = class RequiredAuth extends BaseAuth {
	async init () {
		// do nothing
	}

	async auth (req, authConfig) {

	}
};
