/* global servidor, $scopes, routers, routerswss, application */

'use strict';
(function () {
    var mostrarInfo = function (info) {
        var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
        $scope.applicationController.mostrarInfo(info);
    };
    var buscarChat = function (usuario) {
        var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
        for (var i = 0; i < $scope.chats.length; i++) {
            if ($scope.chats[i]._id === usuario) {
                return $scope.chats[i];
            }
        }
    };
    var establecerVideoLLamada = function (chatid, usuarioid) {
        var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
        for (var i = 0; i < $scope.chat.mensajes.length; i++) {
            if (['videollamada', 'llamada'].indexOf($scope.chat.mensajes[i].tipo === 'videollamada') >= 0) {
                $scope.chat.mensajes[i].estado = 'eliminado';
            }
        }
        window.open(location.href + '/external/VideoLLamada', "", "titlebar=no, fullscreen=yes");
    };
    var establecerLLamada = function (chatid, usuarioid) {
        var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
        for (var i = 0; i < $scope.chat.mensajes.length; i++) {
            if (['videollamada', 'llamada'].indexOf($scope.chat.mensajes[i].tipo === 'videollamada') >= 0) {
                $scope.chat.mensajes[i].estado = 'eliminado';
            }
        }
        window.open(location.href + '/external/LLamada', "", "titlebar=no, fullscreen=yes");
    };

    routerswss.add({
        peticion: 'amigoConectado',
        success: function (data) {
            var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
            if (data.success === true) {
                if ($scope.chats !== undefined) {
                    for (var i = 0; i < $scope.chats.length; i++) {
                        if ($scope.chats[i].usuario === data.usuario) {
                            $scope.chats[i].conectado = true;
                            $scope.safeApply();
                            break;
                        }
                    }
                }
            }
        }
    });
    routerswss.add({
        peticion: 'amigoDesconectado',
        success: function (data) {
            var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
            if (data.success === true) {
                if ($scope.chats !== undefined) {
                    for (var i = 0; i < $scope.chats.length; i++) {
                        if ($scope.chats[i].usuario === data.usuario) {
                            $scope.chats[i].conectado = false;
                            $scope.safeApply();
                            break;
                        }
                    }
                }
            }
        }
    });
    routerswss.add({
        peticion: 'mensajes',
        success: function (data) {
            var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
            if (typeof ($scope.chat) === 'string') {
                for (var i = 0; i < $scope.chats.length && typeof $scope.chat === 'string'; i++) {
                    if ($scope.chats[i]._id === $scope.chat) {
                        $scope.chat = $scope.chats[i];
                    }
                }
            }
            $scope.chat.mensajes = data.data;
            $scope.chat.chatid = data.chatid;
            $scope.preload = false;
            $scope.safeApply();
            setTimeout(function () {
                var mensajes = $('#mensajes');
                mensajes.scrollTop(mensajes.height() + 100);
            }, 500);
        }
    });
    routerswss.add({
        peticion: 'mensaje',
        success: function (data) {
            var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
            $scope.preload = false;
            if ($scope.route.location === 'conversacion' && $scope.chatUser !== undefined && data.usuarios.indexOf($scope.chatUser._id) >= 0) {
                if ($scope.chat === undefined)
                    $scope.chat = {};
                if ($scope.chat.mensajes === undefined || $scope.chat.mensajes.push === undefined)
                    $scope.chat.mensajes = [];
                $scope.chat.mensajes.push(data.data);
                $scope.safeApply();
            } else if ($scope.chats) {
                var chat;
                if ((chat = buscarChat(data.usuarios[0])) !== undefined) {
                    chat.estado = 'mensaje';
                    mostrarInfo(chat.nombres + ' ' + chat.apellidos + ' dijo: ' + data.data.mensaje);
                    $scope.safeApply();
                }
            }
            setTimeout(function () {
                $('#contenedor_mensajes').scrollTop($('#mensajes').height());
            }, 500);
        }
    });
    routerswss.add({
        peticion: 'videollamada',
        success: function (data) {
            var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
            if ($scope.chatUser !== undefined && $scope.chatUser._id === data.usuario && $scope.chat.mensajes !== undefined) {
                if (data.accion !== undefined) {
                    switch (data.accion) {
                        case 'cancelar':
                            for (var i = 0; i < $scope.chat.mensajes.length; i++)
                                if ($scope.chat.mensajes[i].tipo === 'videollamada')
                                    $scope.chat.mensajes[i].estado = 'rechazado';
                            $scope.safeApply();
                            break;
                        case 'aceptar':
                            establecerVideoLLamada($scope.chat.chatid, $scope.chatUser._id);
                            break;
                    }
                } else {
                    $scope.chat.mensajes.push({
                        usuario: $scope.chatUser._id,
                        fecha: new Date(),
                        tipo: 'videollamada'
                    });
                    $scope.safeApply();
                }
            } else if ($scope.chats) {
                var chat = buscarChat(data.usuario);
                if (chat !== undefined) {
                    chat.estado = 'mensaje';
                    chat.solicitud = 'videollamada';
                    mostrarInfo(chat.nombres + ' ' + chat.apellidos + ' solicita una videollamada.');
                    $scope.safeApply();
                }
            }
        }
    });
    routerswss.add({
        peticion: 'llamada',
        success: function (data) {
            var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
            if ($scope.chatUser !== undefined && $scope.chatUser._id === data.usuario && $scope.chat.mensajes !== undefined) {
                if (data.accion !== undefined) {
                    switch (data.accion) {
                        case 'cancelar':
                            for (var i = 0; i < $scope.chat.mensajes.length; i++) {
                                if ($scope.chat.mensajes[i].tipo === 'llamada') {
                                    $scope.chat.mensajes[i].estado = 'rechazado';
                                }
                            }
                            $scope.safeApply();
                            break;
                        case 'aceptar':
                            establecerLLamada($scope.chat.chatid, $scope.chat._id);
                            $scope.safeApply();
                            break;
                    }
                } else {
                    $scope.chat.mensajes.push({
                        usuario: $scope.chat._id,
                        fecha: new Date(),
                        tipo: 'llamada'
                    });
                    $scope.safeApply();
                }
            } else if ($scope.chats) {
                var chat;
                if ((chat = buscarChat(data.usuario)) !== undefined) {
                    chat.estado = 'mensaje';
                    chat.solicitud = 'llamada';
                    mostrarInfo(chat.nombres + ' ' + chat.apellidos + ' solicita una videollamada.');
                    $scope.safeApply();
                }
            }
        }
    });

    var gestionarChat = function (params, media) {
        var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
        if (!$scope.chatUser || ($scope.chatUser._id !== params.route.parametros.userid)) {
            $.get(servidor + '/api/v1/chats/' + params.route.parametros.userid).done(function (resultado) {
                var $scope = $scopes.get('applicationController');
                $scope.chat = {
                    mensajes: resultado.data ? resultado.data : {},
                    chatid: resultado.chatid
                };
                $scope.preload = false;
                if (typeof $scope.chats !== 'undefined' && $scope.chats.constructor === Array) {
                    for (var i = 0; i < $scope.chats.length; i++) {
                        delete $scope.chats[i].estado;
                        if ($scope.chats[i]._id === $scope.route.parametros.userid) {
                            $scope.chatUser = $scope.chats[i];
                        }
                    }
                }
                if (typeof $scope.chatUser !== 'undefined' && $scope.chatUser.solicitud !== undefined) {
                    $scope.chat.mensajes.push({
                        usuario: $scope.chatUser._id,
                        fecha: new Date(),
                        tipo: $scope.chatUser.solicitud
                    });
                }
                $scope.safeApply();
                setTimeout(function () {
                    var mensajes = $('#mensajes');
                    mensajes.scrollTop(mensajes.height() + 100);
                }, 500);
            });
        } else {
            $scope.preload = false;
        }
    };

    routers.add({
        vista: 'chats',
        view: '',
        routers: [
            {
                route: '/chats/:userid/external',
                api: '@',
                logged: true,
                location: 'conversacion',
                before: function (params) {
                    gestionarChat(params);
                    return routers.estados.NOCONSULTAR;
                }
            },
            {
                route: '/chats/:userid/external/VideoLLamada',
                api: '@',
                logged: true,
                location: 'conversacion',
                before: function (params) {
                    gestionarChat(params, true);
                    return routers.estados.NOCONSULTAR;
                }
            },
            {
                route: '/chats/:userid/external/LLamada',
                api: '@',
                logged: true,
                location: 'conversacion',
                before: function (params) {
                    gestionarChat(params);
                    return routers.estados.NOCONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'usuariosChats',
        routers: [
            {
                route: '/chats',
                api: servidor + '/plantillasHTML/usuariosChats.html',
                logged: true,
                location: '',
                before: function (params) {
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'chats',
        routers: [
            {
                route: '/chats/:userid',
                api: servidor + '/plantillasHTML/chat.html',
                logged: true,
                location: 'conversacion',
                before: function (params) {
                    gestionarChat(params);
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    
    application.controller('chatsController', ['$scope',
        function ($scope) {
            if ($scope.safeApply === undefined) {
                $scope.safeApply = function (fn) {
                    var phase = this.$root !== undefined ? this.$root.$$phase : undefined;
                    if (phase === '$apply' || phase === '$digest') {
                        if (fn && (typeof (fn) === 'function'))
                            fn();
                    } else {
                        this.$apply(fn);
                    }
                };
            }
            $scope.chatsController = {
                modo: '',
                rechazarVideoLlamada: function (mensaje) {
                    mensaje.estado = 'rechazado';
                    $.post(servidor + '/api/v1/chats/videollamada', {
                        usuario: $scope.chatUser._id, accion: 'cancelar'
                    });
                },
                aceptarVideoLlamada: function (mensaje) {
                    if (mensaje.tipo === 'videollamada') {
                        $.post(servidor + '/api/v1/chats/videollamada', {
                            usuario: $scope.chatUser._id, accion: 'aceptar'
                        });
                        establecerVideoLLamada($scope.chat.chatid, $scope.chat._id);
                    }
                },
                rechazarLlamada: function (mensaje) {
                    mensaje.estado = 'rechazado';
                    $.post(servidor + '/api/v1/chats/llamada', {
                        usuario: $scope.chatUser._id, accion: 'cancelar'
                    });
                },
                aceptarLlamada: function (mensaje) {
                    if (mensaje.tipo === 'llamada') {
                        $scope.conexion.enviar('llamada', {usuario: $scope.chat._id, accion: 'aceptar'});
                        establecerLLamada($scope.chat.chatid, $scope.chat._id);
                    }
                },
                isMensaje: function (mensaje) {
                    return mensaje && mensaje.mensaje !== undefined;
                },
                solicitarVideoLlamada: function () {
                    for (var i = 0; i < $scope.chat.mensajes.length; i++)
                        if (['videollamada', 'llamada'].indexOf($scope.chat.mensajes[i].tipo) >= 0)
                            $scope.chat.mensajes[i].estado = 'rechazado';
                    $.post(servidor + '/api/v1/chats/videollamada', {usuario: $scope.chatUser._id});
                    $scope.chat.mensajes.push({
                        usuario: $scope.applicationController.session.usuario,
                        fecha: new Date(),
                        tipo: 'videollamada'
                    });
                },
                solicitarLlamada: function () {
                    for (var i = 0; i < $scope.chat.mensajes.length; i++)
                        if (['videollamada', 'llamada'].indexOf($scope.chat.mensajes[i].tipo) >= 0)
                            $scope.chat.mensajes[i].estado = 'rechazado';
                    $scope.conexion.enviar('llamada', {usuario: $scope.chat._id});
                    $scope.chat.mensajes.push({
                        usuario: $scope.applicationController.session.usuario,
                        fecha: new Date(),
                        tipo: 'llamada'
                    });
                },
                enviar: function (userid) {
                    if ($scope.chatsController.mensaje.trim().length > 3) {
                        $.post(servidor + '/api/v1/chats/mensaje', {
                            tipo: 'usuario',
                            usuario: userid,
                            mensaje: $scope.chatsController.mensaje
                        }).done(function () {
                            $scope.chatsController.mensaje = '';
                            $scope.safeApply();
                        });
                    } else {
                        $scope.applicationController.mostrarErrores({
                            success: false,
                            error: 'Debes escribir mas de 3 caracteres'
                        });
                    }
                },
                getName: function (mensaje) {
                    var session = $scope.applicationController.session;
                    if (session.usuario === mensaje.usuario) {
                        return session.nombres + ' ' + session.apellidos;
                    } else {
                        if(typeof $scope.chatUser !== 'undefined') {
                            return $scope.chatUser.nombres + ' ' + $scope.chatUser.apellidos;
                        } else {
                            return '';
                        }
                    }
                },
                isMe: function (mensaje) {
                    return mensaje && $scope.applicationController.session.usuario === mensaje.usuario;
                },
                listarAmigos: function () {
                    $.get(servidor + '/api/v1/chats/amigos').done(function (resultado) {
                        if (resultado.success) {
                            var $scope = $scopes.get('applicationController') || $scopes.get('chatsController');
                            $scope.chats = resultado.data;
                            if ($scope.route && $scope.route.parametros && $scope.route.parametros.userid) {
                                for (var i = 0; i < resultado.data.length; i++) {
                                    if (resultado.data[i]._id === $scope.route.parametros.userid) {
                                        $scope.chatUser = resultado.data[i];
                                        delete resultado.data[i].estado;
                                        break;
                                    }
                                }
                            }
                            $scope.safeApply();
                        }
                    });
                }
            };
            $scope.chatsController.listarAmigos();
            $scopes.add('chatsController', $scope);
        }
    ]);
})();