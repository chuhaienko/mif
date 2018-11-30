'use strict';

module.exports.default = function () {
	return {
		moduleIsActive: true,
		priority:       {
			init:  -900,
			start: -900,
			stop:  -900
		},

		prefetch: 10,

		subscribersOnce: true,

		port:  5672,
		proto: 'amqp',
		host:  'localhost',
		user:  undefined,
		pass:  undefined,
	};
};
