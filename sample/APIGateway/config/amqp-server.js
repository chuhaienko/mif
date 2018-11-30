'use strict';

module.exports.default = function () {
	return {
		moduleIsActive: true,
		priority:       {
			init:  -900,
			start: -900,
			stop:  -900
		},

		subscribersOnce: false,
	};
};
