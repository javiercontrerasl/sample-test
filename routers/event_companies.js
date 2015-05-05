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

event_companies = {
    all_events: function (req, res) {
        var token = req.body.token || '';
        
        //If 'from' does not come, we should show data from today.
        //var from = req.body.from || moment(Date.now()).format('YYYY-MM-DD');
        var from = req.body.from || '';
        var offset = req.body.offset || "0";
        var limit = req.body.limit || "50";
        
        if (S(token).isEmpty()) {
            res.status(401);
            res.json({
                "code": 401,
                "message": "Invalid Token"
            });
        }
        else {
            try {
                if (S(from).isEmpty() || !moment(from, 'YYYY-MM-DD', true).isValid() || !S(offset).isNumeric() || !S(limit).isNumeric() || parseInt(limit) < 1) {
                    res.status(400);
                    res.json({
                        "code" : 400,
                        "message" : "Bad Request"
                    });
                    return;
                }
                
                var passport = jwt.decode(token, require('../config/secret.js')());
                
                if (passport) {
                    //connection.query('SELECT events.id, events.name, DATE_FORMAT(events.start_date, \"%Y-%m-%d %T\") AS start_date, COUNT(attends.user_id) AS number_of_attendees FROM events LEFT JOIN attends ON events.id = attends.event_id WHERE(events.start_date >= ? AND events.user_id = (SELECT users.id FROM users WHERE (users.email = ?))) GROUP BY events.id, events.name  ORDER BY start_date LIMIT ? OFFSET ?;', 
                    connection.query('select events.id, events.name, DATE_FORMAT(events.start_date, \"%Y-%m-%d %T\") as start_date, (SELECT COUNT(attends.user_id) FROM attends where attends.event_id = events.id) as number_of_attendees FROM events WHERE(events.start_date >= ? AND events.user_id = (SELECT users.id FROM users WHERE (users.email = ?))) ORDER BY start_date LIMIT ? OFFSET ?;', 
                        [from, passport.loginID, parseInt(limit), parseInt(offset)], function (err, rows) {
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
                                "events": rows
                            });
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

module.exports = event_companies