const Post = require('../../models/postModel');
const crypto = require('crypto');

function getUri (uriObj) {
	return encodeURI('/u/' + uriObj.name + '/' + uriObj.day + '/' + uriObj.title + '/' + uriObj._id);
}

exports.postComment = async (req, res, next) => {
	const date = new Date();
	const time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
					date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());

	const md5 = crypto.createHash('md5');
	const email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex');
	const head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";

	const comment = {
		name: req.body.name,
		head: head,
		email: req.body.email,
		time: time,
		content: req.body.content
	};
	try {
		const id = { "_id" : req.params._id };
		const update = { $push: { "comments" : comment } };
		await Post.findByIdAndUpdate(id, update, { new: true });
		req.flash('success', 'Your comment has been added!');
	    res.redirect('back');
	} catch (err) {
		req.flash('error', err);
	    return res.redirect('back');
	}
};

/// 
exports.getEditComment = async (req, res, next) => {
	const pid = req.params._id;
	const cid = req.params._cid;
	try {
		let comment = {};
		const post = await Post.findById(pid);
		for (let cmt of post.comments) {
			if (cmt._id == cid) {
				comment = cmt;
				break
			}
		}
		if (comment == undefined) {
			err.message = "comment not exist";
			throw err;		
		}
		res.render('comment-edit', {
			title: post.title,
		  	post: post,
			edit_comment: comment,	
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
	  	});
	} catch (err) {
		req.flash('error', err);
		return res.redirect('back');
	}
};

exports.putComment = async (req, res, next) => {
	const uriObj = {
		_id: req.params._id,
		name: req.session.user,
		day: req.params.day,
		title: req.params.title
	};
	const url = getUri(uriObj);
	const query = { "comments._id": req.params._cid };
	const update = { $set: { "comments.$.content": req.body.content } };
	try {
		await Post.update(query, update, { new: true });
		req.flash('success', 'Your comment has been updated!');
		res.redirect(url);
	} catch (err) {
		req.flash('error', err);
		return res.redirect(url);
	}
};

exports.deleteComment = async (req, res, next) => {
	const id = { "_id" : req.params._id };
	const update = { 
		$pull: { 
			"comments" : {
				"_id" : req.params._cid 
			} 
		} 
	};
	
	try {
		await Post.findByIdAndUpdate(id, update, { new: true });
		req.flash('success', 'Comment has been deleted!');
		return res.redirect('back');
	} catch (err) {
		req.flash('error', err);
		return res.redirect('back');
	}
};