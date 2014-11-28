angular.module('keep',[]).
	controller("comentar",function($scope,$http){
		var socket = io();	
		
		$scope.submit = function(comentario){
//       var grocerias = ["puta", "puto","marica","pirobo","gonorrea","pendejo","culero","pito","estupido","estupida","panocha",""]
      
//           for(var i = 0; i < grocerias.length;i++){
//               regex = new RegExp("(^|\\s|[;,\\.\\!¡\\?¿])"+grocerias[i]+"($|(?=(\\s|[;,\\.\\!¡\\?¿])))","gi")
//               comentario.texto = comentario.texto.replace(regex, function($0, $1){return $1 + "#4@!@"});
//           }               
			if(comentario != undefined){        
				socket.emit("newComent",comentario);
        $scope.comentario.texto = undefined;
			}
      
		}
	}).
	controller("roles",function($scope,$http){	
		var socket = io();		
		$scope.roles = [];
		$scope.exito = false;
		$scope.error = false;

		//Obtenemos los roles actuales    
		socket.emit("getRoles");
    
		socket.on("getRoles",function(roles){			
			$scope.roles = roles;
			$scope.$apply();
		});
			
	    //Cuando se agrego mostramos mensaje
		socket.on("nuevoRol",function(data){
			$scope.exito = true;
			$scope.$apply();
		});

	    //Agregamos el rol a la base de datos en caso de no existir
	    $scope.addrol = function(rol){
			if(rol != undefined){				
				var tmp = [];
				var existe = 0;			
				if($scope.roles.length > 0){			
					for(var i = 0; i < $scope.roles.length; i++){					
						if(rol.rol == $scope.roles[i].rol){
							existe = 1;
						}			
					}

					if(existe != 1){
						angular.copy(rol,tmp);
						$scope.roles.push(tmp);
						socket.emit("nuevoRol",rol);
						$scope.rol = undefined;
					}else{
						$scope.error = true;
					}
				}else{
					angular.copy(rol,tmp);
					$scope.roles.push(tmp);
					socket.emit("nuevoRol",rol);
				}
			}
		}


	}).//Controlador de Home
	controller("home",function($scope){
		var socket = io();	

		//Emitimos lo que el usuario agrego de nickname y password
		$scope.login = function(usuario){
			if(usuario != undefined){				
				socket.emit("login",usuario);
			}else{
				$scope.showCredInvalid = true;
				$scope.razonInvalid = "Llene ambos campos";			
			}
		}


		//Si el server contesta con login, entonces lo redirigimos 
		socket.on("login",function(usuario){

			$("#login").removeClass("bounceInDown");
			$("#login").addClass("bounceOutUp");
			$("#login").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){
			
        var u 			= JSON.parse(usuario),
				rolid 		= u.rol.id,
				nickname 	= u.nickname,
				idusuario	= u.id;

				//Redirigimos
				window.location = "/session?idrol="+rolid+"&nickname="+nickname+"&idusuario="+idusuario;
			});
		});		
		//Algo salio mal con el login, mostramos mensaje
		socket.on("credInvalid",function(mensaje){
			$scope.showCredInvalid = true;
			$scope.razonInvalid = mensaje;			
			$scope.usuario = undefined;	

			//animacion de error	
			$("#form-login").addClass("animated shake");			
			$("#form-login").one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){
				$("#form-login").removeClass("animated shake");
			});
			$scope.$apply();
		});


	}).//Tarjeta que muestra datos de registro
	controller("tarjeta",function($scope,$http,myShareService){

		//Si cambia cualquier cosa del form, lo mandamos a la fabrica
		$scope.$on('cambioForm', function() {
	        $scope.u = myShareService.sharedService;
	    });

		//Todo se hizo correctamente
	    $scope.$on('ready', function() {	        
	    	$scope.u = myShareService.sharedService
	        $scope.ready = true;
	        $scope.$apply();
	    });	  	     
	}).
	controller("registro",function($scope,myShareService){
		var socket = io();				
		
		$scope.roles = [];		

		socket.emit("getRoles");
		socket.on("getRoles",function(roles){
			$scope.roles = roles;
			$scope.$apply();
		});


	    socket.on("nuevoUsuario",function(){
	    	myShareService.broadcastReady();
		});

		$scope.someChange = function(usuario){
			myShareService.prepForBroadcast(usuario);			
		}

		$scope.submit = function(usuario){
			$scope.submited = true;
			socket.emit("nuevoUsuario",usuario);			
		}

		$scope.userExist = function(nickname){
			if(typeof nickname != "undefined")			
				if(nickname.length > 3)
					socket.emit("userExist",nickname);			
		}

		$scope.isPasswordOk = function(contra1,contra2) {			
			return !angular.equals(contra1, contra2);
		};

		socket.on("userExist",function(existe){
      console.log("El usuario existe? "+existe);
			if(existe == true){
				$scope.usuarioExiste = "Este usuario ya existe, porfavor elije otro";
			}else{
				$scope.usuarioExiste = "";
			}
			$scope.$apply();
		});

	}).
	factory("myShareService",function($rootScope){
		var sharedService 		= {};		

		sharedService.prepForBroadcast = function(usuario) {
	        this.sharedService = usuario;
	        this.broadcastItem();
	    };


	    sharedService.broadcastItem = function() {
	        $rootScope.$broadcast('cambioForm');
	    };

	    sharedService.broadcastReady = function(){
	    	$rootScope.$broadcast('ready');
	    };

	    return sharedService;

	}).
	directive('miAvizo',function(){
		return{
			restrict: 'E',
			template:'<div data-alert class="alert-box {{avizo.tipo}}">{{avizo.texto}}<a href="#" class="close">&times;</a></div>'
		}
	}).directive('prError',function(){
		return{
			restrict: 'E',
			template: '<small class="error" ng-show="error">Error en el proceso</small>'
		}
	}).directive('prExito',function(){
		return{
			restrict: 'E',
			template: '<label class="alert-box success" ng-show="exito">Proceso exioso!</small>'
		}
	});;

