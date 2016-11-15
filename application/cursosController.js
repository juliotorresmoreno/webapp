/* global application, routers, servidor, $scopes */

"use strict";

(function () {
    function cargar_curso(id) {
        var $scope = $scopes.get('applicationController');
        if ($scope.curso && $scope.curso._id === id) {
            $scope.preload = false;
        } else {
            var url = servidor + '/api/v1/cursos/' + id;
            $.get(url).success(function (respuesta) {
                $scope.preload = false;
                if (respuesta.success) {
                    var html = '<iframe width="560" \
                                        height="315" \
                                        src="https://www.youtube.com/embed/' + respuesta.data.video_introduccion + '" \
                                        frameborder="0" \
                                        style="margin-left: 50%; transform: translateX(-50%);" \
                                        allowfullscreen></iframe>';
                    $scope.curso = respuesta.data;
                    $scope.curso.video_introduccion_html = html;
                } else {
                    $scope.applicationController.mostrarErrores(respuesta);
                }
                $scope.safeApply();
            });
        }
    }

    function cargar_contenido(id, callback) {
        var $scope = $scopes.get('applicationController');
        $.get(servidor + '/api/v1/cursos/' + id + '/contenidos').success(function (respuesta) {
            $scope.contenidos = respuesta.data;
            if(respuesta.data.length === 0) {
                $scope.contenido = {};
                $scope.route.location = 'agregar_contenido_curso';
            }
            if(typeof callback === 'function') {
                callback($scope, respuesta);
            }
            $scope.safeApply();
        });
    }

    function cargar_actividades(contenido, callback, agregar) {
        var $scope = $scopes.get('applicationController');
        $.get(servidor + '/api/v1/cursos/contenido/' + contenido + '/actividades').success(function (respuesta) {
            if(respuesta.success) {
                $scope.actividades = respuesta.data;
                if(respuesta.data.length === 0 && agregar !== false) {
                    $scope.actividad = {};
                    $scope.route.location = 'agregar_actividad_curso';
                }
                if(typeof callback === 'function') {
                    callback($scope, respuesta);
                }
                $scope.safeApply();
            } else {
                $scope.applicationController.mostrarErrores(respuesta);
            }
        });
    }

    function cargar_preguntas(actividad, callback) {
        var $scope = $scopes.get('applicationController');
        var url = servidor + '/api/v1/cursos/actividad/' + actividad + '/preguntas';
        $.get(url).success(function (respuesta) {
            if(respuesta.success) {
                $scope.preguntas = respuesta.data;
                if(respuesta.data.length === 0) {
                    $scope.pregunta = {};
                    $scope.respuestas = [];
                    $scope.route.location = 'agregar_pregunta_actividad_curso';
                }
                if(typeof callback === 'function') {
                    callback($scope, respuesta);
                }
                $scope.safeApply();
            } else {
                $scope.applicationController.mostrarErrores(respuesta);
            }
        });
    }

    routers.add({
        vista: 'crear_curso',
        routers: [
            {
                route: '/cursos/crear',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'crear_curso',
                logged: true,
                before: function () {
                    var $scope = $scopes.get('applicationController');
                    $scope.preload = false;
                    $scope.curso = {};
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'editar_curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'contenido_curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    cargar_contenido(params.route.parametros.id);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido/:contenido',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'editar_contenido_curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    cargar_contenido(params.route.parametros.id, function ($scope, respuesta) {
                        if(respuesta.success) {
                            if(respuesta.data.length === 0) {
                                $scope.contenido = {};
                                return;
                            }
                            for(var i = 0; i < respuesta.data.length; i++) {
                                if(respuesta.data[i]._id == params.route.parametros.contenido) {
                                    $scope.contenido = respuesta.data[i];
                                    break;
                                }
                            }
                        }
                    });
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido/:contenido/actividades',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'actividades_curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    cargar_contenido(params.route.parametros.id);
                    cargar_actividades(params.route.parametros.contenido);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido/:contenido/actividad/:actividad',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'editar_actividad_curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    cargar_actividades(params.route.parametros.contenido, function ($scope, respuesta) {
                        if(respuesta.success) {
                            if(respuesta.data.length === 0) {
                                $scope.actividad = {};
                                return;
                            }
                            for(var i = 0; i < respuesta.data.length; i++) {
                                if(respuesta.data[i]._id == params.route.parametros.actividad) {
                                    $scope.actividad = respuesta.data[i];
                                    break;
                                }
                            }
                        }
                    });
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido/:contenido/actividad/:actividad/preguntas',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'preguntas_actividad_curso',
                logged: true,
                before: function (params) {
                    var cursoid = params.route.parametros.id;
                    var contenido = params.route.parametros.contenido;
                    var actividad = params.route.parametros.actividad;
                    cargar_curso(cursoid);
                    cargar_actividades(contenido, function ($scope, respuesta) {
                        if(respuesta.success) {
                            if(respuesta.data.length === 0) {
                                $scope.actividad = {};
                                return;
                            }
                            for(var i = 0; i < respuesta.data.length; i++) {
                                if(respuesta.data[i]._id == params.route.parametros.actividad) {
                                    $scope.actividad = respuesta.data[i];
                                    break;
                                }
                            }
                        }
                    });
                    cargar_preguntas(actividad);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido/:contenido/actividad/:actividad/pregunta/:pregunta',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'editar_pregunta_actividad_curso',
                logged: true,
                before: function (params) {
                    var cursoid = params.route.parametros.id;
                    var contenido = params.route.parametros.contenido;
                    var actividad = params.route.parametros.actividad;
                    cargar_curso(cursoid);
                    cargar_actividades(contenido, function ($scope, respuesta) {
                        if(respuesta.success) {
                            if(respuesta.data.length === 0) {
                                $scope.actividad = {};
                                return;
                            }
                            for(var i = 0; i < respuesta.data.length; i++) {
                                if(respuesta.data[i]._id == params.route.parametros.actividad) {
                                    $scope.actividad = respuesta.data[i];
                                    break;
                                }
                            }
                        }
                    });
                    cargar_preguntas(actividad, function ($scope, respuesta) {
                        if(respuesta.success) {
                            if(respuesta.data.length === 0) {
                                $scope.pregunta = {};
                                return;
                            }
                            for(var i = 0; i < respuesta.data.length; i++) {
                                if(respuesta.data[i]._id == params.route.parametros.pregunta) {
                                    $scope.pregunta = respuesta.data[i];
                                    $scope.respuestas = respuesta.data[i].respuestas;
                                    break;
                                }
                            }
                        }
                    });
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });

    routers.add({
        vista: 'cursos',
        routers: [
            {
                route: '/cursos',
                api: servidor + '/plantillasHTML/cursos.html',
                location: 'cursos',
                logged: true,
                before: function () {
                    $.get(servidor + '/api/v1/cursos').success(function (respuesta) {
                        var $scope = $scopes.get('applicationController');
                        if (respuesta.success) {
                            $scope.cursos = respuesta.data;
                        } else {
                            $scope.applicationController.mostrarErrores(respuesta);
                        }
                        $scope.preload = false;
                        $scope.safeApply();
                    });
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'curso',
        routers: [
            {
                route: '/curso/:id',
                api: servidor + '/plantillasHTML/curso.html',
                location: 'curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/contenido',
                api: servidor + '/plantillasHTML/curso.html',
                location: 'contenidos',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    cargar_contenido(params.route.parametros.id);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/contenido/:contenido',
                api: servidor + '/plantillasHTML/curso.html',
                location: 'contenido',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    cargar_contenido(params.route.parametros.id, function ($scope, respuesta) {
                        if(respuesta.success) {
                            if(respuesta.data.length === 0) {
                                $scope.contenido = {};
                                return;
                            }
                            for(var i = 0; i < respuesta.data.length; i++) {
                                if(respuesta.data[i]._id == params.route.parametros.contenido) {
                                    var html = '<iframe width="560" \
                                                        height="315" \
                                                        src="https://www.youtube.com/embed/' + respuesta.data[i].video + '" \
                                                        frameborder="0" \
                                                        style="margin-left: 50%; transform: translateX(-50%);" \
                                                        allowfullscreen></iframe>';
                                    $scope.contenido = respuesta.data[i];
                                    $scope.contenido.video_html = html;
                                    break;
                                }
                            }
                        }
                    });
                    cargar_actividades(params.route.parametros.contenido, undefined, false);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/contenido/:contenido/actividad/:actividad',
                api: servidor + '/plantillasHTML/curso.html',
                location: 'actividad',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    cargar_actividades(params.route.parametros.contenido, undefined, false);
                    cargar_preguntas(params.route.parametros.actividad, function ($scope, respuesta) {
                        if(respuesta.success) {
                            if(respuesta.data.length === 0) {
                                $scope.pregunta = {};
                                return;
                            }
                            for(var i = 0; i < respuesta.data.length; i++) {
                                if(respuesta.data[i]._id == params.route.parametros.pregunta) {
                                    $scope.pregunta = respuesta.data[i];
                                    $scope.respuestas = respuesta.data[i].respuestas;
                                    break;
                                }
                            }
                        }
                    });
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'transmitir_curso',
        routers: [
            {
                route: '/curso/:id/transmitir',
                api: servidor + '/plantillasHTML/transmitir_curso.html',
                location: 'transmitir_curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'transmicion_curso',
        routers: [
            {
                route: '/curso/:id/live',
                api: servidor + '/plantillasHTML/transmicion_curso.html',
                location: 'transmicion_curso',
                logged: true,
                before: function (params) {
                    cargar_curso(params.route.parametros.id);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    var transmitir = function() {
        var $scope = $scopes.get('applicationController');
        $scope.webrtc = new SimpleWebRTC({
            localVideoEl: 'localVideo',
            remoteVideosEl: 'remotesVideos',
            autoRequestMedia: true,
            media: { audio: true, video: true },
            url: 'https://' + location.hostname + ':8088'
        });
        $scope.mostrarChat = false;
        $scope.webrtc.on('readyToCall', function() {
            $scope.webrtc.joinRoom($scope.route.parametros.id);
        });
    };
    var transmicion = function() {
        var $scope = $scopes.get('applicationController');
        $scope.webrtc = new SimpleWebRTC({
            remoteVideosEl: 'remotesVideos',
            autoRequestMedia: true,
            media: { audio: false, video: false },
            url: 'https://' + location.hostname + ':8088'
        });
        $scope.mostrarChat = false;
        $scope.safeApply();
        $scope.webrtc.joinRoom($scope.route.parametros.id);
    };

    application.controller('cursosController', ['$scope',
        function ($scope) {
            var usuario = $scope.applicationController.session.usuario;
            if ($scope.curso === undefined) {
                $scope.curso = {};
            }
            if ($scope.cursos === undefined) {
                $scope.cursos = {chats: {}};
            }
            if($scope.route.location === 'transmitir_curso') {
                transmitir();
            } else if($scope.route.location === 'transmicion_curso') {
                transmicion();
            }
            var $locations_curso = [
                'editar_curso', 
                'curso', 'contenido', 'contenidos', 'actividad',
                'contenido_curso',
                'contenidos_curso',
                'transmitir_curso',
                'transmicion_curso'
            ];
            if($scope.route && $scope.route.parametros && $scope.route.parametros.id)
                $scope.application.items.curso = {
                    titulo: 'Curso',
                    items: [
                        {
                            titulo: 'Editar',
                            url: '/curso/' + $scope.route.parametros.id + '/editar',
                            mostrar: function () {
                                return $scope.curso.creador === usuario &&
                                        ['curso','transmitir_curso','transmicion_curso'].indexOf($scope.route.location)+1;
                            }
                        },
                        {
                            titulo: 'Transmitir',
                            url: '/curso/' + $scope.route.parametros.id + '/transmitir',
                            mostrar: function () {
                                return $scope.curso.creador === usuario;
                            }
                        },
                        {
                            titulo: 'Ver en vivo',
                            url: '/curso/' + $scope.route.parametros.id + '/live',
                            mostrar: function () {
                                return $scope.curso.registrado || $scope.curso.creador === usuario;
                            }
                        },
                        {
                            titulo: 'Retirar',
                            url: '', // '/curso/' + $scope.route.parametros.id + '/retirar',
                            onclick: function () {
                                $scope.cursosController.retirar();
                            },
                            mostrar: function () {
                                return $scope.curso.registrado &&
                                        $scope.curso.creador !== $scope.applicationController.session.usuario;
                                ;
                            }
                        },
                        {
                            titulo: 'Suscribir',
                            url: '',
                            onclick: function () {
                                $scope.cursosController.suscribir();
                            },
                            mostrar: function () {
                                return !$scope.curso.registrado &&
                                        $scope.curso.creador !== $scope.applicationController.session.usuario;
                                ;
                            }
                        }
                    ],
                    mostrar: function () {
                        return $locations_curso.indexOf($scope.route.location) >= 0;
                    }
                };
            $scope.application.items.cursos = {
                titulo: 'Cursos',
                items: [
                    {
                        titulo: 'Crear',
                        url: '/cursos/crear'
                    }
                ],
                mostrar: function () {
                    return $scope.route.location === 'cursos';
                }
            };
            $scope.cursosController = {
                save: function (permiso) {
                    var data = {
                        nombre: $scope.curso.nombre,
                        descripcion: $scope.curso.descripcion,
                        prerequisitos: $scope.curso.prerequisitos,
                        video_introduccion: $scope.curso.video_introduccion,
                        permiso: permiso
                    }, url;
                    if ($scope.route.location === 'crear_curso') {
                        url = servidor + '/api/v1/cursos/crear';
                    }
                    if ($scope.route.location === 'editar_curso') {
                        url = servidor + '/api/v1/cursos/editar';
                        data.id = $scope.curso._id;
                    }
                    $.post(url, data).success(function (result) {
                        if (result.success) {
                            if ($scope.route.location === 'crear_curso') {
                                $scope.curso = {};
                                $scope.safeApply();
                            }
                            $scope.applicationController.mostrarInfo(result.mensaje);
                        } else {
                            $scope.applicationController.mostrarErrores(result);
                        }
                    });
                },
                suscribir: function () {
                    var url = servidor + '/api/v1/cursos/suscribir';
                    var params = {id: $scope.curso._id};
                    $.post(url, params).success(function (respuesta) {
                        if (respuesta.success) {
                            $scope.applicationController.mostrarInfo(respuesta.mensaje);
                            $scope.curso.registrado = true;
                            $scope.safeApply();
                        } else {
                            $scope.applicationController.mostrarErrores(respuesta);
                        }
                    });
                },
                retirar: function () {
                    var url = servidor + '/api/v1/cursos/retirar';
                    var params = {id: $scope.curso._id};
                    $.post(url, params).success(function (respuesta) {
                        if (respuesta.success) {
                            $scope.applicationController.mostrarInfo(respuesta.mensaje);
                            $scope.curso.registrado = false;
                            $scope.safeApply();
                        } else {
                            $scope.applicationController.mostrarErrores(respuesta);
                        }
                    });
                },
                guardar_contenido: function(accion) {
                    var scope = $scopes.get('applicationController');
                    var url = servidor + '/api/v1/cursos/' + 
                              scope.route.parametros.id + '/contenidos/' + 
                              (scope.contenido._id ? 'editar': 'crear');
                    var data = scope.contenido;
                    $.post(url, data).success(function (result) {
                        if(result.success) {
                            $scope.applicationController.mostrarInfo(result.mensaje);
                            $scopes.get('applicationController').contenido = {};
                            $scope.safeApply();
                            if(accion == 'continuar') {
                                $scope.cursosController.continuar_contenido();
                            } else {
                                $scope.cursosController.cancelar_contenido();
                            }
                        } else {
                            $scope.applicationController.mostrarErrores(result);
                        }
                    });
                },
                continuar_actividad: () => {
                    var cursoid = $scope.route.parametros.id;
                    var contenido = $scope.route.parametros.contenido; 
                    var actividad = $scope.route.parametros.actividad;
                    redirigir('/curso/' + cursoid + 
                              '/editar/contenido/' + contenido + 
                              '/actividad/' + actividad + '/preguntas');
                },
                agregarContenido: () => {
                    $scope.route.location = 'agregar_contenido_curso';
                    $scopes.get('applicationController').contenido = {};
                },
                cancelar_contenido: () => {
                    redirigir('/curso/'+$scope.curso._id+'/editar/contenido');
                    $scope.route.location = 'contenido_curso';
                },
                eliminar_contenido: () => {
                    var url = servidor + '/api/v1/cursos/' + 
                              $scope.route.parametros.id + 
                              '/contenidos/eliminar';
                    var msg = 'Realmente desea eliminar el contenido';
                    $scope.preguntar(msg, function (result) { 
                        if(result) {
                            $.post(url, {_id:$scope.contenido._id}).success(function (result) {
                                if(result.success) {
                                    $scope.applicationController.mostrarInfo(result.mensaje);
                                    $scope.cursosController.cancelar_contenido();
                                } else {
                                    $scope.applicationController.mostrarErrores(result);
                                }
                            });
                        }
                    });
                },
                continuar_contenido: () => {
                    var cursoid = $scope.route.parametros.id;
                    var contenido = $scope.route.parametros.contenido; 
                    redirigir('/curso/' + cursoid + '/editar/contenido/' + contenido + '/actividades');
                },
                verCurso: (cursoid) => {
                    redirigir('/curso/' + cursoid);
                },
                agregarActividad: () => {
                    $scopes.get('applicationController').actividad = {};
                    $scope.route.location = 'agregar_actividad_curso';
                },
                guardar_actividad: () => {
                    var scope = $scopes.get('applicationController');
                    var url = servidor + '/api/v1/cursos/' + 
                              scope.route.parametros.id + 
                              '/actividades/' + 
                              $scope.route.parametros.contenido + '/' +
                              (scope.actividad._id ? 'editar': 'crear');
                    var data = scope.actividad;
                    $.post(url, data).success(function (result) {
                        if(result.success) {
                            $scope.applicationController.mostrarInfo(result.mensaje);
                            $scope.cursosController.cancelar_actividad();
                            $scopes.get('applicationController').actividad = {};
                            $scope.safeApply();
                        } else {
                            $scope.applicationController.mostrarErrores(result);
                        }
                    });
                },
                eliminar_actividad: () => {
                    var url = servidor + '/api/v1/cursos/' + 
                              $scope.route.parametros.id + 
                              '/actividades/' + 
                              $scope.route.parametros.contenido + '/eliminar';
                    var msg = 'Realmente desea eliminar la actividad';
                    $scope.preguntar(msg, function (result) { 
                        if(result) {
                            $.post(url, {_id:$scope.actividad._id}).success(function (result) {
                                if(result.success) {
                                    $scope.applicationController.mostrarInfo(result.mensaje);
                                    $scope.cursosController.cancelar_actividad();
                                } else {
                                    $scope.applicationController.mostrarErrores(result);
                                }
                            });
                        }
                    });
                },
                cancelar_actividad: () => {
                    redirigir('/curso/' + $scope.curso._id + '/editar/contenido/' + $scope.route.parametros.contenido + '/actividades');
                    $scope.route.location = 'actividades_curso';
                },
                agregarPregunta: () => {
                    $scope.route.location = 'agregar_pregunta_actividad_curso';
                    $scopes.get('applicationController').pregunta = {};
                    $scopes.get('applicationController').respuestas = [
                        {enunciado:'',valor:'0'},
                        {enunciado:'',valor:'0'}
                    ];
                },
                guardar_pregunta: () => {
                    var scope = $scopes.get('applicationController');
                    var url = servidor + '/api/v1/cursos/' + 
                              scope.route.parametros.id + '/actividades/' + 
                              scope.route.parametros.contenido + '/actividad/' +
                              scope.route.parametros.actividad + 
                              (scope.pregunta._id ? '/editar': '/crear');
                    var pregunta = $scope.pregunta;
                    var respuestas = [];
                    for(var i = 0; i < scope.respuestas.length; i++) {
                        respuestas.push({
                            enunciado: scope.respuestas[i].enunciado,
                            valor: scope.respuestas[i].valor
                        });
                    }
                    pregunta.respuestas = JSON.stringify(respuestas);
                    $.post(url, pregunta).success(function (respuesta) {
                        if(respuesta.success) {
                            $scope.applicationController.mostrarInfo(respuesta.mensaje);
                            $scope.cursosController.cancelar_pregunta();
                        } else {
                            $scope.applicationController.mostrarErrores(respuesta);
                        }
                    });
                },
                cancelar_pregunta: () => {
                    redirigir('/curso/' + $scope.curso._id + '/editar/contenido/' + $scope.route.parametros.contenido + '/actividad/' + $scope.route.parametros.actividad + '/preguntas');
                    $scope.route.location = 'preguntas_actividad_curso';
                },
                agregarRespuesta: () => {
                    $scopes.get('applicationController').respuestas.push({enunciado:'',valor:'0'});
                },
                eliminarRespuesta: (respuesta) => {
                    for(var i = 0; i < $scopes.get('applicationController').respuestas.length; i++) {
                        var item = $scopes.get('applicationController').respuestas[i];
                        if(item.$$hashKey == respuesta.$$hashKey) {
                            $scopes.get('applicationController').respuestas.splice(i, 1);
                            break;
                        }
                    }
                }
            };
            $scopes.add('cursosController', $scope);
        }
    ]);

    application.controller('chatCursosController', ['$scope',
        function ($scope) {
            $scope.chatCursosController = {
                enviar() {
                    var url = servidor + '/api/v1/cursos/' + $scope.route.parametros.id + '/comentarStreaming';
                    var params = {
                        curso: $scope.route.parametros.id,
                        mensaje: $scope.cursos.chats[$scope.route.parametros.id].mensaje,
                        nombres: $scope.applicationController.session.nombres,
                        apellidos: $scope.applicationController.session.apellidos,
                        usuario: $scope.applicationController.session.usuario,
                        fechaHora: new Date().getTime()
                    };
                    if($scope.cursos.chats[$scope.route.parametros.id].mensaje) {
                        $scope.cursos.chats[$scope.route.parametros.id].mensaje = '';
                        $.post(url, params);
                    }
                }
            };
            $scopes.add('chatCursosController', $scope);
        }
    ]);

    routerswss.add({
        peticion: 'mensajeCurso',
        success: function (data) {
            var $scope = $scopes.get('chatCursosController');
            var curso = $scope.route.parametros.id;
            if($scope.cursos === undefined) {
                $scope.cursos = {};
            }
            if($scope.cursos.chats === undefined) {
                $scope.cursos.chats = {};
            }
            if($scope.cursos.chats[curso] === undefined) {
                $scope.cursos.chats[$scope.route.parametros.id] = {};
            }
            if($scope.cursos.chats[curso].conversacion === undefined) {
                $scope.cursos.chats[curso].conversacion = [];
            }
            $scope.cursos.chats[curso].conversacion.push(data.data);
            $scope.safeApply();
            setTimeout(function () {
                var c = $('#mensajes');
                c.scrollTop(c.height() + 100);
            }, 500);
        }
    });
})();