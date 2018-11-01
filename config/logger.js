'use strict';

module.exports.default = function () {
	return {
		moduleIsActive: true,
		priority:       {
			init:  -1000,
			start: -1000,
			stop:  -1000,
		},
		timeFormat: 'YYYY-MM-HH HH:mm:ss.SSS Z'
	};
};

module.exports.staging = function () {
};

module.exports.production = {
};

module.exports.test = {
};
