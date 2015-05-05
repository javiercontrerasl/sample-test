var should = require('should'),
	request = require('supertest'),
	config = require('../spec/config/config.json'),
	moment = require("moment");

function checkSorted(res) {
	var events = res.body.events;

	if (events.length == 0) {
	    return;
	}
	var prev = moment(events[0].start_date).toDate().getTime();
	for (var i = 0; i < events.length; i++) {
		var current = moment(events[i].start_date).toDate().getTime();
		should.ok(prev <= current)
		prev = current;
	}
}

describe("users_events", function () {
	var url = config.host;
	var api = "/api/users/events";

	it("Without from parameter", function (done) {
		request(url)
		.get(api)
		.expect('Content-Type', /json/)
		.expect(400).
		end(function (err, res) {
		    if (err)
		        throw err;
			done();
		});
	});

	it("Wrong limit", function (done) {
		request(url)
		.get(api)
		.send({
			"from": "2015-04-01",
			"offset": "0",
			"limit": "0"
		})
		.expect('Content-Type', /json/)
		.expect(400)
		.end(function (err, res) {
		    if (err)
		        throw err;

			done();
		});
	});

	it("From 2015-04-01", function (done) {
		request(url)
		.get(api)
		.send({
			"from": "2015-04-01"
		})
		.expect('Content-Type', /json/)
		.expect(200)
		.expect(checkSorted)
		.end(function (err, res) {
			if (err) 
			    throw err;
			

			should.equal(res.body.events.length, 6);
			should.equal(res.body.events[0].name, "Givery Event1");

			done();
		});
	});

	it("From 2015-04-18", function (done) {
		request(url)
		.get(api)
		.send({
			"from": "2015-04-18"
		})
		.expect('Content-Type', /json/)
		.expect(200)
		.expect(checkSorted)
		.end(function (err, res) {
		    if (err)
		        throw err;

			should.equal(res.body.events.length, 5);
			should.equal(res.body.events[0].name, "Google Event1");

			done();
		});
	});

	it("Specify offset", function (done) {
		request(url)
		.get(api)
		.send({
			"from": "2015-04-01",
			"offset": 2
		})
		.expect('Content-Type', /json/)
		.expect(200)
		.expect(checkSorted)
		.end(function (err, res) {
		    if (err)
		        throw err;

			should.equal(res.body.events.length, 4);
			done();
		});
	});

	it("Specify limit", function (done) {
		request(url)
		.get(api)
		.send({
			"from": "2015-04-01",
			"limit": 1
		})
		.expect('Content-Type', /json/)
		.expect(200)
		.expect(checkSorted)
		.end(function (err, res) {
		    if (err)
		        throw err;

			should.equal(res.body.events.length, 1);
			should.equal(res.body.events[0].name, "Givery Event1");
			done();
		});
	});
});