'use strict';

module.exports = function () {
	return [
		['POST', '/auth', this.controllers.auth],
	];
};
