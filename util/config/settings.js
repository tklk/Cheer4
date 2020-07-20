var configValues = require('./default');
var express = require('express');
var app = express();

module.exports = {
    cookieSecret: 'cheer4',
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},
    MONGODB_URI: function() {
        return 'mongodb://' + configValues.uname + ':' + configValues.pwd + configValues.port + '/' + configValues.db;
    }    
};
