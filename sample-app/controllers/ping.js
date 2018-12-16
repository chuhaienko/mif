'use strict';

module.exports = {
	description: 'Ping controller',

	auth: {
		type: 'basic-auth',
		mode: 'try',
	},

	validate: function (joi) {
		return {
			query: joi.object().keys({
				x: joi.number(),
				y: joi.number(),
			})
		};
	},

	handler: async function (req, params) {
		params.headers['Access-Control-Allow-Origin'] = '*';
		params.status = 201;

		return {
			method: req.method,
			time:   new Date().toISOString(),
			local:  this.local,
			auth:   req.auth,
			query:  req.query
		};
	}
};
