const markdown = require('markdown').markdown;
const Post = require('../../models/postModel');
const User = require('../../models/userModel');
const { get500 } = require('../../util/error');

const multer  = require('multer');

const storage = multer.diskStorage({
  	destination: (req, file, cb) => {
    	cb(null, './public/images')
  	},
  	filename: (req, file, cb) => {
		date = new Date().toISOString();
		cb(null, file.originalname+date)
  	}
})
const upload = multer({ storage: storage });

function getTimeObj (date) {
	const time = {
		date: date,
		year : date.getFullYear(),
		month : date.getFullYear() + "-" + (date.getMonth() + 1),
		day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
		date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};
	return time;
};

function getUri (uriObj) {
	return encodeURI('/u/' + uriObj.name + '/' + uriObj.day + '/' + uriObj.title + '/' + uriObj._id);
}

exports.getTen = async (req, res, next) => {
	// Parse and check
	const page = req.query.p ? parseInt(req.query.p) : 1;
	// Return 10 posts in this page
	const perPage = 10;
	try {
		const totalPosts = await Post.find().countDocuments();
		const posts = await Post.find().skip((page - 1)*perPage).limit(perPage).sort({ time: -1 });
		posts.forEach((doc) => {
			doc.post = markdown.toHTML(doc.post);
		});
		res.render('index', {
			title: 'Cheers',
			posts: posts,
			page: page,
			isFirstPage: (page - 1) == 0,
			isLastPage: ((page - 1) * perPage + posts.length) == totalPosts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	} catch (err) {
        return next(get500(err));
	}
};

exports.getArchive = async (req, res, next) => {
	try {
		const posts = await Post.find().sort({ time: -1 });
		res.render('archive', {
			title: 'Archive post',
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
	  	});
	} catch (err) {
		req.flash('error', err);
		return res.redirect('/')
	}
};

exports.getTags = async (req, res, next) => {
	try {
		const posts = await Post.distinct("tags");
		res.render('tags', {
			title: 'Tags',
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
	  	});
	} catch (err) {
		req.flash('error', err);
		return res.redirect('/')
	}
}

exports.getTag = async (req, res, next) => {
	const query = { "tags": req.params.tagName };
	const opt_index = { "name": 1, "time": 1, "title": 1 };
	try {
		const posts = await Post.find(query, null, opt_index).sort({ time: -1 });
		res.render('tag', {
			title: '#tag: ' + req.params.tagName,
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
	  	});
	} catch (err) {
		req.flash('error', err);
		return res.redirect('/');
	}
}

exports.getCreate = (req, res, next) => {
	console.log('Enter');
	res.render('post', {
		title: 'Create a post',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
};

exports.postCreate = async (req, res, next) => {
	const date = new Date();
	const time = getTimeObj(date);
	const user = req.session.user;
	const tags = [req.body.tag1, req.body.tag2, req.body.tag3];
	const body = req.body;
	const post = new Post({
		name: user.name,
		head: user.head,
		time: time,
		title: body.title,
		tags: tags,
		post: body.post,
		comments: [],
		reprint_info: {},
		pv: 0
	});
	
	try {
		await Post.create(post);
		req.flash('success', 'You have create a new post!');
	    res.redirect('/');
	} catch (err) {
		return next(get500(err));
	}
};

exports.getUpload = (req, res, next) => {
	res.render('upload', {
		title: 'Upload file',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
};

exports.postUpload = (req, res, next) => {
	/* did not implement
	upload.fields([
	    {name: 'file1'},
	    {name: 'file2'},
	    {name: 'file3'},
	    {name: 'file4'},
	    {name: 'file5'}
	]);
	for (const i in req.files) {
		console.log(req.files[i]);
	}
	req.flash('success', 'Upload succeed!');
	res.redirect('/upload');
	*/
};

exports.getUserPost = async (req, res, next) => {
	const page = req.query.p ? parseInt(req.query.p) : 1;
	const name = req.params.name;
	const query = {};
	if (name) {
		query.name = name;
	}
	try {
		// Check if user exist
		const user = await User.findOne({ name: name });
		if (!user) {
			req.flash('error', 'User did not exist!');
			return res.redirect('/');
		}
		const totalPosts = await Post.find(query).countDocuments();
		const posts = await Post.find(query).skip((page - 1)*10).limit(10).sort({ time: -1 });
		if (!posts) {
			req.flash('error', 'User can not find');
			return res.redirect('/');
		}
		posts.forEach((doc) => {
			doc.post = markdown.toHTML(doc.post);
		});
		res.render('user', {
			title: user.name,
			posts: posts,
			page: page,
			isFirstPage: (page - 1) == 0,
			isLastPage: ((page - 1) * 10 + posts.length) == totalPosts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	} catch (err) {
		return next(get500(err));
	}
};

exports.getSubjectPost = async (req, res, next) => {
	const id = req.params._id;
	const update = { $inc: { pv: 1 } };
	try {
		const postObj = await Post.findByIdAndUpdate(id, update, { new: true });
		if (!postObj) {
			req.flash('error', 'Post can not find!');
			return res.redirect('/');
	  	}
		postObj.post = markdown.toHTML(postObj.post);
		if (undefined != postObj.comments) {
			postObj.comments.forEach((comment) => {
				comment.content = markdown.toHTML(comment.content);
			});
		}		
		res.render('article', {
			title: postObj.title,
			post: postObj,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
	  	});
	} catch (err) {
		return next(get500(err));
	}
};

exports.getEditPost = async (req, res, next) => {
	const id = req.params._id;
	try {
		const post = await Post.findById(id);
		res.render('edit', {
			title: 'Edit post',
			post: post,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
	  	});
	} catch (err) {
		req.flash('error', err);
	    return res.redirect('back');
	}
};

exports.putPost = async (req, res, next) => {
	const uriObj = {
		_id: req.params._id,
		name: req.session.user,
		day: req.params.day,
		title: req.params.title,
		post: req.body.post
	};
	const url = getUri(uriObj);
	const id = { "_id" : req.params._id };
	const update = { $set: { "post": req.body.post } };
	try {
		await Post.findByIdAndUpdate(id, update, { new: true });
		req.flash('success', 'Your post has been updated!');
		return res.redirect(url);
	} catch (err) {
		req.flash('error', err);
		return res.redirect(url);
	}
};

exports.deletePost = async (req, res, next) => {
	const id = req.params._id;
	try {
		const post = await Post.findById(id);
		let reprint_info = "";
		if (post.reprint_info.reprint_from) {
			reprint_info = post.reprint_info;
		}
		if (reprint_info.reprint_from != undefined) {
			// Update origianl post if current post is a share post
			const org_id = { "_id" : reprint_info.reprint_from.pid };
 			const update = { 
				$pull: { 
					"reprint_info.reprint_to": {	
						"pid" : post._id,
						"name" : post.name,
						"day" : post.time.day,
						"title" : post.title
					}
				}
			};
			await Post.findByIdAndUpdate(org_id, update, { new: true });			
		}
		if (reprint_info.reprint_to != undefined) {
			const reprint_to_lst = reprint_info.reprint_to;
			reprint_to_lst.forEach(async (share_post) => {
				// Update share post if current post is the origin of them
				const sh_id = { "_id" : share_post.pid };
				const update = { $set: { "reprint_info.reprint_from": {} } };
				await Post.findByIdAndUpdate(sh_id, update, { new: true });				
			});
		}
		await Post.deleteOne({ "_id" : id });
		req.flash('success', 'Post has been deleted!');
		res.redirect('/');
	} catch (err) {
		return next(get500(err));
	}
};

exports.getSearchPost = async (req, res, next) => {
	const keyword = req.query.keyword;
	try {
		const pattern = new RegExp(keyword, "i");
		const query = { "title": pattern };
		const opt_index = { "name": 1, "time": 1, "title": 1 };
		const posts = await Post.find(query, null, opt_index).sort({ time: -1 });
		res.render('search', {
			title: "Result for: " + keyword,
			posts: posts,
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	} catch (err) {
		req.flash('error', err);
		return res.redirect('/');
	}
};

exports.getReprintPost = async (req, res, next) => {
	const id = req.params._id;
	try {
		const org_post = await Post.findById(id);
		if (!org_post) {
			req.flash('error', 'Original post has been delete!');
			return res.redirect('back');
		}
		const currentUser = req.session.user;
		const reprint_from = { name: org_post.name, day: org_post.time.day, title: org_post.title, pid: id };
		const reprint_to = { name: currentUser.name, head: currentUser.head };
		const date = new Date();
		const time = getTimeObj(date);
		const repostObj = new Post({
			name: reprint_to.name,
			head: reprint_to.head,
			time: time,
			title: (org_post.title.search(/~Share~/) > -1) ? org_post.title : "~Share~" + org_post.title,
			tags: org_post.tags,
			post: org_post.post,
			comments: [],
			reprint_info: { "reprint_from": reprint_from },
			pv: 0
		});
		const repost = await Post.create(repostObj);
		const update = { 
			$push: { 
				"reprint_info.reprint_to": {
					"pid": repost._id,
					"name": repost.name,
					"day": time.day,
					"title": repost.title
				}
			}
		};
		await Post.findByIdAndUpdate(id, update, { new: true });
		req.flash('success', 'Share succeed!');
	    res.redirect('/');
	} catch (err) {
		req.flash('error', err);
		return res.redirect('back');
	}
};