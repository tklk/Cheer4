module.exports = {
	// Restrict the page visitor can access
	checkLogin: function checkLogin (req, res, next) {
		if (!req.session.user) {
			req.flash('error', 'Please login to your account or register one!');
			return res.redirect('/login');
	    }
	    next();
	},
	// Restrict the page user can access
	checkNotLogin: function checkNotLogin(req, res, next) {
	    if (req.session.user) {
			req.flash('error', 'You can not access the page when you are login!');
			return res.redirect('back');
	    }
	    next();
	}
}
