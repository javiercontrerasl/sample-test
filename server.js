var http = require('http'),
    port = process.env.port || 3000,
    express = require('express'),
    app = express();

var body_parser = require('body-parser');

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');

    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});

app.use('/', require('./routers'));

app.use(function (req, res, next) {
    var err = new Error('Not Found \n\n');
    err.status = 404;
    next("API not found")
});

app.set('port', port);

var server = app.listen(app.get('port'), function () {
    console.log('Service is listening on port ' + server.address().port);
});