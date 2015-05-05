var should = require('should'),
    request = require('supertest'),
    config = require('../spec/config/config.json'),
    fixtures = new (require("sql-fixtures"))(config.database),
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

describe("Without token", function () {
    var url = config.host;
    var api = "/api/companies/events"
    
    it("can not call without login", function (done) {
        request(url)
        .post(api)
        .send({
            "token": null,
            "from": "2015-04-01"
        })
        .expect(401)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        });
    });
});

describe("With student user", function () {
    var url = config.host, token, api = "/api/companies/events";
    
    before(function (done) {
        request(url)
        .post("/api/auth/login")
        .send({
            "email": "user1@test.com",
            "password": "password"
        })
        .expect(200)
        .end(function (err, res) {
            if (err)
                throw err;
            
            token = res.body.token;
            done();
        });
    });
    
    it("can not call.", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "from": "2015-04-01"
        })
        .expect(401)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        })
    });
});

describe("With company user", function () {
    var url = config.host, api = "/api/companies/events", userId;
    
    before(function (done) {
        request(url)
        .post("/api/auth/login")
        .send({
            "email": "givery@test.com",
            "password": "password"
        })
        .expect(200)
        .end(function (err, res) {
            if (err)
                throw err;
            
            token = res.body.token;
            userId = res.body.user.id;
            done();
        });
    });
    beforeEach(function (done) {
        fixtures.knex("attends").del().then(function () {
            done();
        });
    });
    
    it("Without from parameter", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token
        })
        .expect(400)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        });
    });
    
    it("Wrong limit", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "from": "2015-04-01",
            "offset": 0,
            "limit": "0" // nandeane!
        })
        .expect(400)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        });
    });

    it("From 2015-04-01", function (done) {
        fixtures.create({
            "attends": [{
                    "user_id": 1,
                    "event_id": 1
                }, {
                    "user_id": 2,
                    "event_id": 1
                }]
        }).then(function () {
            request(url)
            .post(api)
            .send({
                "token": token,
                "from": "2015-04-01"
            })
            .expect(checkSorted)
            .expect(200)
              .end(function (err, res) {
                if (err)
                    throw err;
                
                should.equal(res.body.events.length, 2);
                should.equal(res.body.events[0].name, "Givery Event1");
                should.equal(res.body.events[0].number_of_attendees, 2);
                should.equal(res.body.events[1].number_of_attendees, 0);

                done();
            });
        });
    });

    it("From 2015-05-01", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "from": "2015-05-01"
        })
        .expect(checkSorted)
        .expect(200)
        .end(function (err, res) {
            if (err)
                throw err;
            
            should.equal(res.body.events.length, 0);

            done();
        });
    });

    it("Specify offset", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "from": "2015-04-01",
            "offset": 3
        })
        .expect(checkSorted)
        .expect(200)
        .end(function (err, res) {
            if (err)
                throw err;
            
            should.equal(res.body.events.length, 0);
            
            done();
        });
    });

    it("Specify offset and limit", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "from": "2015-04-01",
            "offset": 1,
            "limit": 3
        })
        .expect(checkSorted)
        .expect(200)
        .end(function (err, res) {
            if (err)
                throw err;
            
            should.equal(res.body.events.length, 1);
            should.equal(res.body.events[0].name, "Givery Event2");
            
            done();
        });
    });
});