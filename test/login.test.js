var should = require('should'),
    request = require('supertest'),
    config = require("../spec/config/config.json");

describe('login', function () {
    var url = config.host;
    var api = "/api/auth/login"
    
    it('Wrong password', function (done) {
        request(url)
        .post(api)
        .send({
            "email": "user1@test.com",
            "password": "wrong"
        })
        .expect(401)
        .end(function (err, res) {
            if (err)
                throw err;

            done();
        });
    });

    it('Wrong username', function (done) {
        request(url)
        .post(api)
        .send({
            "email": "unknown@test.com",
            "password": "password"
        })
        .expect(401)
        .end(function (err, res) {
            if (err)
                throw err;
            
            done();
        })
    });

    it('Sucess', function (done) {
        request(url)
        .post(api)
        .send({
            "email": "user1@test.com",
            "password": "password"
        })
        .expect(200)
        .end(function (err, res) {
            if (err)
                throw err;
            
            should.ok(res.body.token.length > 0);
            should.equal(res.body.user.name, "John Smith");
            should.equal(res.body.user.group_id, 1);
            
            done();
        });
    })
});
