
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon = require('serve-favicon');
var indexRouter = require('./routes/index');

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

//
const config = require('config-lite')(__dirname);

// Upload file
var multer  = require('multer');

// Connection
var settings = require('./settings');

// used as showing status
var flash = require('connect-flash');

// Logging
var fs = require('fs');
var accessLog = fs.createWriteStream('logs/access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('logs/error.log', {flags: 'a'});

var app = express();

// view engine setup
app.use(favicon(__dirname + '/public/favicon.ico'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());
app.use(logger('dev'));

// Store accesslog
app.use(logger({stream: accessLog}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  store: new MongoStore({
    url:'mongodb://localhost/blog'
  })
}));

/*
app.use(session({
	key: config.session.key, // session id
	secret: config.session.secret, // protect cookie from manual manipulation
    cookie: {
    	maxAge: config.session.maxAge
    },
	store: new MongoStore({
	    url: config.mongodb
	})
}));

// 监听端口，启动程序
app.listen(config.port, function () {
  console.log(`${pkg.name} listening on port ${config.port}`)
})


// 设置模板全局常量
app.locals.cheers = {
	title: pkg.name,
	description: pkg.description
}

// 添加模板必需的三个变量
app.use(function (req, res, next) {
  res.locals.user = req.session.user
  res.locals.success = req.flash('success').toString()
  res.locals.error = req.flash('error').toString()
  next()
})
*/

app.use('/', indexRouter);


// Store errorlog
app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;

