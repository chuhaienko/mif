'use strict';

module.exports.default = function () {
	return {
		moduleIsActive: true,
		priority:       {
			init:  -970,
			start: -970,
			stop:  -970
		}
	};
};
