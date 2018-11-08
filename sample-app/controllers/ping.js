'use strict';

exports.PUT = {
	description: 'Ping controller for PUT',
	auth:        {
		type:   'basic-auth',
		method: 'try',
	},

	handler: function (req) {
		return {
			method: req.method,
			time:   new Date().toISOString(),
			misc:   this.misc
		};
	}
};

exports.ALL = {
	description: 'Ping controller',
	auth:        {
		type:   'basic-auth',
		method: 'try',
	},

	handler: function (req) {
		return {
			method: req.method,
			time:   new Date().toISOString(),
			misc:   this.misc
		};
	}
};
