var mongodb = require('./db'),
	markdown = require('markdown').markdown;

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
	
	// Open db
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		// Read posts' collection
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Add post
			collection.insert(post, {
				safe: true
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null); // succeed
			});
		});
	});
};


/***
/*  GET 10 post
/*    If succeed, return query doc and count
/*      else return error
/**/
Post.getTen = function (name, page, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if (name) {
				query.name = name;
			}
			// Count total result
			collection.count(query, function (err, total) {
				// Skip previous page
				collection.find(query, {
					skip: (page - 1)*10,
					limit: 10
				}).sort({
					time: -1
				}).toArray(function (err, docs) {
					mongodb.close();
					if (err) {
					return callback(err);
					}
					// Transform to HTML
					docs.forEach(function (doc) {
					doc.post = markdown.toHTML(doc.post);
					});  
					callback(null, docs, total);
				});
			});
		});
	});
};


/***
/*  GET post doc by name, time, subject
/*    If succeed, return doc
/*      else return error
/**/
Post.getOne = function (name, day, title, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Search by name, time, subject
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
				if (doc) {
					// Count read
					collection.update({
						"name": name,
						"time.day": day,
						"title": title
					}, {
						$inc: {"pv": 1}
					}, function (err) {
						mongodb.close();
						if (err) {
							return callback(err);
						}
					});
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function (comment) {
						comment.content = markdown.toHTML(comment.content);
					});
					callback(null, doc);
				}
			});
		});
	});
};


/***
/*  EDIT post 
/*    If succeed, return doc
/*      else return error
/**/
Post.edit = function (name, day, title, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
	
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, doc);
			});
		});
	});
};


/***
/*  Update post doc
/*    If succeed, return null
/*      else return error
/**/
Post.update = function (name, day, title, post, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
	
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			// update 
			collection.update({
				"name": name,
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
			}, function (err) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};


/***
/*  Delete a post
/*    If succeed, return null
/*      else return error
/**/
Post.remove = function (name, day, title, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
	
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function (err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}
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
							mongodb.close();
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
					mongodb.close();
					if (err) {
						return callback(err);
					}
					callback(null);
				});
			});
		});
	});
};


/***
/*  Get archive post
/*    If succeed, return doc
/*      else return error
/**/
Post.getArchive = function (callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
	
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			// Return all post
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};


/***
/*  Get all tags
/*    If succeed, return doc
/*      else return error
/**/
Post.getTags = function (callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Avoid duplicate
			collection.distinct("tags", function (err, docs) {
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};


/***
/*  Get post by tags
/*    If succeed, return doc
/*      else return error
/**/
Post.getTag = function (tag, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
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
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};


/***
/*  Search post by keyword (fuzzy search)
/*    If succeed, return doc
/*      else return error
/**/
Post.search = function (keyword, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
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
				mongodb.close();
				if (err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};


/***
/*  Share post
/*    If succeed, return doc
/*      else return error
/**/
Post.reprint = function (reprint_from, reprint_to, callback) {
	mongodb.open(function (err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('posts', function (err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Find original post
			collection.findOne({
				"name": reprint_from.name,
				"time.day": reprint_from.day,
				"title": reprint_from.title
			}, function (err, doc) {
				if (err) {
					mongodb.close();
					return callback(err);
				}

				var date = new Date();
				var time = {
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

				// Update original post
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
					if (err) {
						mongodb.close();
						return callback(err);
					}
				});

				// Save share post
				collection.insert(doc, {
					safe: true
				}, function (err, post) {
					mongodb.close();
					if (err) {
						return callback(err);
					}
					callback(err, post[0]);
				});
			});
		});
	});
};