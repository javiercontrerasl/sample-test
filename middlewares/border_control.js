var jwt = require('jwt-simple'),
    mysql = require('mysql'),
    config = require('../spec/config/config.json'),
    S = require('string'),
    connection = mysql.createPool({
        host     : config.database.connection.host,
        user     : config.database.connection.user,
        password : config.database.connection.password,
        database : config.database.connection.database,
        port     : config.database.connection.port,
        connectionLimit : config.database.connection.connectionLimit
    });

connection.getConnection(function (err, conn) {
    if (err) {
        res.status(503)
        res.json({
            "code": 503,
            "message": "Data Server Unavailable",
            "err": err
        });
    }
});

module.exports = function (req, res, next) {
    var token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['token'];
    
    if (!S(token).isEmpty()) {
        try {
            var passport = jwt.decode(token, require('../config/secret.js')());
            
            if (passport) {
                if (passport.exp <= Date.now()) {
                    res.status(401);
                    res.json({
                        "code": 401,
                        "message": "Token Expired"
                    });
                    return;
                }
                
                connection.query('SELECT group_id FROM users WHERE email =?', passport.loginID, function (err, rows) {
                    if (err) {
                        res.status(500);
                        res.json({
                            "code": 500,
                            "message": "Data Server Error",
                            "err": err
                        });
                    }
                    else {
                        if (rows && rows.length > 0) {
                            if (req.url.indexOf('/api/users/reserve') >= 0 && rows[0].group_id == 1) {
                                next();
                            }
                            else if (req.url.indexOf('/api/companies/events') >= 0 && rows[0].group_id == 2) {
                                next();
                            }
                            else {
                                res.status(401);
                                res.json({
                                    "code": 401,
                                    "message": "Unauthorized Access"
                                });
                            }
                        }
                    }
                });
            }
            else {
                res.status(401);
                res.json({
                    "code": 401,
                    "message": "Invalid Token"
                });
            }
        }
        catch (err) {
            res.status(500);
            res.json({
                "code": 500,
                "message": "Internal Server Error",
                "err": err
            });
        }
    }
    else {
        res.status(401);
        res.json({
            "code": 401,
            "message": "Invalid Token"
        });
    }
}