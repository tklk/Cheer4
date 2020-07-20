const userController = require('./lib/user.js');
const check = require('../middlewares/check');
const checkLogin = check.checkLogin;
const checkNotLogin = check.checkNotLogin;

const user = require('express').Router();
module.exports = user;

// /reg => Post Signup
user.post('/reg', checkNotLogin, userController.postSignup);

// /login => GET Login
user.get('/login', checkNotLogin, userController.getLogin);

// /login => POST Login
user.post('/login', checkNotLogin, userController.postLogin);

// /logout => GET Logout
user.get('/logout', checkLogin, userController.getLogout);

// /reset => GET Reset password
user.get('/reset', checkLogin, userController.getReset);

// /reset => POST Reset password
user.post('/reset', checkLogin, userController.postReset);
