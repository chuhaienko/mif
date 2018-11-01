'use strict';

module.exports = class AppError extends Error {
	constructor (data) {
		super();
		Error.captureStackTrace(this, this.constructor);

		this.isAppError = true;
		this.message = data.message;
		this.code    = data.code;
		this.details = data.details;
	}
};
