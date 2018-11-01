'use strict';

const winston      = require('winston');
const moment       = require('moment');
const {BaseModule} = require('../../index');

/**
 * Logger module
 * It exposes `logger` to `this`
 */
class Logger extends BaseModule {
	constructor (app, config) {
		super(app, config);
	}

	async init () {
		winston.addColors({
			emerg:  'bold yellow bgRed',
			alert:  'yellow bgRed',
			crit:   'red bgYellow',
			error:  'red',
			warn:   'yellow',
			notice: 'green',
			info:   'blue',
			debug:  'cyan'
		});
		const loggerFormat = winston.format.printf((data) => {
			return `${moment().format(this.config.timeFormat)} ${data.level}: ${data.message}`;
		});
		this.app.logger = winston.createLogger({
			level:  (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
			levels: winston.config.syslog.levels,
			format: winston.format.combine(
				winston.format.colorize(),
				loggerFormat
			),
			transports: [
				new winston.transports.Console()
			]
		});

		this.app.logger.info('Init module: logger');
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
