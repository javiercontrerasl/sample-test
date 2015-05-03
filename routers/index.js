var express = require('express'),
    router = express.Router(),
    auth = require('./auth.js'),
    event_users = require('./event_users.js'),
    event_companies = require('./event_companies.js');

//access by everybody
router.post('/api/auth/login', auth.login);
router.get('/api/users/events', event_users.all_events);

//acess by somebody
router.post('/api/users/reserve', event_users.reserve_system_user);
router.post('/api/companies/events', event_companies.all_events);

module.exports = router;