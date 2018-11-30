'use strict';

exports.POST = {
	description: 'Listen for AuthEvent from APIGateway',

	validate: function (joi) {
		return {
			body: joi.object.keys({

			})
		};
	},

	handler: function (req) {
		req.logger.info('Catch Auth Event');
		req.logger.info(req.body);
	}
};
