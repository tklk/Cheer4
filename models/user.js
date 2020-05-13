var crypto = require('crypto');
var mongodb = require('./db');
var async = require('async');

function User(user) {
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

/***
/*  Save user information
/*    If succeed, return doc
/*      else return error
/**/
User.prototype.save = function(callback) {
	var md5 = crypto.createHash('md5'),
		email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
		head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";

	// Structure of user doc
	var user = {
		name: this.name,
		password: this.password,
		email: this.email,
		head: head
	};
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			// Read users' collection
			db.collection('users', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Add user
			collection.insert(user, {
				safe: true
			}, function (err, user) {
				callback(err, user);
			});
		},
	], function (err, user) {
		mongodb.close();
		callback(err, user[0]); // succeed
	});
};

/***
/*  Get user information
/*    If succeed, return doc
/*      else return error
/**/
User.get = function(name, callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('users', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			collection.findOne({
				name: name
			}, function (err, user) {
				callback(err, user);
			});
		}
	], function (err, user) {
		mongodb.close();
		callback(err, user);
	});
};
