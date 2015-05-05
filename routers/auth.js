var mysql = require('mysql'),
    jwt = require('jwt-simple'),
    crypto = require('crypto-js'),
    S = require('string'),
    config = require('../spec/config/config.json'),
    connection = mysql.createPool(config.database.connection);

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

var auth = {
    login: function (req, res) {
        var loginID = req.body.email || '';
        var password = req.body.password || '';
        
        try {
            if (S(loginID).isEmpty() || S(password).isEmpty()) {
                res.status(406);
                res.json({
                    "code": 406,
                    "message": "Credential Not Acceptable"
                });
                return;
            }
            
            connection.query('SELECT id, name, group_id FROM users WHERE (email =? AND password =?);',
            [loginID, crypto.SHA1(password).toString(crypto.enc.Hex)], function (err, rows) {
                if (err) {
                    res.status(500)
                    res.json({
                        "code": 500,
                        "message": "Data Server Error",
                        "err": err
                    });
                }
                else {
                    if (rows && rows.length > 0) {
                        res.status(200)
                        res.json({
                            "code": 200,
                            "token": getToken(loginID),
                            "user": rows[0]
                        });
                    } else {
                        res.status(401);
                        res.json({
                            "code": 401,
                            "message": "Unauthorized Access"
                        });
                    }
                }
            });
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
};

function getToken(loginID) {
    var expires = expiresIn(5);
    
    var token = jwt.encode({
        loginID: loginID,
        exp: expires
    }, require('../config/secret')());
    
    return token;
}

function expiresIn(num_days) {
    var oDate = new Date();
    return (oDate.setDate(oDate.getDate() + num_days));
}

module.exports = auth;