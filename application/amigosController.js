/* global servidor, routers, $scopes, application */

'use strict';
(function () {
    var ultimo = '?';
    var iniciarScope = function () {
        var $scope = $scopes.get('applicationController');
        if ($scope.amigos === undefined) {
            $scope.amigos = {};
            $scope.amigos.personas = [];
            $scope.amigos.paginaFinal = 1;
            $scope.amigos.paginaInicial = 1;
            $scope.amigos.paginas = 1;
            $scope.amigos.seleccionarPagina = function (pagina) {
                if ($scope.amigos.busqueda === '') {
                    return servidor + '/amigos?pagina=' + pagina;
                } else {
                    return servidor + '/amigos?buscar=' + $scope.amigos.busqueda + 'pagina=' + pagina;
                }
            };
            $scope.amigos.busqueda_change = function () {
                redirigir('/amigos?buscar=' + $scope.amigos.busqueda);
            };
        }
        if ($scope.route && $scope.route.extraParams.pagina)
            $scope.amigos.pagina = parseInt($scope.route.extraParams.pagina);
        else
            $scope.amigos.pagina = 1;
        if ($scope.route.extraParams.buscar)
            $scope.amigos.busqueda = $scope.route.extraParams.buscar.replace('/\%20/', ' ');
        else
            $scope.amigos.busqueda = '';
    };
    var buscarPersonas = function (categoria) {
        var $scope = $scopes.get('applicationController');
        var procesar = function (resultado) {
            if (resultado.success) {
                $scope.amigos.personas = resultado.data;
                var paginacion = $scope.applicationController.paginacion($scope.amigos.pagina, resultado.limite, resultado.total);
                $scope.amigos.paginaFinal = paginacion.paginaFinal;
                $scope.amigos.paginaInicial = paginacion.paginaInicial;
                $scope.amigos.paginas = paginacion.paginas;
                $scope.preload = false;
                $scope.safeApply();
            }
        };
        if ($scope.amigos.busqueda && $scope.amigos.busqueda.length >= 3) {
            if (ultimo === $scope.amigos.busqueda)
                return;
            ultimo = $scope.amigos.busqueda;
            $.get(servidor + '/api/v1/' + categoria, {
                query: $scope.amigos.busqueda,
                pagina: $scope.amigos.pagina
            }).done(procesar);
        } else {
            if (ultimo === categoria) {
                $scope.preload = false;
                return;
            }
            if ($scope.amigos.busqueda !== '' && $scope.amigos.busqueda.length < 3 && ultimo === categoria) {
                $scope.preload = false;
                return;
            }
            ultimo = categoria;
            $.get(servidor + '/api/v1/' + categoria, {
                pagina: $scope.amigos.pagina
            }).done(procesar);
        };
    };
    routers.add({
        vista: 'amigos',
        before: function (location) {
            ultimo = '?';
            iniciarScope();
            buscarPersonas(location);
            return this.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
        },
        routers: [
            {
                route: '/amigos',
                api: servidor + '/plantillasHTML/amigos.html',
                location: 'amigos',
                logged: true,
                before: function () {
                    return this.parent.before(this.location);
                }
            },
            {
                route: '/solicitudes',
                api: servidor + '/plantillasHTML/amigos.html',
                location: 'solicitudes',
                logged: true,
                before: function () {
                    return this.parent.before(this.location);
                }
            }
        ]
    });
    application.controller('amigosController', ['$scope',
        function ($scope) {
            $scope.amigosController = {
                errores: {},
                agregarSolicitudAmistad: function (persona) {
                    $.post(servidor + '/api/v1/amigos/agregar', {usuario: persona.usuario}).done(function (resultado) {
                        if (resultado.success) {
                            persona.relacion = {relacion: resultado.relacion};
                            $scopes.get('chatsController').chatsController.listarAmigos();
                            $scope.safeApply();
                        }
                    });
                },
                cancelarSolicitudAmistad: function (persona) {
                    $.post(servidor + '/api/v1/amigos/cancelar', {usuario: persona.usuario}).done(function (resultado) {
                        if (resultado.success) {
                            persona.relacion = {};
                            $scope.safeApply();
                        }
                    });
                }
            };
            $scopes.add('amigosController', $scope);
        }
    ]);
})();