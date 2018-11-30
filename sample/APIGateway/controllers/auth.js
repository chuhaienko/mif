'use strict';

exports.POST = {
	description: 'Check auth credentials',

	validate: (joi) => {
		return {
			body: joi.object.keys({
				user: joi.string().required(),
				pass: joi.string().required(),
			})
		};
	},

	handler: function (req) {
		if (req.body.user === 'mif' && req.body.pass === 'password') {
			req.services.publish('AuthEvent', {
				login:   req.body.user,
				success: true
			});

			return {
				id:    1,
				login: 'mif',
				scope: ['user']
			};

		} else {
			req.services.publish('AuthEvent', {
				login:   req.body.user,
				success: false
			});

			throw new this.AppError({
				code: 401
			});
		}
	}
};
