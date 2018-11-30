'use strict';
process.env.NODE_ENV = 'test';

const {App} = require('mif');

const app = new App();

exports.app = app;
