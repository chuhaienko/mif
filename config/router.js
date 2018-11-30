'use strict';

module.exports.default = function () {
	return {
		moduleIsActive: true,
		priority:       {
			init:  -960,
			start: -960,
			stop:  -960
		}
	};
};
