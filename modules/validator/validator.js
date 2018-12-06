'use strict';

const {BaseModule} = require('../../');
const joi          = require('joi');


/* eslint global-require:0 */
module.exports = class Validator extends BaseModule {
	async init () {
		this.app.validator = joi.extend((joi) => {
			return {
				base:     joi.string(),
				name:     'string',
				language: {
					objectId: 'needs to be a valid objectId value',
					password: 'needs to be a strong password (minimum 8 chars)'
				},
				rules: [{
					name: 'objectId',
					validate (params, value, state, options) {
						if (!/^[0-9a-f]{24}$/i.test(value)) {
							return this.createError('string.objectId', { v: value, q: params.q }, state, options);
						}

						return value;
					}
				}, {
					name: 'password',
					validate (params, value, state, options) {
						if (value.length < 8) { // Less then minimum length
							return this.createError('string.password', { v: value, q: params.q }, state, options);
						}

						return value;
					}
				}]
			};
		});

		this.app.validator = this.app.validator.extend((joi) => {
			return {
				base:  joi.object(),
				name:  'object',
				rules: [{
					name: 'toOneLevelObject',
					validate (params, value, state, options) {
						return toOneLevelObject(value, this.config.depthLimit);
					}
				}]
			};
		});
	}

	async start () {
		// do nothing
	}

	async stop () {
		// do nothing
	}
};


function toOneLevelObject (obj, delimiter = '.', depthLimit) {
	if (!isPlainObject(obj)) {
		return obj;
	}

	let path = [];
	let oneLevelObj = {};

	goDeeper(obj);

	function goDeeper (obj) {
		if (isPlainObject(obj)) {
			Object.keys(obj).forEach((key) => {
				path.push(key);
				let it = obj[key];

				if (isPlainObject(it)) {
					if (depthLimit <= path.length) {
						oneLevelObj[path.join(delimiter)] = String(it);
					} else {
						goDeeper(it);
					}
				} else {
					oneLevelObj[path.join(delimiter)] = it;
				}
				path.pop();
			});
		} else {
			oneLevelObj[path.join(delimiter)] = it;
			path.pop();
		}
	}

	return oneLevelObj;
}

function isPlainObject (obj) {
	return (obj && typeof obj === 'object' && obj.constructor === Object);
}
