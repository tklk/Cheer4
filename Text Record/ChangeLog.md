## Cheer Changelog
<a name="0.0.4"></a>
# 0.0.4 (2020-07-19)
* Update controllers:
  * Export function from lib, replace async waterfall to async/await
* Remove index.js in /models folder
* Update initDB.js
* Add 404 handler and 500 handler
* Update routes.js module
* Add helmet, compression
* Add emoji schema

<a name="0.0.3"></a>
# 0.0.3 (2020-06-14)
* Update Share panel in discussion.ejs
* Update MongoDB pkg to Mongoose pkg
  * ./lib/post.js done!
    * getTen
    * getArchive
    * getTags
    * getTag
    * search
* Update comment.ejs
  * only register user can reply 
* Add Edit comment, Delete comment functions
  * postModel
    * enable auto generate _id
  * postController
    * Add GET Edit comment
    * Add Post Edit comment
    * Add Get Remove comment
  * comment.js
    * Add comment.edit
    * Add comment.update
    * Add comment.remove
  * view folder
    * Create comment-edit.ejs
    * discussion.ejs + comment._id
* Add require in every HTML form post
  * comment.ejs @ comment.content
  * edit.ejs @ Content.post
  * header.ejs @ Search
  * post.ejs @ post
  * reg.ejs @ name, pwd, repws, email
* Add update password
  * Create reset.ejs
  * Add /reset in header.ejs
  * Add update_pwd in user.js
  * Add controller for get and post /reset
* Create Test Account and post
  * New folder Test
  * run initDB.js once the db is up


<a name="0.0.2"></a>
# 0.0.2 (2020-06-14)
* Rename model folder to lib folder
* Create models folder for mongoose schema model
* Create mongoose schema
  * postModel
  * userModel
* Update MongoDB pkg to Mongoose pkg
  * ./lib/commet.js done!
  * ./lib/user.js done!
  * ./lib/post.js partial update
    * Require update function :
    * getTen
    * getArchive
    * getTags
    * getTag
    * search
* Update conntroller folder
  * GET post by subject + _id
  * POST new comment + _id
  * GET Edit post + _id
  * POST Update post + _id
  * GET Remove post + _id
  * GET reprint post + _id
* Update view folder
  * archive.ejs + post._id
  * article.ejs + post._id 
  * discussion.ejs + post._id / undefined, share model
  * index.ejs + post._id 
  * search.ejs + post._id
  * tag.ejs + post._id 
  * user.ejs + post._id  


<a name="0.0.1"></a>
# 0.0.1 (2020-06-11)
* Create folder controller
  * spilt original ./routes/index.js into separate controller
* Create router.js
  * Parent of all controller
* Update config
  * Create default.json for development mode
  * Move ./setting.js into config and use process.env for production mode (need test)
* Create Text Record folder 
  * Add ToDo.txt
  * Add ChangeLog.md
  * Add Active mongodb, Node.txt