/* global servidor, $scopes, routers, application */

'use strict';
(function () {
    var api = servidor + '/api/v1/noticias', ultimo = '?';
    var iniciarScope = function () {
        var $scope = $scopes.get('applicationController');
        if ($scope.noticiasController)
            $scope.noticiasController.modo = "noticias";
        if ($scope.noticias === undefined) {
            $scope.noticias = {
                comentario: '',
                errores: {success: true}
            };
        }
    };
    var obtenerNoticias = function (config) {
        var $scope = $scopes.get('applicationController');
        if (config === undefined)
            config = {};
        $.get(api + (config.usuario !== undefined ? '/' + config.usuario : ''), {
            minimo: config.minimo ? config.minimo.getTime() : undefined
        }).done(function (resultado) {
            if ($scope.noticias === undefined)
                $scope.noticias = {};
            if (resultado.success) {
                if ($scope.noticias.noticias === undefined) {
                    $scope.noticias.noticias = resultado.data;
                } else {
                    if (config.minimo) {
                        for (var i = 0; i < resultado.data.length; i++) {
                            $scope.noticias.noticias.push(resultado.data[i]);
                        }
                    } else {
                        $scope.noticias.noticias = resultado.data;
                    }
                }
            }
            $scope.preload = false;
            $scope.safeApply();
        });
    };
    routers.add({
        vista: 'noticias',
        before: function (usuario) {
            iniciarScope();
            obtenerNoticias(usuario);
            return this.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
        },
        routers: [
            {
                route: '/',
                api: servidor + '/plantillasHTML/noticias.html',
                location: 'noticias',
                logged: true,
                before: function ($scope) {
                    if (ultimo !== this.location && $scope.noticias)
                        $scope.noticias.noticias = [];
                    ultimo = this.location;
                    return this.parent.before();
                }
            },
            {
                route: '/noticias',
                api: servidor + '/plantillasHTML/noticias.html',
                location: 'noticias',
                logged: true,
                before: function ($scope) {
                    if (ultimo !== this.location && $scope.noticias)
                        $scope.noticias.noticias = [];
                    ultimo = this.location;
                    return this.parent.before();
                }
            },
            {
                route: '/:usuario',
                api: servidor + '/plantillasHTML/noticias.html',
                location: 'noticiasUsuario',
                logged: true,
                before: function ($scope) {
                    if (ultimo !== this.location && $scope.noticias)
                        $scope.noticias.noticias = [];
                    ultimo = this.location;
                    //$scope.amigoSeleccionado = {usuario: $scope.route.parametros.usuario};
                    var usuario = undefined;
                    if($scope.chats !== undefined && $scope.chats.constructor === Array)
                        for (var i = 0; i < $scope.chats.length; i++)
                            if ($scope.chats[i].usuario === $scope.route.parametros.usuario) {
                                $scope.visitado = $scope.chats[i];
                                break;
                            }

                    if (usuario === undefined) {
                        $.get(servidor + '/api/v1/amigos/' + $scope.route.parametros.usuario).done(function() {

                        });
                    }

                    return this.parent.before({usuario: $scope.route.parametros.usuario});
                }
            }
        ]
    });
    application.controller('noticiasController', ['$scope',
        function ($scope) {
            $scope.noticiasController = {
                modo: 'noticias',
                cargar_mas: function () {
                    var minimo = new Date();
                    if ($scope.noticias.noticias) {
                        for (var i = 0; i < $scope.noticias.noticias.length; i++) {
                            var fecha = new Date($scope.noticias.noticias[i].fecha);
                            if (minimo > fecha) {
                                minimo = fecha;
                            }
                        }
                    }
                    obtenerNoticias({minimo: minimo});
                },
                eliminar: function (noticia) {
                    $.post(api + '/eliminar', {
                        id: noticia._id,
                        contenedor: noticia.contenedor
                    }).done(function (resultado) {
                        if (resultado.success) {
                            noticia.estado = 'eliminado';
                            $scope.safeApply();
                        }
                    });
                },
                like: function (noticia) {
                    $.post(api + '/like', {
                        id: noticia._id,
                        contenedor: noticia.contenedor
                    }).done(function (resultado) {
                        if (resultado.success) {
                            noticia.likes = resultado.likes;
                            $scope.safeApply();
                        }
                    });
                },
                cancelar_comentario: function () {
                    delete $scope.noticias.noticia;
                    $scope.noticiasController.modo = "noticias";
                },
                comentar: function (noticia) {
                    $scope.noticias.noticia = noticia;
                    $scope.noticiasController.modo = "comentario";
                },
                comentar_noticia: function (noticia) {
                    if (!$scope.noticias.comentario || $scope.noticias.comentario.length <= 3) {
                        $scope.applicationController.mostrarErrores({
                            success: false, 
                            error: ['El comentario debe tener mas de 3 caracteres']
                        });
                        return;
                    }
                    $.post(api + '/noticia/comentar', {
                        id: noticia._id,
                        contenedor: noticia.contenedor,
                        comentario: $scope.noticias.comentario
                    }).done(function (resultado) {
                        if (resultado.success) {
                            $scope.noticias.errores = {success: true};
                            $scope.noticias.comentario = '';
                            noticia.comentarios = resultado.comentarios;
                        } else {
                            $scope.noticias.errores = resultado;
                        }
                        $scope.safeApply();
                    });
                },
                publicar: function (permiso) {
                    if (!$scope.noticias.comentario || $scope.noticias.comentario.length <= 3) {
                        $scope.applicationController.mostrarErrores({
                            success: false,
                            comentario: ['El comentario debe tener mas de 3 caracteres']
                        });
                        return;
                    }
                    var minimo = new Date();
                    $.post(api + '/publicar', {
                        comentario: $scope.noticias.comentario,
                        permiso: permiso
                    }).done(function (resultado) {
                        if (resultado.success) {
                            $scope.noticias.comentario = '';
                            obtenerNoticias();
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.safeApply();
                    });
                }
            };
            $scopes.add('noticiasController', $scope);
            iniciarScope();
        }
    ]);
})();