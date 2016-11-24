/* global routers, servidor, application, pushState, modelos, $scopes */

'use strict';

routers.add({
    vista: 'login',
    routers: [
        {
            route: '/login',
            api: servidor + '/plantillasHTML/login.html',
            location: 'login',
            logged: false,
            before: function () {
                return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
            }
        }
    ]
});
routers.add({
    vista: 'registrar',
    routers: [
        {
            route: '/registrate',
            api: servidor + '/plantillasHTML/registrate.html',
            location: 'login',
            logged: false,
            before: function () {
                return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
            }
        }
    ]
});
routers.add({
    vista: 'logout',
    routers: [
        {
            route: '/logout',
            api: servidor + '/api/v1/auth/logout',
            location: 'logout',
            logged: true,
            before: function () {
                $.get(this.api).done(function (resultado) {
                    if (resultado.success) {
                        if(location.href === '/') {
                            location.reload();
                        } else {
                            location.href = '/';
                        }
                    }
                });
                return routers.estados.CANCELAR;
            }
        }
    ]
});


application.controller('authController', ['$scope', 
    function ($scope) {
        $scope.authController = {
            errores: {},
            registrar: function () {
                var usuario = {
                    nombres: $scope.authController.nombres,
                    apellidos: $scope.authController.apellidos,
                    usuario: $scope.authController.usuario,
                    email: $scope.authController.email,
                    password: $scope.authController.password,
                    password_confirmation: $scope.authController.password_confirmation
                };
                var campos = ['nombres', 'apellidos', 'usuario', 'email', 'password'];
                var resultado = validador($scope.authController.modelo, usuario);
                $scope.authController.errores = resultado;
                if (resultado.success) {
                    $.post(servidor + '/api/v1/auth/registrar', usuario).done(function (resultado) {
                        if (resultado.success) {
                            window.session = resultado.session;
                            $scope.applicationController.logged();
                            $scope.applicationController.contenidoHTML = '';
                        } else {
                            for (var i = 0; i < campos.length; i++) {
                                if(resultado[campos[i]].length === 1) {
                                    $.Notify({
                                        caption: 'Error',
                                        content: resultado[campos[i]][0],
                                        type: 'alert'
                                    });
                                }
                            }
                        }
                        $scope.safeApply();
                        url_location = '@';
                    });
                } else {
                    for (var i = 0; i < campos.length; i++) {
                        if(resultado[campos[i]].length === 1) {
                            $.Notify({
                                caption: 'Error',
                                content: resultado[campos[i]][0],
                                type: 'error'
                            });
                        }
                    }
                }
            },
            login: function () {
                var credenciales = {
                    usuario: $scope.authController.usuario,
                    password: $scope.authController.password
                };
                $.post(servidor + '/api/v1/auth/login', credenciales).done(function (resultado) {
                    if (resultado.success) {
                        window.session = resultado.session;
                        if (location.pathname === '/login') {
                            if (pushState) {
                                window.history.pushState(undefined, document.title, '/');
                            } else {
                                document.location.href = servidor + '#';
                            }
                        }
                        $scope.applicationController.logged();
                        $scope.applicationController.contenidoHTML = '';
                    } else {
                        $scope.authController.errores = resultado;
                        $.Notify({
                            caption: 'Error',
                            content: resultado.login,
                            type: 'error'
                        });
                    }
                    $scope.safeApply();
                });
            }
        };
        if (!$scope.applicationController.isLogged() && !modelos.get('usuarios')) {
            $.get(servidor + '/modelos/usuarios').done(function (resultado) {
                var $scope = $scopes.get('authController');
                $scope.authController.modelo = resultado;
                $scope.safeApply();
                modelos.add('usuarios', resultado);
            });
        } else {
            $scope.authController.modelo = modelos.get('usuarios');
        }
        $scopes.add('authController', $scope);
    }
]);