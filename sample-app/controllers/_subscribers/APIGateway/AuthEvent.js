'use strict';

module.exports = {
	description: 'Listen for AuthEvent from APIGateway',

	handler: function (req) {
		req.logger.info('Catch Auth Event');
		req.logger.info(req.body);
	}
};
