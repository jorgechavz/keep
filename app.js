var express     = require('express'),
path            = require('path'),
favicon         = require('serve-favicon'),
logger          = require('morgan'),
cookieParser    = require('cookie-parser'),
bodyParser      = require('body-parser'),
session         = require('express-session'),
port            = Number(process.env.PORT || 3700),
app             = express(),
Client          = require('node-rest-client').Client,
client          = new Client();



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

console.log("Escuchando puerto " + port);

app.get("/", function(req, res){ 
    if(typeof req.session.usuario == "undefined"){
      res.render("index",{title:"Keep - La Herramienta para presentaciones dinamicas"});
    }else if(req.session.usuario.idrol == 1){
        res.location("/admin");            
       res.redirect("/admin");
    }else{
       io.sockets.emit("newLogin",req.session.usuario.nickname);
       res.location("/screen");            
       res.redirect("/screen");
    }
});

app.get("/edit",function(req,res){
   var idusuario = req.query["id"];  
  client.get("http://draw-138381.usw1-2.nitrousbox.com:9000/userid/"+idusuario,function(usuario){
    res.render("edit",JSON.parse(usuario));  
  });
  
});

app.get("/screen", function(req, res){
  if(typeof req.session.usuario == "undefined"){
      res.location("/");
      res.redirect("/");
  }else if(req.session.usuario.idrol == 1){
      res.sendfile(path.join(__dirname, 'html')+"/screen.html");
  }else{
      res.sendfile(path.join(__dirname, 'html')+"/screenUser.html");
  }
});

app.get("/addrol",function(req,res){
    
        res.render("addrol");        
    
});

app.get("/usuarios",function(req,res){
  if(typeof req.session.usuario == "undefined"){
    res.location("/");            
    res.redirect("/");
  }else{
    res.render("usuarios");
  }
});


app.get("/session",function(req,res){
    
    req.session.usuario = {
        idrol       :   req.query["idrol"],
        nickname    :   req.query["nickname"],
        idusuario  :   req.query["idusuario"]
    }  

    console.log(req.session.usuario);
    res.location("/");
    res.redirect("/");
});

app.get("/registro",function(req,res){  
  res.render("registro",{title:"Registro"});      
});

app.get("/admin",function(req,res){
  if(typeof req.session.usuario == "undefined"){
      res.location("/");
      res.redirect("/");
  }else{
      res.render("admin",{idusuario:req.session.usuario.idusuario});      
  }
});

app.get("/comentar",function(req,res){
  if(typeof req.session.usuario == "undefined"){
      res.location("/");
      res.redirect("/");
  }else{
  res.render("comentar",{ 
    idusuario : req.session.usuario.idusuario
  });
  }
    //var comentario = req.query['comentario'];
    //console.log(req.sesssion.usuario);  
});

app.get("/addcomment",function(req,res){
    var comentario = req.query['comentario'];
    console.log(comentario);
    console.log(req.sesssion.usuario);  
});

app.get("/logout",function(req,res){
    req.session.usuario = undefined;    
    res.location("/");
    res.redirect("/"); 
});


//SOCKETS
io.on('connection', function(socket){    
    socket.on("newComent",function(comentario){ 
      var args = {
            data: {
              comentario  : comentario.texto,
              usuario     :  {id : comentario.idusuario}
            },
            headers:{"Content-Type": "application/json"} 
      };
      console.log(args);
      
        client.post("http://draw-138381.usw1-2.nitrousbox.com:9000/comentario/",args,function(data){
          var data = JSON.parse(data);
          console.log("Se agrego comentario");
          console.log(data);
            client.get("http://draw-138381.usw1-2.nitrousbox.com:9000/userid/"+data.usuario.id,function(datos){
              var datos = JSON.parse(datos);
              if(datos != undefined){
                io.emit("newComment",{
                  comentario : data.comentario,
                  nickname   : datos.nickname
                });
              }             
            });            
        });
    });
    socket.on("login",function(usuario){                    

        var args = {
            data: usuario,
            headers:{"Content-Type": "application/json"} 
        };

        client.post("http://draw-138381.usw1-2.nitrousbox.com:9000/login/",args, function(data){
            if((data != "null") &&(data != "")){
                socket.emit("login",data);                
            }else{
                //Enviamos mensaje, datos incorrectos
                socket.emit("credInvalid","Datos incorrectos");
            }
        });

    });


    //El usuario a registrar existe?
    socket.on("userExist",function(nickname){        
        client.get("http://draw-138381.usw1-2.nitrousbox.com:9000/user/"+nickname, function(data){
          console.log("La busqueda del usuario dio a: "+typeof data);
            if((data != "null") && (data != "")){
                socket.emit("userExist",true);
            }else{
                socket.emit("userExist",false);
            }
        });

    });



    //Nuevo usuario   
       socket.on('nuevoUsuario', function(u){

        var args = {
            data: u,
            headers:{"Content-Type": "application/json"} 
        };


        client.post("http://draw-138381.usw1-2.nitrousbox.com:9000/add/", args, 
            function(data){                
                if(data){                    
                    socket.emit('nuevoUsuario');
                }
            }
        );

       });

    //Nuevo Rol
        socket.on("nuevoRol",function(rol){
            var args = {
                data: rol,
                headers:{"Content-Type": "application/json"} 
            };   

            client.post("http://draw-138381.usw1-2.nitrousbox.com:9000/addrol/", args,function(data){                
                socket.emit("nuevoRol",data);
            });
        });

    //Nuevo comentario
        socket.on("nuevoComentario",function(comentario){
          console.log(comentario);
          io.emit("newComment",comentario);
        });


    //slidechanged
        socket.on("slidechanged",function(indice){            
            io.emit("slided",indice.h);
        });

    //Obtenemos los roles para ofrecerlos al cliente
        socket.on("getRoles",function(){            
            client.get("http://draw-138381.usw1-2.nitrousbox.com:9000/roles/",function(roles){
                socket.emit("getRoles",eval('{' + roles + '}'));
            });
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
