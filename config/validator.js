'use strict';

module.exports.default = function () {
	return {
		moduleIsActive: true,
		priority:       {
			init:  -990,
			start: -990,
			stop:  -990
		},

		delimiter:  '.',
		depthLimit: 10,
	};
};
