/* global servidor, $scopes, routers, application, pushState */

'use strict';
(function () {
    var ultimo = '?';
    var iniciarPagina = function () {
        var $scope = $scopes.get('applicationController');
        $scope.mensajes.pagina = $scope.applicationController.iniciarPagina();
    };
    var obtener_mensaje = function () {
        var $scope = $scopes.get('applicationController');
        var url = servidor + '/api/v1/mensajes/mensaje/' + $scope.route.parametros.mensaje;
        
        $.get(url).done(function (resultado) {
            $scope.mensajes.destinatarios = [];
            if (resultado.success && resultado.data.length > 0) {
                $scope.mensajes.mensaje = resultado.data[0];
                $scope.mensajes.asunto = resultado.data[0].asunto;
                $scope.mensajes.contenido = resultado.data[0].contenido;
                $scope.mensajes.remitente = resultado.data[0].remitente;
                for (var i = 0; i < resultado.data[0].destinatarios.length; i++)
                    $scope.mensajes.destinatarios.push(resultado.data[0].destinatarios[i].usuario);
            } else {
                $scope.mensajes.mensaje = {};
                $scope.mensajes.asunto = '';
                $scope.mensajes.contenido = '';
            }
            $scope.preload = false;
            $scope.safeApply();
            $("#select").select2();
        });
    };
    var obtenerBandeja = function (api) {
        var $scope = $scopes.get('applicationController');
        $.get(servidor + api, {pagina: $scope.mensajes.pagina}).done(function (resultado) {
            if (resultado.success) {
                var paginacion = $scope.applicationController.paginacion($scope.mensajes.pagina, resultado.limite, resultado.total);
                $scope.mensajes.paginaFinal = paginacion.paginaFinal;
                $scope.mensajes.paginaInicial = paginacion.paginaInicial;
                $scope.mensajes.paginas = paginacion.paginas;
                $scope.mensajes.mensajes = resultado.data;
                $scope.preload = false;
                $scope.safeApply();
            }
        });
    };
    var iniciarScope = function () {
        var $scope = $scopes.get('applicationController');
        if ($scope.mensajes === undefined) {
            $scope.mensajes = {};
            $scope.mensajes.remitente = {};
            $scope.mensajes.destinatarios = [];
            $scope.mensajes.asunto = '';
            $scope.mensajes.contenido = '';
            $scope.mensajes.amigos = [];
            $scope.mensajes.mensajes = [];
            $scope.mensajes.destinatariosP = [];
            $scope.mensajes.paginas = [];
        }
    };
    var disparar = function () {
        var $scope = $scopes.get('applicationController');
        if (ultimo === $scope.applicationController.location)
            return;
        ultimo = $scope.applicationController.location;
        iniciarScope();
        switch ($scope.applicationController.location) {
            case 'nuevo':
                $scope.mensajes.remitente = $scope.applicationController.session;
                $scope.preload = false;
                $scope.safeApply();
                if ($scope.route.parametros && $scope.route.parametros.usuario) {
                    $scope.mensajes.destinatarios = [$scope.route.parametros.usuario];
                    setTimeout(function () {
                        var c = $("#select");
                        c.select2();
                        c.hide();
                    }, 50);
                }
                break;
            case 'mensaje':
                if ($scope.applicationController.location === 'mensaje')
                    obtener_mensaje();
                break;
            case 'entrada':
                iniciarPagina();
                obtenerBandeja('/api/v1/mensajes');
                break;
            case 'salida':
                iniciarPagina();
                obtenerBandeja('/api/v1/mensajes/salida');
                break;
            case 'papelera':
                iniciarPagina();
                obtenerBandeja('/api/v1/mensajes/papelera');
                break;
        }
    };
    routers.add({
        vista: 'mensajes',
        before: function () {
            var $scope = $scopes.get('applicationController');
            ultimo = '?';
            $scope.mensajes = {
                remitente: {},
                destinatarios: [],
                asunto: '',
                contenido: '',
                amigos: [],
                mensajes: [],
                destinatariosP: [],
                paginas: []
            };
            disparar();
            return this.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
        },
        routers: [
            {
                route: '/mensajes',
                api: servidor + '/plantillasHTML/mensajes.html',
                location: 'entrada',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            },
            {
                route: '/mensajes/salida',
                api: servidor + '/plantillasHTML/mensajes.html',
                location: 'salida',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            },
            {
                route: '/mensajes/papelera',
                api: servidor + '/plantillasHTML/mensajes.html',
                location: 'papelera',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            }
        ]
    });
    routers.add({
        vista: 'mensaje',
        before: function () {
            disparar();
            return this.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
        },
        routers: [
            {
                route: '/mensajes/nuevo/:usuario',
                api: servidor + '/plantillasHTML/mensaje.html',
                location: 'nuevo',
                logged: true,
                before: function (params) {
                    return this.parent.before();
                }
            },
            {
                route: '/mensajes/nuevo',
                api: servidor + '/plantillasHTML/mensaje.html',
                location: 'nuevo',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            },
            {
                route: '/mensajes/mensaje/:mensaje',
                api: servidor + '/plantillasHTML/mensaje.html',
                location: 'mensaje',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            }
        ]
    });
    application.controller('mensajesController', ['$scope',
        function ($scope) {
            var nombreAmigo = function (amigo) {
                return amigo.nombres + ' ' + amigo.apellidos + ' <' + amigo.usuario + '@melleva.net>';
            };
            var nombresAmigos = function (amigos) {
                var respuesta = '';
                for (var i = 0; i < amigos.length; i++)
                    respuesta += nombreAmigo(amigos[i]) + '; ';
                return respuesta;
            };
            $scope.mensajesController = {
                errores: {success: true},
                responder: function () {
                    $scope.applicationController.location = "nuevo";
                    $scope.mensajes.contenido = '\n\n--------------------------------------------------' +
                            '\nDe: ' + nombreAmigo($scope.mensajes.remitente) +
                            '\nPara: ' + nombresAmigos($scope.mensajes.destinatarios) +
                            '\n\n' + $scope.mensajes.contenido;
                    $scope.mensajes.asunto = 'Re: ' + $scope.mensajes.asunto;
                    $scope.mensajes.remitente = $scope.applicationController.session;
                    $("#select").select2();
                },
                eliminar: function () {
                    $.post(servidor + '/api/v1/mensajes/eliminar', {
                        id: JSON.stringify([$scope.mensajes.mensaje._id]),
                        definitivo: $scope.mensajes.mensaje.estado === 'eliminado'
                    });
                    ultimo = 'entrada';
                    redirigir('/mensajes');
                },
                seleccionarTodos: function () {
                    for (var i = 0; i < $scope.mensajes.mensajes.length; i++)
                        $scope.mensajes.mensajes[i].check = $scope.mensajes.check;
                },
                eliminarSeleccionados: function () {
                    var IDs = [];
                    for (var i = 0; i < $scope.mensajes.mensajes.length; i++) {
                        if ($scope.mensajes.mensajes[i].check === true)
                            IDs.push($scope.mensajes.mensajes[i]._id);
                    }
                    if (IDs.length > 0) {
                        $.post(servidor + '/api/v1/mensajes/eliminar', {
                            id: JSON.stringify(IDs),
                            definitivo: $scope.applicationController.location === 'papelera'
                        }).done(function (resultado) {
                            if (resultado.success) {
                                ultimo = '@';
                                $scope.mensajes.check = false;
                                disparar();
                            }
                        });
                    }
                },
                descartar: function () {
                    ultimo = 'entrada';
                    redirigir('/mensajes');
                },
                ver: function (mensaje) {
                    redirigir('/mensajes/mensaje/' + mensaje._id);
                },
                nuevo: function () {
                    var url = '/mensajes/nuevo';
                    if (pushState) {
                        window.history.pushState(undefined, document.title, servidor + url);
                    } else {
                        document.location.href = servidor + '#' + url;
                    }
                },
                restaurarSeleccionados: function () {
                    var IDs = [];
                    for (var i = 0; i < $scope.mensajes.mensajes.length; i++) {
                        if ($scope.mensajes.mensajes[i].check === true)
                            IDs.push($scope.mensajes.mensajes[i]._id);
                    }
                    if (IDs.length > 0) {
                        $.post(servidor + '/api/v1/mensajes/restaurar', {id: JSON.stringify(IDs)}).done(function (resultado) {
                            if (resultado.success) {
                                ultimo = '@';
                                $scope.mensajes.check = false;
                                disparar();
                            }
                        });
                    }
                },
                enviar: function () {
                    if ($scope.mensajes.destinatarios.length === 0) {
                        $scope.applicationController.mostrarErrores({
                            success: false,
                            destinatarios: ['Debe especificar un destinatario.']
                        });
                        return;
                    }
                    var params = {
                        destinatarios: [],
                        asunto: $scope.mensajes.asunto,
                        contenido: $scope.mensajes.contenido
                    };
                    for (var i = 0; i < $scope.mensajes.destinatarios.length; i++) {
                        for (var j = 0; j < $scope.chats.length; j++) {
                            if ($scope.chats[j].usuario === $scope.mensajes.destinatarios[i]) {
                                params.destinatarios.push({
                                    nombres: $scope.chats[j].nombres,
                                    apellidos: $scope.chats[j].apellidos,
                                    usuario: $scope.chats[j].usuario
                                });
                                break;
                            }
                        }
                        if ($scope.applicationController.session.usuario === $scope.mensajes.destinatarios[i]) {
                            params.destinatarios.push({
                                nombres: $scope.applicationController.session.nombres,
                                apellidos: $scope.applicationController.session.apellidos,
                                usuario: $scope.applicationController.session.usuario
                            });
                        }
                    }
                    params.destinatarios = JSON.stringify(params.destinatarios);
                    $.post(servidor + '/api/v1/mensajes/enviar', params).done(function (resultado) {
                        if (resultado.success) {
                            var url = '/mensajes';
                            $scope.mensajes.asunto = '';
                            $scope.mensajes.contenido = '';
                            $scope.mensajes.destinatarios = [];
                            if (pushState) {
                                window.history.pushState(undefined, document.title, servidor + url);
                            } else {
                                document.location.href = servidor + '#' + url;
                            }
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                            $scope.safeApply();
                        }
                    });
                },
                establecerPagina: function (pagina) {
                    $scope.mensajes.pagina = pagina;
                    switch ($scope.applicationController.location) {
                        case 'entrada':
                            obtenerBandeja('/api/v1/mensajes');
                            break;
                        case 'salida':
                            obtenerBandeja('/api/v1/mensajes/salida');
                            break;
                        case 'papelera':
                            obtenerBandeja('/api/v1/mensajes/papelera');
                            break;
                    }
                }
            };
            iniciarScope();
            $scopes.add('mensajes', $scope);
        }
    ]);
})();