'use strict';

module.exports = function () {
	return [
		['ALL', '/ping', this.controllers.ping],
	];
};
