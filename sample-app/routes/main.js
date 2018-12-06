'use strict';

module.exports = function () {
	return [
		['GET',    '/items',     this.controllers.items.list],
		['GET',    '/items/:id', this.controllers.items.show],
		['POST',   '/items',     this.controllers.items.add],
	];
};
