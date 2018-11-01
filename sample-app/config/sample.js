'use strict';

module.exports.default = function () {
	return {
		startedAt:      this._startedAt,
		varFromEnv:     this.env('PORT', 1023),
		varFromJSONEnv: this.env('JSON.KEY', 123)
	};
};
