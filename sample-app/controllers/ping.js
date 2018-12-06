'use strict';

module.exports = {
	description: 'Ping controller',

	auth: {
		type: 'basic-auth',
		mode: 'try',
	},

	handler: async function (req) {
		return {
			method: req.method,
			time:   new Date().toISOString(),
			local:  this.local,
			auth:   req.auth
		};
	}
};
