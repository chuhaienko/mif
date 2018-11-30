'use strict';

exports.GET = {
	description: 'Return item by id',
	auth:        {
		type:   'basic-auth',
		method: 'try',
	},

	validate: (joi) => {
		return {
			params: joi.object.keys({
				id: joi.number().integer().required()
			})
		};
	},

	handler: function (req) {
		return this.local.items[req.params.id];
	}
};
