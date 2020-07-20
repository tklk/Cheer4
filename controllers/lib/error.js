exports.get404 = (req, res, next) => {
    res.status(404).render('404', {
        title: '',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
};
  
exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        title: '',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
};