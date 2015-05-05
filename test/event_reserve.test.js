var should = require('should'),
    request = require('supertest'),
    config = require('../spec/config/config.json'),
    fixtures = new (require("sql-fixtures"))(config.database),
    moment = require("moment");

describe("Without token", function () {
    var url = config.host;
    var api = "/api/users/reserve/"
    
    it("can not call without login", function (done) {
        request(url)
        .post(api)
        .send({
                "token": null,
                "event_id": 1,
                "reserve": true
            })
        .expect(401)
        .end(function (err, res) {
                if (err)
                    throw err;
            
                done();
            });
        });
});

describe("With company user", function () {
    var url = config.host, token, api = "/api/users/reserve/";
    
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
            done();
        });
    });
    
    it("can not reserve event.", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "event_id": 1,
            "reserve": true
        })
        .expect(401)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        })
    });
});

describe("With student user", function () {
    var url = config.host, api = "/api/users/reserve/", userId;
    
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
            userId = res.body.user.id;
            done();
        });
    });
    beforeEach(function (done) {
        fixtures.knex("attends").del().then(function () {
            done();
        });
    });
    
    it("can reserve an event.", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "event_id": 4,
            "reserve": true
        })
        .expect(200)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        });
    });
    
    it("can not reserve already reaserved event.", function (done) {
        fixtures.create({
            "attends": {
                "user_id": userId,
                "event_id": 4
            }
        })
        .then(function () {
            request(url)
            .post(api)
            .send({
                "token": token,
                "event_id": 4,
                "reserve": true
            })
            .expect(501)
            .end(function (err, res) {
                if (err)
                    throw err;
                
                done();
            });
        });
    });
    
    it("can unreserve already reaserved event.", function (done) {
        fixtures.create({
            "attends": {
                "user_id": userId,
                "event_id": 4
            }
        }).then(function () {
            request(url)
            .post(api)
            .send({
                "token": token,
                "event_id": 4,
                "reserve": 'false' //nandeane //no idea, send false boolean from here, error. send by postman OK! (only this method)
            })
            .expect(200)
            .end(function (err, res) {
                if (err)
                    throw err;
                
                done();
            });
        });
    });
    
    it("can not unreserve not reaserved event.", function (done) {
        request(url)
        .post(api)
        .send({
            "token": token,
            "event_id": 4,
            "reserve": 'false'
        })
        .expect(502)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        });
    });
});