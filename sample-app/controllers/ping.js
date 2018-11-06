'use strict';

exports.ALL = {
	description: 'Ping controller',
	auth:        {
		type: 'required'
	},

	handler: function (req) {
		return {
			method: req.method,
			time:   new Date().toISOString(),
			misc:   this.misc
		};
	}
};
