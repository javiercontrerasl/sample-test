var express = require('express'),
    router = express.Router(),
    auth = require('./auth.js');

//access by everybody
router.post('/api/auth/login', auth.login);

module.exports = router;