module.exports = {
  port: 3000,
  session: {
	secret: 'cheer4',
	key: 'cheer4',
	maxAge: 1000 * 60 * 60 * 24 * 30 //30 days
  },
  mongodb: 'mongodb://localhost:27017/blog'
}
/*
module.exports = {
  cookieSecret: 'myblog',
  db: 'blog',
  host: 'localhost',
  port: 27017
};

app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  store: new MongoStore({
    url:'mongodb://localhost/blog'
  })
}));

*/
