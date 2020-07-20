const userController = require('./lib/user.js');
const postController = require('./lib/post.js');

const check = require('../middlewares/check');
const checkNotLogin = check.checkNotLogin;

const index = require('express').Router();

module.exports = index;

// / index => GET
index.get('/', postController.getTen);

// /reg => GET Signup
index.get('/reg', checkNotLogin, userController.getSignup);

// /archive => GET Archive post
index.get('/archive', postController.getArchive);

// /tags => GET all tags
index.get('/tags', postController.getTags);

// /tags/:tagName => GET posts by tag
index.get('/tags/:tagName', postController.getTag);

// /u/:name => GET
index.get('/u/:name', postController.getUserPost);

// /u/:name/:day/:title/:_id => GET
index.get('/u/:name/:day/:title/:_id', postController.getSubjectPost);

// /search => GET
index.get('/search', postController.getSearchPost);

// /links => GET link
index.get('/links', userController.getLink);