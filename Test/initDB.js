const crypto = require('crypto');
const User = require('../models/userModel');
const Post = require('../models/postModel');

function Test(name) {
    this.name = name;
}

module.exports = Test;

/***
/*  Create Test Account, if it is not exist
/*    If succeed, return null
/*      else return error
/**/
Test.prototype.init =  async function () {
    const pwd = process.env.Test_pwd;
	const email = "github.com/tklk/"
    let pwdhash = crypto.createHash('md5');
    let emailhast = crypto.createHash('md5');
	const password = pwdhash.update(pwd).digest('hex');

	try {
		const user = await User.findOne({ name: this.name });
		if (user) {
            console.log('User exist');
            return
		} 
		const head = "http://www.gravatar.com/avatar/" + emailhast.update(email.toLowerCase()).digest('hex') + "?s=48";
		const userObj = new User({
			name: this.name,
			password: password,
			email: email,
			head: head
		});
		const initUser = await User.create(userObj);
        const date = new Date();
	    const time = {
            date: date,
            year : date.getFullYear(),
            month : date.getFullYear() + "-" + (date.getMonth() + 1),
            day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        };
        const tags = ['Greet', 'Hello, Hola!', ':-)'];
        const post = new Post({
            name: initUser.name,
            head: initUser.head,
            time: time,
            title: "Greeting from developer",
            tags: tags,
            post: "### Welcome! \r\n **It is a pleasure to have you joining the community!**",
            comments: [],
            reprint_info: {},
            pv: 0
        });
        await Post.create(post);
        console.log('Init success!');
    } catch (err) {
        console.log('Init error: '+err);
    }    
}