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
		this.logger = winston.createLogger({
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

		this.app.logger = {};
		Object.keys(winston.config.npm.levels).forEach((level) => {
			this.app.logger[level] = this.log.bind(this, level);
			this.app.logger[level](`${level} message`);
		});

		this.app.addPre('request', this.preRequest.bind(this));

		this.app.logger.info('Module logger is initialized');
	}

	async start () {
		// Do nothing
	}

	async stop () {
		// do nothing
	}

	preRequest (req) {
		req.logger = {};

		Object.keys(this.logger.levels).forEach((level) => {
			req.logger[level] = this.log.bind(this, level, `[${req.id}]`);
		});
	}

	log (level, ...args) {
		let message = args.map((arg) => {
			if (typeof arg === 'string') {
				return arg;
			} else {
				return JSON.stringify(arg);
			}
		})
		.join(' ');

		this.logger[level](message);
	}
}

module.exports = Logger;
