'use strict';

module.exports = function () {
	return [
		['POST', '/_subscribers/APIGateway/AuthEvent', this.controllers._subscribers.APIGateway.AuthEvent],
	];
};
