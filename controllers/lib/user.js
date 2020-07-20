const crypto = require('crypto');
const User = require('../../models/userModel');
const { get500 } = require('../../util/error');

exports.getSignup = (req, res, next) => {
	res.render('reg', {
		title: 'Sign up',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
}

/***
/*  Save user information
/*    If succeed, redirect index
/*      else return error
***/
exports.postSignup = async (req, res, next) => {
	const name = req.body.name;
	let password = req.body.password;
    const password_re = req.body['password_repeat'];
	const email = req.body.email;
    // Check password typo error
	if (password_re !== password) {
		req.flash('error', 'Password did not match!');
		return res.redirect('/reg');
	}

	// Encrypt pwd by md5
	const md5 = crypto.createHash('md5');
	password = md5.update(password).digest('hex');

	try {
		const user = await User.findOne({ name: name });
		// Check the username
		if (user) {
			console.log('!@#')
			req.flash('error', 'Username is not available!');
			return res.status(409).render('reg', {
				title: 'Sign up',
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		} 
		const md5 = crypto.createHash('md5');
		const email_MD5 = md5.update(email.toLowerCase()).digest('hex');
		const head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
		const userObj = {
			name: name,
			password: password,
			email: req.body.email,
			head: head
		};
		await User.create(userObj);
		// Store user info
		req.session.user = user;
		req.flash('success', 'Register success!');
		
        return res.status(201).redirect('/');
	} catch (err) {
		console.log(err);
        return next(get500(err));
	}
};

exports.getLogin = (req, res, next) => {
	res.render('login', {
		title: 'Login',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
};

exports.postLogin = async (req, res, next) => {
	const md5 = crypto.createHash('md5');
	const password = md5.update(req.body.password).digest('hex');
	try {
		const user = await User.findOne({name: req.body.name});
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
	} catch (err) {
		return next(get500(err));
	}
};

exports.getLogout = (req, res, next) => {
	req.session.user = null;
	req.flash('success', 'Logout succeed!');
	res.redirect('/');
};

exports.getReset = (req, res, next) => {
	res.render('reset', {
		title: 'Reset password',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
};

exports.postReset = async (req, res, next) => {
	const uid = req.session.user._id;
	let old_pwd = req.body['pwd-old'];
	let new_pwd = req.body['pwd-new'];
	const new_pwd_repeat = req.body['pwd-repeat'];

    // Check password typo error
    if (new_pwd != new_pwd_repeat) {
        req.flash('error', 'New password did not match!');
        return res.redirect('/reset');
    }

    // Encrypt pwd by md5
    let hash_old = crypto.createHash('md5');
	let hash_new = crypto.createHash('md5');
	old_pwd = hash_old.update(old_pwd).digest('hex');
	new_pwd = hash_new.update(new_pwd).digest('hex');

	try {
		const user = await User.findById(uid);
		if (user.password != old_pwd) {
			req.flash('error', 'Current password is incorrect!');
			return res.redirect('/reset');
		} else {
			user.password = new_pwd;
			await user.save();
			req.flash('success', 'Reset password success!');
			res.redirect('/');
		}		
	} catch (err) {
		return next(get500(err));
	}
};

exports.getLink = async (req, res, next) => {
	res.render('links', {
		title: 'Follow: ',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
};