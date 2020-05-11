var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var User = require('../models/user.js'),
	Post = require('../models/post.js'),
	Comment = require('../models/comment.js');

var multer  = require('multer');

var storage = multer.diskStorage({
  	destination: function (req, file, cb) {
    	cb(null, './public/images')
  	},
  	filename: function (req, file, cb) {
    	cb(null, file.originalname)
  	}
})
// var upload = multer({dest: './public/images'});
var upload = multer({ storage: storage })

// Restrict the page visitor can access
function checkLogin(req, res, next) {
    if (!req.session.user) {
		req.flash('error', 'Please login to your account or register one!'); 
		res.redirect('/login');
    }
    next();
}

// Restrict the page user can access
function checkNotLogin(req, res, next) {
    if (req.session.user) {
		req.flash('error', 'You can not access the page when you are login!'); 
		res.redirect('back');
    }
    next();
}

// GET home page
router.get('/', function (req, res) {
  	// Parse and check
  	var page = req.query.p ? parseInt(req.query.p) : 1;
  	
  	// Return 10 posts in this page
  	Post.getTen(null, page, function (err, posts, total) {
    	if (err) {
      		posts = [];
    	} 
    	res.render('index', {
      		title: 'Cheers',
      		posts: posts,
      		page: page,
      		isFirstPage: (page - 1) == 0,
      		isLastPage: ((page - 1) * 10 + posts.length) == total,
      		user: req.session.user,
      		success: req.flash('success').toString(),
      		error: req.flash('error').toString()
    	});
  	});
});

// GET register
router.get('/reg', checkNotLogin);
router.get('/reg', function (req, res, next) {
	res.render('reg', {
    	title: 'Sign up',
    	user: req.session.user,
    	success: req.flash('success').toString(),
    	error: req.flash('error').toString()
	});
});

router.post('/reg', checkNotLogin);
router.post('/reg', function (req, res) {
	var name = req.body.name,
		password = req.body.password,
		password_re = req.body['password-repeat'];
  
	// Check password typo error
  	if (password_re != password) {
    	req.flash('error', 'Password did not match!'); 
    	return res.redirect('/reg');
    }
  
  	// Encrypt pw by md5
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');

	var newUser = new User({
		name: name,
		password: password,
		email: req.body.email
	});
  
	User.get(newUser.name, function (err, user) {
		if (err) {
			req.flash('error', err);
			return res.redirect('/');
		}
		// Check the username
		if (user) {
			req.flash('error', 'Username is not available!');
			return res.redirect('/reg');
		}
    	// create user
	    newUser.save(function (err, user) {
			if (err) {
				req.flash('error', err);
	        	return res.redirect('/reg');
			}
			// Store user info
			req.session.user = user;
			req.flash('success', 'Register success!');
			res.redirect('/'); 
	    });
  	});
});

// GET login
router.get('/login', checkNotLogin);
router.get('/login', function (req, res, next) {
	res.render('login', {
    	title: 'Login',
    	user: req.session.user,
    	success: req.flash('success').toString(),
    	error: req.flash('error').toString()
	});
});

router.post('/login', checkNotLogin);
router.post('/login', function (req, res) {
	var md5 = crypto.createHash('md5'),
		password = md5.update(req.body.password).digest('hex');

  	User.get(req.body.name, function (err, user) {
    	if (!user) {
      		req.flash('error', 'User not exist!'); 
      		return res.redirect('/login');
    	}
    	if (user.password != password) {
      		req.flash('error', 'The password you entered was incorrect!'); 
      		return res.redirect('/login');
    	}    	
		req.session.user = user;
    	req.flash('success', 'Hello!');
    	res.redirect('/');
  	});
});

// GET post
router.get('/post', checkLogin);
router.get('/post', function (req, res, next) {
  	res.render('post', {
		title: 'Create a post',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
    });
});

// CREATE post
router.post('/post', checkLogin);
router.post('/post', function (req, res) {
	var currentUser = req.session.user,
    	tags = [req.body.tag1, req.body.tag2, req.body.tag3],
    	post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);

  	post.save(function (err) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('/');
    	}
    	req.flash('success', 'You have create a new post!');
    	res.redirect('/');
  	});
});

// GET logout
router.get('/logout', checkLogin);
router.get('/logout', function (req, res, next) {
	req.session.user = null;
	req.flash('success', 'Logout succeed!');
	res.redirect('/');
});

// UPLOAD file
router.get('/upload', checkLogin);
router.get('/upload', function (req, res, next) {
	res.render('upload', {
    	title: 'Upload file',
    	user: req.session.user,
    	success: req.flash('success').toString(),
    	error: req.flash('error').toString()
	});
});

router.post('/upload', checkLogin);
router.post('/upload', upload.fields([
    {name: 'file1'},
    {name: 'file2'},
    {name: 'file3'},
    {name: 'file4'},
    {name: 'file5'}
]), function (req, res, next) {
    for(var i in req.files) {
        console.log(req.files[i]);
    }
    req.flash('success', 'Upload succeed!');
    res.redirect('/upload');
});

