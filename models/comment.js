var async = require('async');
var mongodb = require('./db');

function Comment(name, day, title, comment) {
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
}

module.exports = Comment;

/***
/*  Save comment
/*    If succeed, return null
/*      else return error
/**/
Comment.prototype.save = function(callback) {
	var name = this.name,
		day = this.day,
		title = this.title,
		comment = this.comment;
	// Opend db
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			// Read posts' collection
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Search by name, time, subject, update comment into doc
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$push: {"comments": comment}
			}, function (err) {
				callback(err, null);
			});
		},
	], function (err, comment) {
		mongodb.close();
		callback(err, null); // succeed
	});
};
