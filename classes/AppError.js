'use strict';

const http = require('http');


module.exports = class AppError extends Error {
	constructor (data) {
		super();
		Error.captureStackTrace(this, this.constructor);

		this.isAppError = true;
		this.message = data.message;
		this.code    = data.code;
		this.details = data.details;

		if (typeof this.code === 'number' && !this.message) {
			this.message = http.STATUS_CODES[this.code] || '';
		}
	}

	static from (err) {
		if (err.isAppError) {
			return err;
		} else {
			return new AppError(err);
		}
	}
};