// GET post by user
router.get('/u/:name', function (req, res, next) {
	var page = req.query.p ? parseInt(req.query.p) : 1;
  	// Check if user exist
  	User.get(req.params.name, function (err, user) {
    	if (!user) {
			req.flash('error', 'User did not exist!'); 
			return res.redirect('/');
    	}
    	// Return 10 posts in page
    	Post.getTen(user.name, page, function (err, posts, total) {
    		if (err) {
        		req.flash('error', err); 
        		return res.redirect('/');
      		}
      		res.render('user', {
        		title: user.name,
        		posts: posts,
        		page: page,
        		isFirstPage: (page - 1) == 0,
        		isLastPage: ((page - 1) * 10 + posts.length) == total,
        		user: req.session.user,
        		success: req.flash('success').toString(),
        		error: req.flash('error').toString()
      		});
    	});
  	});
});

// GET post by subject
router.get('/u/:name/:day/:title', function (req, res, next) {
	Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('/');
    	}
    	res.render('article', {
      		title: req.params.title,
      		post: post,
      		user: req.session.user,
      		success: req.flash('success').toString(),
      		error: req.flash('error').toString()
    	});
  	});
});

// CREATE comment
router.post('/u/:name/:day/:title', function (req, res, next) {
	var date = new Date(),
		time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
				date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  	
  	var md5 = crypto.createHash('md5'),
    	email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
    	head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 

  	var comment = {
		name: req.body.name,
		head: head,
		email: req.body.email,
		website: req.body.website,
		time: time,
		content: req.body.content
  	};

  	var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
  	
  	newComment.save(function (err) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('back');
    	}
    	req.flash('success', 'Your comment has been added!');
    	res.redirect('back');
  	});
});

// EDIT post
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res, next) {
	var currentUser = req.session.user;

	Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('back');
    	}
    	res.render('edit', {
      		title: 'Edit post',
      		post: post,
      		user: req.session.user,
      		success: req.flash('success').toString(),
      		error: req.flash('error').toString()
    	});
  	});
});

router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res, next) {
  	var currentUser = req.session.user;
  	
  	Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
    	var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
    	
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect(url);
    	}
    	req.flash('success', 'Your post has been updated!');
    	res.redirect(url);
  	});
});

// REMOVE post
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res, next) {
  	var currentUser = req.session.user;
  	
  	Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('back');
    	}
    	req.flash('success', 'Post has been deleted!');
    	res.redirect('/');
  	});
});

// ARCHIVE post
router.get('/archive', function (req, res, next) {
	Post.getArchive(function (err, posts) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('/');
    	}
    	res.render('archive', {
      		title: 'Archive post',
      		posts: posts,
      		user: req.session.user,
      		success: req.flash('success').toString(),
      		error: req.flash('error').toString()
    	});
  	});
});

// GET all tags
router.get('/tags', function (req, res, next) {
	Post.getTags(function (err, posts) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('/');
    	}
    	res.render('tags', {
      		title: 'Tags',
      		posts: posts,
      		user: req.session.user,
      		success: req.flash('success').toString(),
      		error: req.flash('error').toString()
    	});
  	});
});

// GET posts by tag
router.get('/tags/:tag', function (req, res, next) {
	Post.getTag(req.params.tag, function (err, posts) {
	    if (err) {
	      	req.flash('error',err); 
	      	return res.redirect('/');
	    }
	    res.render('tag', {
	      	title: '#tag: ' + req.params.tag,
	      	posts: posts,
	      	user: req.session.user,
	      	success: req.flash('success').toString(),
	      	error: req.flash('error').toString()
	    });
	});
});

// SEARCH post
router.get('/search', function (req, res, next) {
	Post.search(req.query.keyword, function (err, posts) {
    	if (err) {
      		req.flash('error', err); 
      		return res.redirect('/');
    	}
    	res.render('search', {
      		title: "Result for: " + req.query.keyword,
      		posts: posts,
      		user: req.session.user,
      		success: req.flash('success').toString(),
      		error: req.flash('error').toString()
    	});
  	});
});

// Get Link
router.get('/links', function (req, res, next) {
	res.render('links', {
		title: 'Follow: ',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});

// REPRINT post
router.get('/reprint/:name/:day/:title', checkLogin);
router.get('/reprint/:name/:day/:title', function (req, res, next) {
	Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
		if (err) {
      		req.flash('error', err); 
      		return res.redirect(back);
    	}

    	var currentUser = req.session.user,
        	reprint_from = {name: post.name, day: post.time.day, title: post.title},
        	reprint_to = {name: currentUser.name, head: currentUser.head};
    	Post.reprint(reprint_from, reprint_to, function (err, post) {
      		if (err) {
        		req.flash('error', err); 
        		return res.redirect('back');
      		}
      		req.flash('success', 'Share succeed!');
      		res.redirect('/');
    	});
  	});
});

module.exports = router;