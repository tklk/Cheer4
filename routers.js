module.exports = function(app) {
	app.use(require('./controllers/indexController'));
	app.use(require('./controllers/userController'));
	app.use(require('./controllers/postController'));
};
