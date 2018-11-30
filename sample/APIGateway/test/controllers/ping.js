'use strict';

const helper  = require('../helper');
const expect  = require('code').expect;
const request = require('request-promise');


describe('/ping', function () {
	before(async () => {
		await helper.app.init();
		await helper.app.start();
	});

	after(async () => {
		await helper.app.stop();
	});

	it('Request without credentials', async () => {
		let resp = await request({
			method: 'GET',
			url:    'http://localhost:8080/ping',
			json:   true
		});

		expect(resp).includes({
			method: 'GET',
			local:  {
				items: []
			}
		});
	});

	it('Request with wrong credentials', async () => {
		try {
			await request({
				method: 'GET',
				url:    'http://localhost:8080/ping',
				json:   true,
				auth:   {
					user: 'mif',
					pass: 'wrong password'
				}
			});

			throw new Error('MUST FAIL');
		} catch (err) {
			expect(err.error).equals({
				code:    401,
				message: 'Unauthorized'
			});
		}
	});

	it('Request with valid credentials', async () => {
		let resp = await request({
			method: 'GET',
			url:    'http://localhost:8080/ping',
			json:   true,
			auth:   {
				user: 'mif',
				pass: 'password'
			}
		});

		expect(resp).includes({
			method: 'GET',
			local:  {
				items: []
			}
		});
	});
});
