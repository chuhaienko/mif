'use strict';

module.exports.default = function () {
	return {
		moduleIsActive: true,
		priority:       {
			init:  -980,
			start: -980,
			stop:  -980
		}
	};
};
