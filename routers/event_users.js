var mysql = require('mysql'),
    moment = require('moment'),
    S = require('string'),
    config = require('../spec/config/config.json'),
    jwt = require('jwt-simple'),
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

events = {
    all_events : function (req, res) {
        //If 'from' does not come, we should show data from today.
        //var from = ((req.query && req.query.from) || (req.body && req.body.from) || req.headers['from']) || moment(Date.now()).format('YYYY-MM-DD');
        var from = ((req.query && req.query.from) || (req.body && req.body.from) || req.headers['from']) || '';
        var offset = ((req.query && req.query.offset) || (req.body && req.body.offset) || req.headers['offset']) || "0";
        var limit = ((req.query && req.query.limit) || (req.body && req.body.limit) || req.headers['limit']) || "50";
        
        try {
            if (S(from).isEmpty() || !moment(from, 'YYYY-MM-DD', true).isValid() || !S(offset).isNumeric() || !S(limit).isNumeric() || parseInt(limit) < 1) {
                res.status(400);
                res.json({
                    "code" : 400,
                    "message" : "Bad Request"
                });
                return;
            }
            
            connection.query('SELECT events.id AS event_id, events.name AS event_name, DATE_FORMAT(events.start_date, \"%Y-%m-%d %T\") AS start_date, company.id AS company_id, company.name AS company_name FROM events INNER JOIN users company ON events.user_id = company.id WHERE (events.start_date >= ?) ORDER BY start_date LIMIT ? OFFSET ?;', 
                [moment(from).format('YYYY-MM-DD'), parseInt(limit), parseInt(offset)], function (err, rows) {
                if (err) {
                    res.status(500);
                    res.json({
                        "code": 500,
                        "message": "Data Server Error",
                        "err": err
                    });
                }
                else {
                    var data = rows.map(function (row) {
                        return {
                            id: row.event_id,
                            name: row.event_name,
                            start_date: row.start_date,
                            company: {
                                id: row.company_id,
                                name: row.company_name
                            }
                        }
                    });
                    
                    res.status(200);
                    res.json({
                        "code": 200,
                        "events": data
                    });
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
    },
    reserve_system_user: function (req, res) {
        var event_id = (req.body.event_id || '');
        var reserve = (req.body.reserve || '');
        var token = (req.body.token || '');
        
        if (S(event_id).isEmpty() || S(reserve).isEmpty()) {
            res.status(400);
            res.json({
                "code" : 400,
                "message" : "Bad Request"
            });
            return;
        }
        
        if (S(token).isEmpty()) {
            res.status(401);
            res.json({
                "code": 401,
                "message": "Invalid Token"
            });
        }
        else {
            try {
                var passport = jwt.decode(token, require('../config/secret.js')());
                
                if (passport) {
                    //We cannot book events in the past!
                    connection.query('SELECT start_date FROM events WHERE (id = ? and start_date >= ?);', 
                        [parseInt(event_id), moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')], function (err, result) {
                        if (err) {
                            res.status(500);
                            res.json({
                                "code": 500,
                                "message": "Data Server Error",
                                "err": err
                            });
                        }
                        else {
                            if (result && result.length == 0) {
                                res.status(404);
                                res.json({
                                    "code": 404,
                                    "message": "Event Already Started/Not Found"
                                });
                                return;
                            }
                            else {
                                connection.query('SELECT attends.reserved_at FROM users INNER JOIN attends ON users.id = attends.user_id WHERE (users.email = ? AND attends.event_id = ?);', 
                                    [passport.loginID, parseInt(event_id)], function (err, result) {
                                    if (err) {
                                        res.status(500);
                                        res.json({
                                            "code": 500,
                                            "message": "Data Server Error",
                                            "err": err
                                        });
                                    }
                                    else {
                                        if (S(reserve).toBoolean()) {
                                            if (result && result.length >= 1) {
                                                res.status(501);
                                                res.json({
                                                    "code": 501,
                                                    "message": "Not Modified: User Already Registered in the Event"
                                                });
                                            }
                                            else {
                                                connection.query('INSERT INTO attends (user_id, event_id) VALUES((SELECT users.id FROM users WHERE (users.email = ?)), ?);', 
                                                    [passport.loginID, parseInt(event_id)], function (err, result) {
                                                    if (err) {
                                                        res.status(500);
                                                        res.json({
                                                            "code": 500,
                                                            "message": "Data Server Error",
                                                            "err": err
                                                        });
                                                    }
                                                    else {
                                                        res.status(200);
                                                        res.json({
                                                            "code": 200,
                                                            "message": "Reserve: OK"
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                        else {
                                            if (result && result.length >= 1) {
                                                connection.query('DELETE FROM attends WHERE(attends.event_id = ?) AND (attends.user_id = (SELECT users.id FROM users WHERE (users.email = ?)));', 
                                                    [parseInt(event_id), passport.loginID], function (err, result) {
                                                    if (err) {
                                                        res.status(500);
                                                        res.json({
                                                            "code": 500,
                                                            "message": "Data Server Error",
                                                            "err": err
                                                        });
                                                    }
                                                    else {
                                                        res.status(200);
                                                        res.json({
                                                            "code": 200,
                                                            "message": "Unreserve: OK"
                                                        });
                                                    }
                                                });
                                            }
                                            else {
                                                //502 Bad Gateway
                                                //501 Not Implemented
                                                res.status(502);
                                                res.json({
                                                    "code": 502,
                                                    "message": "Not Modified: User Not Registered in the Event"
                                                });
                                            }
                                        }
                                    }
                                });
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
    }
};

module.exports = events;