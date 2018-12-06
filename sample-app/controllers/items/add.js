'use strict';

module.exports = {
	description: 'Save item',
	auth:        {
		type:   'basic-auth',
		method: 'required',
		scope:  ['user'],
	},

	validate: (joi) => {
		return {
			body: joi.object.keys({
				title: joi.string().required(),
				price: joi.number().integer().positive().required(),
			})
		};
	},

	handler: function (req) {
		this.local.items.push({
			userId:    req.user && req.user.id,
			title:     req.body.title,
			price:     req.body.price,
			createdAt: new Date()
		});

		return {
			id: this.local.items.length - 1
		};
	}
};
