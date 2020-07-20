const postController = require('./lib/post.js');
const commentController = require('./lib/comment.js');

const check = require('../middlewares/check');
const checkLogin = check.checkLogin;

const post = require('express').Router();
module.exports = post;


// /post => GET
post.get('/post', checkLogin, postController.getCreate);

// /post => POST
post.post('/post', checkLogin, postController.postCreate);

// /upload => GET
post.get('/upload', checkLogin, postController.getUpload);

// /upload => POST
post.post('/upload', checkLogin, postController.postUpload);

// /u/:name/:day/:title/:_id => POST
post.post('/u/:name/:day/:title/:_id', checkLogin, commentController.postComment);

// /u/:name/:day/:title/:_id/edit/:_cid => GET
post.get('/u/:name/:day/:title/:_id/edit/:_cid', checkLogin, commentController.getEditComment);

// /u/:name/:day/:title/:_id/edit/:_cid => POST
// put for REST_API
post.post('/u/:name/:day/:title/:_id/edit/:_cid', checkLogin, commentController.putComment);

// /u/:name/:day/:title/:_id/remove/:_cid => GET
// delete  for REST_API
post.get('/u/:name/:day/:title/:_id/remove/:_cid', checkLogin, commentController.deleteComment);

// /edit/:name/:day/:title/:_id => GET
post.get('/edit/:name/:day/:title/:_id', checkLogin, postController.getEditPost);

// /edit/:name/:day/:title/:_id => POST
// put for REST_API
post.post('/edit/:name/:day/:title/:_id', checkLogin, postController.putPost);

// /remove/:name/:day/:title/:_id => GET
// delete for REST_API
post.get('/remove/:name/:day/:title/:_id', checkLogin, postController.deletePost);

// /reprint/:name/:day/:title/:_id => GET
post.get('/reprint/:name/:day/:title/:_id', checkLogin, postController.getReprintPost);