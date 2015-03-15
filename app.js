var express     = require('express'),
path            = require('path'),
favicon         = require('serve-favicon'),
passport        = require('passport')
util            = require('util'),
FacebookStrategy = require('passport-facebook').Strategy,
logger          = require('morgan'),
cookieParser    = require('cookie-parser'),
bodyParser      = require('body-parser'),
methodOverride  = require('method-override'),
session         = require('express-session'),
port            = Number(process.env.PORT || 3700),
app             = express(),
Client          = require('node-rest-client').Client,
client          = new Client(),
mysql           = require('mysql');

var connection = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: 'root',
   database: 'folklik',
   port: 3306
});

connection.connect(function(error){
   if(error){
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

app.use(session({secret:"thisisthesecret"}));

app.use(express.static(path.join(__dirname, 'html')));

//app.engine('.html', require('jade').__express);

var io = require('socket.io').listen(app.listen(port));

console.log("Listening port " + port);

app.get("/", function(req, res){
    res.render("index",{title:"Keep - La Herramienta para presentaciones dinamicas"});
});

app.post("/choose",function(req,res){

});

app.get("/screen", function(req, res){
  res.sendfile(path.join(__dirname, 'html')+"/screen.html");
});
app.get("/screen2", function(req, res){

  res.sendfile(path.join(__dirname, 'html')+"/screenUser.html");
});


//SOCKETS
io.on('connection', function(socket){

    socket.on("login",function(usuario){
        var args = {
            data: usuario,
            headers:{"Content-Type": "application/json"}
        };

    });

    //slidechanged
        socket.on("slidechanged",function(indice){
            io.emit("slided",indice.h);
        });

    //Nuevo usuario
     socket.on('nuevoUsuario', function(u){

      var args = {
          data: u,
          headers:{"Content-Type": "application/json"}
      };
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
