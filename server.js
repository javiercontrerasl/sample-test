var http = require('http'),
    port = process.env.port || 3000,
    express = require('express'),
    app = express(),
    body_parser = require('body-parser');

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    res.header('Content-Type', 'application/json');

    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});

app.all('/api/users/reserve', [require('./middlewares/border_control.js')]);
app.all('/api/companies/events', [require('./middlewares/border_control.js')]);

app.use('/', require('./routers'));

app.use(function (req, res, next) {
    var err = new Error('Not Found \n\n');
    err.status = 404;
    
    console.log(err);
    
    res.status(404);
    res.json({
        "code": 404
    })
});

app.set('port', port);

var server = app.listen(port, function () {
    console.log('Service is listening on port ' + port);
});