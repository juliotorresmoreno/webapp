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

    function cargar_horario(cursoid, horarioid) {
        var $scope = $scopes.get('applicationController');
        var url = servidor + '/api/v1/cursos/' + cursoid + '/horarios';
        function bsq () {
            if($scope.horarios && $scope.horarios.length > 0) {
                for(var i = 0; i < $scope.horarios.length; i++) {
                    if($scope.horarios[i]._id == horarioid) {
                        var hora = $scope.horarios[i].hora.split(':');
                        $scope.horario = $scope.horarios[i];
                        $scope.horario.hora = hora[0];
                        $scope.horario.minutos = hora[1];
                        return true;
                    }
                }
            }
            return false;
        }
        if(horarioid === undefined || bsq() == false) {
            $.get(url).success(function (respuesta) {
                if(respuesta.data.length === 0) {
                    $scope.route.location = 'agregar_horario_curso';
                }
                if(respuesta.success) {
                    $scope.horarios = respuesta.data;
                    if(horarioid) {
                        bsq();
                    }
                } else {
                    $scope.horarios = [];
                    $scope.horario = {};
                }
                $scope.safeApply();
            });
        }
    }

    function cargar_contenido(cursoid, contenidoid) {
        var $scope = $scopes.get('applicationController');
        function bsq () { 
            if($scope.contenidos && $scope.contenidos.length > 0) {
                for(var i = 0; i < $scope.contenidos.length; i++) {
                    if($scope.contenidos[i]._id == contenidoid) {
                        var html = '<iframe width="560" \
                                            height="315" \
                                            src="https://www.youtube.com/embed/' + $scope.contenidos[i].video + '" \
                                            frameborder="0" \
                                            style="margin-left: 50%; transform: translateX(-50%);" \
                                            allowfullscreen></iframe>';
                        $scope.contenido = $scope.contenidos[i];
                        $scope.contenido.video_html = html;
                        return true;
                    }
                }
            }
            $scope.contenido = {};
            return false;
        }
        if(contenidoid == undefined || bsq() == false) {
            $.get(servidor + '/api/v1/cursos/' + cursoid + '/contenidos').success(function (respuesta) {
                $scope.contenidos = respuesta.data;
                if($scope.contenidos.length === 0) {
                    $scope.contenido = {};
                    if($scope.route.location === 'contenido_curso') {
                        $scope.route.location = 'agregar_contenido_curso';
                    }
                }
                if(respuesta.success && contenidoid) {
                    bsq();
                }
                $scope.safeApply();
            });
        }
    }

    function cargar_actividades(contenido, actividad, agregar) {
        var $scope = $scopes.get('applicationController');
        var url = servidor + '/api/v1/cursos/contenido/' + contenido + '/actividades';
        function bsq() {
            if($scope.actividades && $scope.actividades.length > 0) {
                for(var i = 0; i < $scope.actividades.length; i++) {
                    if($scope.actividades[i]._id == actividad) {
                        $scope.actividad = $scope.actividades[i];
                        return true;
                    }
                }
            }
            $scope.actividad = {};
            return false;
        }
        if(actividad == undefined || bsq() === false) {
            $.get(url).success(function (respuesta) {
                if(respuesta.success) {
                    $scope.actividades = respuesta.data;
                    if(respuesta.data.length === 0 && agregar !== false) {
                        $scope.actividad = {};
                        $scope.route.location = 'agregar_actividad_curso';
                    }
                    if(respuesta.success && actividad) {
                        bsq();
                    }
                    $scope.safeApply();
                } else {
                    $scope.applicationController.mostrarErrores(respuesta);
                }
            });
        }
    }

    function cargar_preguntas(actividad, pregunta) {
        var $scope = $scopes.get('applicationController');
        var url = servidor + '/api/v1/cursos/actividad/' + actividad + '/preguntas';
        function bsq() {
            if($scope.preguntas && $scope.preguntas.length > 0) {
                for(var i = 0; i < $scope.preguntas.length; i++) {
                    if($scope.preguntas[i]._id == pregunta) {
                        $scope.pregunta = $scope.preguntas[i];
                        $scope.respuestas = $scope.preguntas[i].respuestas;
                        return true;
                    }
                }
            }
            $scope.pregunta = {};
            return false;
        }
        if(pregunta == undefined || bsq() === false) {
            $.get(url).success(function (respuesta) {
                if(respuesta.success) {
                    $scope.preguntas = respuesta.data;
                    if(respuesta.data.length === 0) {
                        $scope.pregunta = {tipo:'opcion'};
                        $scope.respuestas = [];
                        $scope.route.location = 'agregar_pregunta_actividad_curso';
                    }
                    if(respuesta.success && pregunta) {
                        bsq();
                    }
                    $scope.safeApply();
                } else {
                    $scope.applicationController.mostrarErrores(respuesta);
                }
            });
        }
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
                    var cursoid = params.route.parametros.id;
                    var contenido = params.route.parametros.contenido;
                    cargar_curso(cursoid);
                    cargar_contenido(cursoid, contenido);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido/:contenido/actividades',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'actividades_curso',
                logged: true,
                before: function (params) {
                    var cursoid = params.route.parametros.id;
                    var contenido = params.route.parametros.contenido;
                    var actividad = params.route.parametros.actividad;
                    cargar_curso(cursoid);
                    cargar_contenido(cursoid, contenido);
                    cargar_actividades(contenido, actividad);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/contenido/:contenido/actividad/:actividad',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'editar_actividad_curso',
                logged: true,
                before: function (params) {
                    var cursoid = params.route.parametros.id;
                    var contenido = params.route.parametros.contenido;
                    var actividad = params.route.parametros.actividad;
                    cargar_curso(cursoid);
                    cargar_contenido(cursoid, contenido);
                    cargar_actividades(contenido, actividad);
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
                    cargar_contenido(cursoid, contenido);
                    cargar_actividades(contenido, actividad);
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
                    var pregunta = params.route.parametros.pregunta;
                    cargar_curso(cursoid);
                    cargar_contenido(cursoid, contenido);
                    cargar_actividades(contenido, actividad);
                    cargar_preguntas(actividad, pregunta);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/horario',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'horario_curso',
                logged: true,
                before: function (params) {
                    var cursoid = params.route.parametros.id;
                    cargar_curso(cursoid);
                    cargar_horario(cursoid);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            },
            {
                route: '/curso/:id/editar/horario/:horario',
                api: servidor + '/plantillasHTML/editar_curso.html',
                location: 'editar_horario_curso',
                logged: true,
                before: function (params) {
                    var cursoid = params.route.parametros.id;
                    var horario = params.route.parametros.horario;
                    cargar_curso(cursoid);
                    cargar_horario(cursoid, horario);
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
            },
            {
                route: '/mis-cursos',
                api: servidor + '/plantillasHTML/cursos.html',
                location: 'mis-cursos',
                logged: true,
                before: function () {
                    $.get(servidor + '/api/v1/cursos?user=me').success(function (respuesta) {
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
            },
            {
                route: '/curso/:id/horario',
                api: servidor + '/plantillasHTML/curso.html',
                location: 'horario',
                logged: true,
                before: function (params) {
                    var cursoid = params.route.parametros.id;
                    cargar_curso(cursoid);
                    cargar_horario(cursoid);
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
            $scope.transmicionOnlive = true;
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
        $scope.webrtc.on('videoAdded', function() {
            $scope.transmicionOnlive = true;
            $scope.safeApply();
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
                'horario_curso', 'horario',
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
                            titulo: 'Ver curso',
                            url: '/curso/' + $scope.route.parametros.id,
                            mostrar: function () {
                                return $scope.curso.registrado || $scope.curso.creador === usuario;
                            }
                        },
                        {
                            titulo: 'Retirar',
                            url: '',
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
                busqueda: '',
                save(permiso) {
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
                            if(typeof result.cursoid !== 'undefined') {
                                redirigir('/curso/' + result.cursoid + '/editar');
                            }
                            $scope.applicationController.mostrarInfo(result.mensaje);
                        } else {
                            $scope.applicationController.mostrarErrores(result);
                        }
                    });
                },
                busqueda_change() {
                    var url = servidor + '/api/v1/cursos?buscar=' + $scope.cursosController.busqueda;
                    $scope.preload = true; 
                    $.get(url).success(function (respuesta) {
                        var $scope = $scopes.get('applicationController');
                        if (respuesta.success) {
                            $scope.cursos = respuesta.data;
                        } else {
                            $scope.applicationController.mostrarErrores(respuesta);
                        }
                        $scope.preload = false;
                        $scope.safeApply();
                    });
                },
                suscribir() {
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
                retirar() {
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
                guardar_contenido(accion) {
                    var scope = $scopes.get('applicationController');
                    var url = servidor + '/api/v1/cursos/' + 
                              scope.route.parametros.id + '/contenidos/' + 
                              (scope.contenido._id ? 'editar': 'crear');
                    var data = scope.contenido;
                    $.post(url, data).success(function (result) {
                        if(result.success) {
                            $scope.applicationController.mostrarInfo(result.mensaje);
                            $scopes.get('applicationController').contenido = {};
                            if(result.id) {
                                $scope.route.parametros.contenido = result.id;
                            }
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
                continuar_actividad() {
                    var cursoid = $scope.route.parametros.id;
                    var contenido = $scope.route.parametros.contenido; 
                    var actividad = $scope.route.parametros.actividad;
                    redirigir('/curso/' + cursoid + 
                              '/editar/contenido/' + contenido + 
                              '/actividad/' + actividad + '/preguntas');
                },
                agregarContenido() {
                    $scope.route.location = 'agregar_contenido_curso';
                    $scopes.get('applicationController').contenido = {};
                },
                cancelar_contenido() {
                    redirigir('/curso/'+$scope.curso._id+'/editar/contenido');
                    $scope.route.location = 'contenido_curso';
                },
                eliminar_contenido() {
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
                continuar_contenido() {
                    var cursoid = $scope.route.parametros.id;
                    var contenido = $scope.route.parametros.contenido; 
                    redirigir('/curso/' + cursoid + '/editar/contenido/' + contenido + '/actividades');
                },
                verCurso(cursoid) {
                    redirigir('/curso/' + cursoid);
                },
                agregarActividad() {
                    $scopes.get('applicationController').actividad = {};
                    $scope.route.location = 'agregar_actividad_curso';
                },
                guardar_actividad(accion) {
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
                            $scopes.get('applicationController').actividad = {};
                            $scope.safeApply();
                            if(accion == 'continuar') {
                                $scope.cursosController.continuar_actividad();
                            } else {
                                $scope.cursosController.cancelar_actividad();
                            }
                        } else {
                            $scope.applicationController.mostrarErrores(result);
                        }
                    });
                },
                eliminar_actividad() {
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
                cancelar_actividad() {
                    redirigir('/curso/' + $scope.curso._id + '/editar/contenido/' + $scope.route.parametros.contenido + '/actividades');
                    $scope.route.location = 'actividades_curso';
                },
                agregarPregunta() {
                    $scope.route.location = 'agregar_pregunta_actividad_curso';
                    $scopes.get('applicationController').pregunta = {};
                    $scopes.get('applicationController').respuestas = [
                        {enunciado:'',valor:'0'},
                        {enunciado:'',valor:'0'}
                    ];
                },
                guardar_pregunta() {
                    var scope = $scopes.get('applicationController');
                    var url = servidor + '/api/v1/cursos/' + 
                              scope.route.parametros.id + '/actividades/' + 
                              scope.route.parametros.contenido + '/actividad/' +
                              scope.route.parametros.actividad + '/preguntas' + 
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
                eliminar_pregunta() {
                    var scope = $scopes.get('applicationController');
                    var url = servidor + '/api/v1/cursos/' + 
                              scope.route.parametros.id + '/actividades/' + 
                              scope.route.parametros.contenido + '/actividad/' +
                              scope.route.parametros.actividad + '/preguntas/eliminar';
                    $.post(url, {pregunta: scope.route.parametros.pregunta}).success(function (respuesta) {
                        if(respuesta.success) {
                            $scope.applicationController.mostrarInfo(respuesta.mensaje);
                            $scope.cursosController.cancelar_pregunta();
                        } else {
                            $scope.applicationController.mostrarErrores(respuesta);
                        }
                    });
                },
                cancelar_pregunta() {
                    redirigir('/curso/' + $scope.curso._id + '/editar/contenido/' + $scope.route.parametros.contenido + '/actividad/' + $scope.route.parametros.actividad + '/preguntas');
                    $scope.route.location = 'preguntas_actividad_curso';
                },
                agregarRespuesta() {
                    $scopes.get('applicationController').respuestas.push({enunciado:'',valor:'0'});
                },
                eliminarRespuesta(respuesta) {
                    for(var i = 0; i < $scopes.get('applicationController').respuestas.length; i++) {
                        var item = $scopes.get('applicationController').respuestas[i];
                        if(item.$$hashKey == respuesta.$$hashKey) {
                            $scopes.get('applicationController').respuestas.splice(i, 1);
                            break;
                        }
                    }
                },
                agregar_horario() {
                    $scope.route.location = 'agregar_horario_curso';
                },
                cancelar_horario() {
                    $scope.route.location = 'horario_curso';
                    redirigir('/curso/'+$scope.route.parametros.id+'/editar/horario');
                },
                guardar_horario() {
                    var $scope = $scopes.get('applicationController');
                    var horario = {
                        _id: $scope.horario._id,
                        evento: $scope.horario.evento,
                        fecha: $scope.horario.fecha,
                        hora: $scope.horario.hora + ':' + $scope.horario.minutos
                    };
                    var url = servidor + '/api/v1/cursos/' + $scope.route.parametros.id + '/horario' +
                                         ($scope.horario._id ? '/editar': '/crear'); 
                    $.post(url, horario).success(function(result) {
                        if(result.success) {
                            $scope.applicationController.mostrarInfo(result.mensaje);
                            $scope.cursosController.cancelar_horario();
                        } else {
                            $scope.applicationController.mostrarErrores(result);
                        }
                    });
                },
                responder_actividad() {
                    var scope = $scopes.get('applicationController');
                    var respuestas = {};
                    for(var i = 0; i < $scope.preguntas.length; i++) {
                        let pregunta = $scope.preguntas[i];
                        switch(pregunta.tipo) {
                            case "opcion":
                                respuestas[pregunta._id] = pregunta.respuesta
                            break;
                            case "multiple":
                                respuestas[pregunta._id] = [];
                                for(var j = 0; j < pregunta.respuestas.length; j++) {
                                    let respuesta = pregunta.respuestas[j];
                                    if(respuesta.check) {
                                        respuestas[pregunta._id].push(respuesta.id);
                                    }
                                }
                            break;
                        }
                    }
                    var url = servidor + '/api/v1/cursos/' + 
                              scope.route.parametros.id + '/actividades/' + 
                              scope.route.parametros.contenido + '/actividad/' +
                              scope.route.parametros.actividad + '/preguntas/responder';
                    $.post(url, {data:JSON.stringify(respuestas)}).success(function (result) {
                        console.log(result);
                    });
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