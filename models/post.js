var async = require('async');
var markdown = require('markdown').markdown;
var mongodb = require('./db');


function Post(name, head, title, tags, post) {
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
	this.post = post;
}

module.exports = Post;

/***
/*  Save post information
/*    If succeed, return null
/*      else return error
/**/
Post.prototype.save = function (callback) {
	var date = new Date();

	var time = {
		date: date,
		year : date.getFullYear(),
		month : date.getFullYear() + "-" + (date.getMonth() + 1),
		day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	}

	// Structure of post doc
	var post = {
		name: this.name,
		head: this.head,
		time: time,
		title: this.title,
		tags: this.tags,
		post: this.post,
		comments: [],
		reprint_info: {},
		pv: 0
	};

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
			// Add post
			collection.insert(post, {
				safe: true
			}, function (err, post) {
				callback(err, post);
			});
		},
	], function (err, post) {
		mongodb.close();
		callback(err, null); // succeed
	});
};


/***
/*  GET 10 post
/*    If succeed, return query doc and count
/*      else return error
/**/
Post.getTen = function (name, page, callback) {
	var query = {};
	if (name) {
		query.name = name;
	}
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Count total result
			collection.count(query, function (err, total) {
				console.log(total);
				callback(err, collection, total);
			});
		}, function (collection, total, callback) {
			collection.find(query, {
				skip: (page - 1)*10,
				limit: 10
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				if (err) {
					return callback(err);
				}
				callback(err, docs, total);
			});
		}, function (docs, total, callback) {
			// Transform to HTML
			docs.forEach(function (doc) {
				doc.post = markdown.toHTML(doc.post);
			});
			callback(null, docs, total);
		}
	],  function (err, docs, total) {
		mongodb.close();
		callback(err, docs, total);
	});
};


/***
/*  GET post doc by name, time, subject
/*    If succeed, return doc
/*      else return error
/**/
Post.getOne = function (name, day, title, callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Search by name, time, subject
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {
				callback(err, collection, doc);
			});
		}, function (collection, doc, callback) {
			// Count read
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$inc: {"pv": 1}
			}, function (err) {
				if (err) {
					return callback(err);
				}
				callback(err, doc);
			});
		}, function (doc, callback) {
			doc.post = markdown.toHTML(doc.post);
			doc.comments.forEach(function (comment) {
				comment.content = markdown.toHTML(comment.content);
			});
			callback(null, doc);
		}
	], function (err, doc) {
		mongodb.close();
		callback(err, doc);
	});
};


/***
/*  EDIT post
/*    If succeed, return doc
/*      else return error
/**/
Post.edit = function (name, day, title, callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {
				callback(err, doc);
			});
		}
	], function (err, doc) {
		mongodb.close();
		callback(err, doc);
	});
};


/***
/*  Update post doc
/*    If succeed, return null
/*      else return error
/**/
Post.update = function (name, day, title, post, callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// update
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
			}, function (err) {
				callback(err);
			});
		}
	], function (err) {
		mongodb.close();
		callback(err);
	});
};


/***
/*  Delete a post
/*    If succeed, return null
/*      else return error
/**/
Post.remove = function (name, day, title, callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {
				callback(err, collection, doc);
			});
		},
		function (collection, doc, callback) {
			// Update origianl post if current post is a share post
			var reprint_from = "";
			if (doc.reprint_info.reprint_from) {
				reprint_from = doc.reprint_info.reprint_from;
			}
			if (reprint_from != "") {
				collection.update({
					"name": reprint_from.name,
					"time.day": reprint_from.day,
					"title": reprint_from.title
				}, {
					$pull: {
						"reprint_info.reprint_to": {
							"name": name,
							"day": day,
							"title": title
						}
					}
				}, function (err) {
					if (err) {
						return callback(err);
					}
				});
			}
			// Remove post
			collection.remove({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				w: 1
			}, function (err) {
				callback(err, null);
			});
		},
	], function (err, result) {
		mongodb.close();
		callback(err, result);
	});
};


/***
/*  Get archive post
/*    If succeed, return doc
/*      else return error
/**/
Post.getArchive = function (callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Return all post
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				callback(err, docs);
			});
		}
	], function (err, docs) {
		mongodb.close();
		callback(err, docs);
	});
};


/***
/*  Get all tags
/*    If succeed, return doc
/*      else return error
/**/
Post.getTags = function (callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Avoid duplicate
			collection.distinct("tags", function (err, docs) {
				callback(null, docs);
			});
		}
	], function (err, docs) {
		mongodb.close();
		callback(err, docs);
	});
};


/***
/*  Get post by tags
/*    If succeed, return doc
/*      else return error
/**/
Post.getTag = function (tag, callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Search all post with tag
			collection.find({
				"tags": tag
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				callback(err, docs);
			});
		}
	], function (err, docs) {
		mongodb.close();
		callback(err, docs);
	});
};


/***
/*  Search post by keyword (fuzzy search)
/*    If succeed, return doc
/*      else return error
/**/
Post.search = function (keyword, callback) {
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			var pattern = new RegExp(keyword, "i");
			collection.find({
				"title": pattern
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				callback(err, docs);
			});
		}
	], function (err, docs) {
		mongodb.close();
		callback(err, docs);
	});
};


/***
/*  Share post
/*    If succeed, return doc
/*      else return error
/**/
Post.reprint = function (reprint_from, reprint_to, callback) {
	// Structure of post doc
	var time = {};
	async.waterfall([
		function (callback) {
			mongodb.open(function (err, db) {
				callback(err, db);
			});
		},
		function (db, callback) {
			db.collection('posts', function (err, collection) {
				callback(err, collection);
			});
		},
		function (collection, callback) {
			// Find original post
			collection.findOne({
				"name": reprint_from.name,
				"time.day": reprint_from.day,
				"title": reprint_from.title
			}, function (err, doc) {
				var date = new Date();
				time = {
					date: date,
					year : date.getFullYear(),
					month : date.getFullYear() + "-" + (date.getMonth() + 1),
					day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
					minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
					date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
				}
				// Delete doc's id
				delete doc._id;

				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/~Share~/) > -1) ? doc.title : "~Share~" + doc.title;
				doc.comments = [];
				doc.reprint_info = {"reprint_from": reprint_from};
				doc.pv = 0;
				callback(err, collection, doc);
			});
		},
		function (collection, doc, callback) {
			collection.update({
				"name": reprint_from.name,
				"time.day": reprint_from.day,
				"title": reprint_from.title
			}, {
				$push: {
					"reprint_info.reprint_to": {
						"name": doc.name,
						"day": time.day,
						"title": doc.title
					}
				}
			}, function (err) {
				callback(err, collection, doc);
			});
		},
		function (collection, doc, callback) {
			// Save share post
			collection.insert(doc, {
				safe: true
			}, function (err, post) {
				callback(err, post);
			});
		},
	], function (err, post) {
		mongodb.close();
		callback(err, post[0]);
	});
};
