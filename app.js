const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const favicon = require('serve-favicon');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const errorController = require('./controllers/lib/error');
const flash = require('connect-flash');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

app.use(favicon(__dirname + '/public/favicon.ico'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());

app.use(logger('dev'));
app.use(helmet()); // protection
app.use(compression()); // asset compression
if (app.settings.env === "development" ) {
    const accessLogStream = fs.createWriteStream( path.join(__dirname, 'logs', 'access.log'), { flags: 'a' });
    app.use(logger({ stream: accessLogStream }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.DB_SECERT,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },
    store: new MongoDBStore({ uri: process.env.MONGODB_URI, collection: 'sessions' })
}));
//30 days

let router = express.Router();
router = require('./routers')(app);

app.get('/500', errorController.get500);
app.use(errorController.get404);

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        const port = process.env.PORT || 3000;
        app.listen(port);
        console.log("DB connect and Express server listening on port %d in %s mode", port, app.settings.env);
    } catch (err) {
        console.error('Fail to connect to %s error: ', process.env.MONGODB_URI, err.message);
        process.exit(1);
    }
})();

const Test = require('./Test/initDB');
test_1 = new Test("tkl");
test_1.init();

app.use((err, req, res, next) => {
    if (app.settings.env === "development" ) {
        const errorLogStream = fs.createWriteStream( path.join(__dirname, 'logs', '/error.log'), { flags: 'a' });
        const meta = '[' + new Date() + '] ' + req.url + '\n';
        errorLogStream.write(meta + err.stack + '\n');
    }
    
    res.status(500).render('500', {
        title: '',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});