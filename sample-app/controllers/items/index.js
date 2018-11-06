'use strict';

exports.GET = {
	description: 'Get list of items',
	auth:        {
		type: 'try'
	},

	handler: function () {
		return this.misc.items;
	}
};

exports.POST = {
	description: 'Save item',
	auth:        {
		type:  'required',
		scope: ['user']
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
		this.misc.items.push({
			userId:    req.user && req.user.id,
			title:     req.body.title,
			price:     req.body.price,
			createdAt: new Date()
		});

		return {
			id: this.misc.items.length - 1
		};
	}
};
