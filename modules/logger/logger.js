'use strict';

const winston      = require('winston');
const moment       = require('moment');
const {BaseModule} = require('../../index');

/**
 * Logger module
 * It exposes `logger` to `this`
 */
class Logger extends BaseModule {
	async init () {
		winston.addColors({
			error:   'red',
			warn:    'yellow',
			info:    'blue',
			http:    'green',
			verbose: 'green whiteBG',
			debug:   'blue whiteBG',
			silly:   'yellow whiteBG',
		});
		const loggerFormat = winston.format.printf((data) => {
			return `${moment().format(this.config.timeFormat)} ${data.level}: ${data.message}`;
		});
		this.app.logger = winston.createLogger({
			level:  (process.env.NODE_ENV === 'production' ? 'info' : 'silly'),
			levels: winston.config.npm.levels,
			format: winston.format.combine(
				winston.format.colorize(),
				loggerFormat
			),
			transports: [
				new winston.transports.Console()
			]
		});

		Object.keys(winston.config.npm.levels).forEach((level) => {
			this.app.logger[level](`${level} message`);
		});

		this.app.logger.info('Module logger is initialized');
	}

	async start () {
		// Do nothing
	}

	async stop () {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	}
}

module.exports = Logger;
