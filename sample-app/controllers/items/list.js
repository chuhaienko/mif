'use strict';

module.exports = {
	description: 'Get list of items',
	auth:        {
		type:   'basic-auth',
		method: 'try',
	},

	handler: function () {
		return this.local.items;
	}
};
