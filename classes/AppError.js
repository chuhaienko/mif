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
		if (err.isAppError && err instanceof AppError) {
			return err;
		} else {
			return new AppError(err);
		}
	}

	toJSON () {
		return {
			code:    this.code,
			message: this.message,
			details: this.details
		};
	}

	toString () {
		return `AppError: {code: ${JSON.stringify(this.code)}, message: ${JSON.stringify(this.message)}, details: ${JSON.stringify(this.details)}}`;
	}
};
