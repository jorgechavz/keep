var express       = require('express'),
path              = require('path'),
favicon           = require('serve-favicon'),
passport          = require('passport')
util              = require('util'),
FacebookStrategy  = require('passport-facebook').Strategy,
logger            = require('morgan'),
cookieParser      = require('cookie-parser'),
bodyParser        = require('body-parser'),
methodOverride    = require('method-override'),
session           = require('express-session'),
config            = require('./configuration/config'),
port              = Number(process.env.PORT || 3000),
app               = express(),
Client            = require('node-rest-client').Client,
client            = new Client(),
mysql = require('mysql');

var connection = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: '123asd',
   database: 'keep',
   port: 3306
});

connection.connect(function(error) {
   if(error) {
      throw error;
   }else{
      console.log('Mysql went nice.');
   }
});


// Motor para las vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'html')));
app.use(session({ secret: 'keyboard cat', key: 'sid'}));
app.use(passport.initialize());
app.use(passport.session());

// Passport session setup.
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
// Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret:config.facebook_api_secret ,
    callbackURL: config.callback_url
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      //Further DB code.
      return done(null, profile);
    });
  }
));

//app.engine('.html', require('jade').__express);

var io = require('socket.io').listen(app.listen(port));

console.log("Listening port " + port);

app.get('/', function(req, res) {
  if(req.user) {
    var exists = connection.query("SELECT * FROM users WHERE fb_id = ?",[req.user.id], function(error, result) {
         if(result.length > 0) {
            console.log("User " + result[0].name + " already exists");
         } else {
            var query = connection.query('INSERT INTO users (fb_id, name, role) VALUES(?, ?, ?)', [req.user.id, req.user.displayName, 0], function(error, result) {
              console.log("User " + req.user.displayName +" inserted");
            });
         }
    });
  }
  res.render("index",{title:"Keep - La Herramienta para presentaciones dinamicas", user: req.user });
});

app.post("/", function(req, res) {
    console.log(req.body.id);
    res.redirect('/presentation');
});

app.get('/presentation', function(req, res) {
  if(req.user) {
    var exists = connection.query("SELECT * FROM users WHERE fb_id = ?",[req.user.id], function(error, result) {
         if(result.length > 0) {
            console.log("User " + result[0].role + " role");
            res.sendfile(path.join(__dirname, 'html')+"/screen.html");
         } else {
            console.log("Normal user");
            res.sendfile(path.join(__dirname, 'html')+"/screenUser.html");
         }
    });
  } else {
    res.sendfile(path.join(__dirname, 'html')+"/screenUser.html");
  }
});

/*
app.get('/account', ensureAuthenticated, function(req, res) {
  res.render('account', { user: req.user });
});
*/

//Passport Router
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
       successRedirect : '/',
       failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/');
  });
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

//SOCKETS
io.on('connection', function(socket) {
  //slidechanged
  socket.on("slidechanged",function(indice) {
    io.emit("slided",indice.h);
  });
});


//ERRORES
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.render("404");
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
