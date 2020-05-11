var mongodb = require('./db'),
	crypto = require('crypto');

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
	// Open db
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		// Read users' cluster
		db.collection('users', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Add user
			collection.insert(user, {
				safe: true
			}, function (err, user) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, user[0]); // succeed
			});
		});
	});
};

/***
/*  Get user information
/*    If succeed, return doc
/*      else return error
/**/
User.get = function(name, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Search user by username
			collection.findOne({
				name: name
			}, function (err, user) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, user);
			});
		});
	});
};