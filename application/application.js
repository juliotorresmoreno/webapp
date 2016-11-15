/* global servidor, HTMLCanvasElement */

'use strict';

// ###### iniciamos componentes #####
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
var datosVideo = {StreamVideo: null, url: null};

if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value: function (callback, type, quality) {
            var binStr = atob(this.toDataURL(type, quality).split(',')[1]),
                    len = binStr.length,
                    arr = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                arr[i] = binStr.charCodeAt(i);
            }
            callback(new Blob([arr], {type: type || 'image/png'}));
        }
    });
}

// ##################################


if (application === undefined) {
    var pushState = window.history.pushState !== undefined;
    var url_location = '@';
    var $scopes = (function () {
        var data = {};
        return {
            add: function (key, dato) {
                data[key] = dato;
            },
            get: function (key) {
                return data[key];
            },
            getAll: function () {
                return data;
            }
        };
    })();
    var modelos = (function () {
        var data = {};
        return {
            add: function (key, dato) {
                data[key] = dato;
            },
            get: function (key) {
                return data[key];
            }
        };
    })();
    var routers = (function () {
        var data = [];
        return {
            add: function (dato) {
                data.push(dato);
            },
            get: function (key) {
                if (data[key] !== undefined)
                    return data[key];
                for (var i = 0; i < data.length; i++)
                    if (data[i].vista === key)
                        return data[i];
            },
            getAll: function () {
                return data;
            },
            estados: {
                CANCELAR: 0,
                NOCONSULTAR: 1,
                CONSULTAR: 2
            }
        };
    })();
    var routerswss = (function () {
        var data = [];
        return {
            add: function (dato) {
                data.push(dato);
            },
            get: function (key) {
                return (data.hasOwnProperty(key) !== undefined) ? data[key] : null;
            },
            getAll: function () {
                return data;
            }
        };
    })();

    $('.navbar-collapse a:not(.dropdown-toggle)').click(function () {
        if ($(window).width() < 768) {
            $('.navbar-collapse').collapse('hide');
        }
    });
    var application = angular.module('application', ['ngHtmlCompile', 'ngRoute', 'ui.select', 'ngSanitize']);
    application.config(['$routeProvider', '$locationProvider',
        function ($routeProvider, $locationProvider) {
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
            });
        }
    ]);
    application.filter('propsFilter', function () {
        return function (items, props) {
            var out = [];
            if (angular.isArray(items)) {
                items.forEach(function (item) {
                    var itemMatches = false;
                    var keys = Object.keys(props);
                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        if (props[prop] === undefined)
                            continue;
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }
                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                out = items;
            }
            return out;
        };
    });
    application.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    });
    var entrelazar = function () {
        var refrescar = function () {
            url_location = '@';
        };
        var obj = $('a').not('.enlace');
        obj.addClass('enlace');
        obj.mouseup(refrescar);
        obj.keypress(function (e) {
            if (e.which === 13) {
                refrescar();
            }
        });
    };
    var redirigir = function (url) {
        if (pushState) {
            window.history.pushState(undefined, document.title, servidor + url);
        } else {
            document.location.href = servidor + '/#' + url;
        }
        url_location = '@';
    };
    var transformar_url = function (url, remover) {
        var respuesta;
        if (url !== servidor + '/' && url !== servidor + '/#') {
            respuesta = url.replace(servidor + '/#', servidor).replace(servidor, '');
        } else {
            respuesta = '/';
        }
        if (remover) {
            respuesta = respuesta.indexOf('?') >= 0 ? respuesta.substr(0, respuesta.indexOf('?')) : respuesta;
        }
        return respuesta;
    };
    routers.add({
        vista: 'home',
        routers: [
            {
                route: '/',
                api: servidor + '/plantillasHTML/registro.html',
                location: 'home',
                logged: false,
                before: function () {
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'proyecto',
        routers: [
            {
                route: '/proyecto',
                api: servidor + '/api/v1/informacion/proyecto',
                before: function () {
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'about',
        routers: [
            {
                route: '/about',
                api: servidor + '/api/v1/informacion/about',
                location: 'about',
                before: function () {
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });
    routers.add({
        vista: 'contacto',
        routers: [
            {
                route: '/about',
                api: servidor + '/api/v1/informacion/contacto',
                location: 'contacto',
                before: function () {
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });

    application.controller("applicationController", ['$scope',
        function ($scope) {
            if ($scope.safeApply === undefined)
                $scope.safeApply = function (fn) {
                    var phase = this.$root !== undefined ? this.$root.$$phase : undefined;
                    if (phase === '$apply' || phase === '$digest') {
                        if (fn && (typeof (fn) === 'function')) {
                            fn();
                        }
                    } else {
                        this.$apply(fn);
                    }
                };
            var anos_disponibles = [], ano = (new Date()).getFullYear();
            var meses_disponibles = [
                {label: 'Enero', value: '01', dias: 31},
                {label: 'Febrero', value: '02', dias: 29},
                {label: 'Marzo', value: '03', dias: 31},
                {label: 'Abril', value: '04', dias: 30},
                {label: 'Mayo', value: '05', dias: 31},
                {label: 'Junio', value: '06', dias: 30},
                {label: 'Julio', value: '07', dias: 31},
                {label: 'Agosto', value: '08', dias: 31},
                {label: 'Septiembre', value: '09', dias: 30},
                {label: 'Octubre', value: '10', dias: 31},
                {label: 'Noviembre', value: '11', dias: 30},
                {label: 'Diciembre', value: '12', dias: 31}
            ];
            for (var i = ano - 15; i > ano - 100; i--)
                anos_disponibles.push({value: i});
            for (var i = 0; i < meses_disponibles.length; i++) {
                meses_disponibles[i].days = [];
                for (var j = 1; j <= meses_disponibles[i].dias; j++)
                    meses_disponibles[i].days.push({value: j});
            }
            var adicionarZero = function (num) {
                return (num <= 9 ? '0' : '') + num;
            };
            $scope.application = {items: {}};
            $scope.formatear_fecha = function (fecha, formato) {
                if(typeof fecha === 'string') {
                    fecha = new Date(parseInt(fecha));
                } else {
                    fecha = new Date(fecha);
                }
                return formato.replace('Y', fecha.getFullYear())
                        .replace('m', adicionarZero(fecha.getMonth() + 1))
                        .replace('d', adicionarZero(fecha.getDate()))
                        .replace('H', adicionarZero(fecha.getHours()))
                        .replace('i', adicionarZero(fecha.getMinutes()))
                        .replace('s', adicionarZero(fecha.getSeconds()));
            };

            $scope.chatEnbebido = '/plantillasHTML/chat_enbebido.html';

            $scope.conexion = {
                enviar: function (peticion, data) {
                    if ($scope.conexion.WebSocket === null || $scope.conexion.WebSocket.readyState !== 1) {
                        if ($scope.conexion.WebSocket !== null && $scope.conexion.WebSocket.readyState === 3) {
                            conectar($scope.conexion.servidorWss);
                        }
                        setTimeout(function () {
                            $scope.conexion.enviar(peticion, data);
                        }, 5000);
                    } else {
                        $scope.conexion.WebSocket.send(JSON.stringify({peticion: peticion, data: data}));
                    }
                },
                onmessage: function (request) {
                    var data = JSON.parse(request.data);
                    for (var i = 0; i < $scope.conexion.routeswss.length; i++) {
                        if ($scope.conexion.routeswss[i].peticion === data.peticion) {
                            $scope.conexion.routeswss[i].success(data);
                            return;
                        }
                    }
                },
                onopen: function () {
                    $scope.conexion.routeswss = routerswss.getAll();
                },
                onclose: function () {
                    $scope.conexion.reconexion = setTimeout(function () {
                        conectar($scope.conexion.servidorWss);
                    }, 500);
                },
                routeswss: [],
                WebSocket: undefined
            };
            var conectar = function (servidorWss) {
                if ($scope.conexion && $scope.conexion.reconexion) {
                    clearTimeout($scope.conexion.reconexion);
                }
                if ($scope.conexion.WebSocket === undefined || $scope.conexion.WebSocket.readyState !== 1) {
                    $scope.conexion.servidorWss = servidorWss;
                    $scope.conexion.WebSocket = new WebSocket(servidorWss, 'echo-protocol');
                    $scope.conexion.WebSocket.onopen = $scope.conexion.onopen;
                    $scope.conexion.WebSocket.onclose = $scope.conexion.onclose;
                    $scope.conexion.WebSocket.onmessage = $scope.conexion.onmessage;
                }
            };
            $scope.windowHeight = () => $(window).height();
            $scope.windowWidth = () => $(window).width();
            $scope.responderConfirmacion = (respuesta) => {
                if(typeof $scope.callbackConfirmacion === 'function') {
                    $scope.callbackConfirmacion(respuesta);
                }
                $scope.preguntaConfirmacion = '';
                delete $scope.callbackConfirmacion;
            };
            $scope.preguntar = (pregunta, callback) => {
                $scope.preguntaConfirmacion = pregunta;
                $scope.callbackConfirmacion = callback;
            }
            $scope.applicationController = {
                servidor: servidor,
                anos_disponibles: anos_disponibles,
                meses_disponibles: meses_disponibles,
                dias_disponibles: [],
                sexos: {M: 'Hombre', F: 'Mujer', O: 'Otro'},
                permisos: [
                    {label: 'Publico', id: 'public'},
                    {label: 'Amigos', id: 'friends'},
                    {label: 'Privado', id: 'private'}
                ],
                fotoPerfilReload: 0,
                plantillaChatHTML: '/plantillasHTML/chat',
                isLogged: function () {
                    return $scope.applicationController.session !== undefined;
                },
                logged: function () {
                    if (window.session) {
                        var servidorWss = (location.protocol === 'http:' ? 'ws' : 'wss') + '://' + location.host + '/chats?token=' + session.token;
                        $scope.applicationController.session = window.session;
                        $scope.applicationController.plantillaHTML = '/plantillasHTML/session.html';
                        $scope.applicationController.rightHTML = '/plantillasHTML/messenger';
                        conectar(servidorWss);
                    } else {
                        $scope.applicationController.plantillaHTML = '/plantillasHTML/layout.html';
                    }
                    $scope.safeApply();
                },
                nombreCompleto() {
                    if ($scope.applicationController.isLogged()) {
                        return $scope.applicationController.session.nombres + ' ' + $scope.applicationController.session.apellidos;
                    } else {
                        return '';
                    }
                },
                mostrarInfo(info) {
                    $.Notify({
                        caption: 'Informacion',
                        content: info,
                        type: 'info'
                    });
                },
                isMe: function () {
                    return $scope.visitado !== undefined;
                },
                mostrarErrores: function (errores) {
                    if (errores.success === false) {
                        var str = '';
                        for (var i in errores) {
                            if (errores.hasOwnProperty(i)) {
                                if (i !== 'success') {
                                    if (Array.isArray(errores[i])) {
                                        for (var j = 0; j < errores[i].length; j++) {
                                            $.Notify({
                                                caption: 'Error',
                                                content: errores[i][j],
                                                type: 'alert'
                                            });
                                        }
                                    } else {
                                        $.Notify({
                                            caption: 'Error',
                                            content: errores[i],
                                            type: 'alert'
                                        });
                                    }
                                }
                            }
                        }
                    }
                },
                paginacion: function (pagina, limite, total) {
                    var paginas = Math.ceil(total / limite);
                    var respuesta = {}, inicio, final;
                    if (pagina <= 3 || paginas <= 5) {
                        inicio = 1;
                        final = paginas <= 5 ? paginas : 5;
                    } else if (pagina > paginas - 2) {
                        inicio = paginas - 5;
                        final = paginas;
                    } else {
                        inicio = pagina - 2;
                        final = pagina + 2;
                    }
                    respuesta.paginaFinal = paginas > 0 ? paginas : 1;
                    respuesta.paginaInicial = 1;
                    respuesta.paginas = [];
                    for (var i = inicio; i <= final; i++)
                        respuesta.paginas.push(i);
                    return respuesta;
                },
                iniciarPagina: function () {
                    if ($scope.route.extraParams.pagina) {
                        return parseInt($scope.route.extraParams.pagina);
                    } else {
                        return 1;
                    }
                }
            };
            $scope.applicationController.logged();
            $scopes.add('applicationController', $scope);

            var E404 = {
                route: '*',
                api: servidor + '/plantillasHTML/404.html',
                location: '404',
                parent: {vista: '404'}
            };

            setInterval((function () {
                var router = routers.getAll();
                var i, j, k, routeQ, locationQ, conteo, route, params, url_actual, logged, api, URI;
                var importar = function (route, params) {
                    var $scope = $scopes.get('applicationController');
                    var parametros = {};
                    $scope.preload = true;
                    route.URI = route.params ? route.params : route.api;
                    if (params) {
                        var temp = params.split('&');
                        for (var i = 0; i < temp.length; i++) {
                            var obj = temp[i].split('=');
                            if (obj.length === 2) {
                                parametros[obj[0]] = obj[1];
                            }
                        }
                    }
                    route.extraParams = parametros;
                    if (route.api === '') {
                        return;
                    }
                    if ($scope) {
                        $scope.route = {
                            extraParams: route.extraParams,
                            location: route.location,
                            parametros: route.parametros,
                            params: route.params
                        };
                        $scope.chatCSS = { 'size-x200': true };
                        if (route.location) {
                            $scope.applicationController.location = route.location;
                        }
                    }
                    var responder = function (resultado) {
                        var $scope = $scopes.get('applicationController');
                        if (resultado.toLowerCase().indexOf('<!doctype html>') === -1) {
                            route.parent = route.parent ? route.parent : {};
                            route.parent.view = resultado;
                            $scope.applicationController.contenidoHTML = resultado;
                            $scope.safeApply();
                            if (route.after) {
                                route.after(resultado, $scope);
                            }
                            $scope.mostrar = true;
                        }
                    };
                    if (route.before !== undefined) {
                        switch (route.before($scope)) {
                            case routers.estados.NOCONSULTAR:
                                responder(route.parent.view);
                            case routers.estados.CANCELAR:
                                return;
                        }
                    }
                    if ($scope) {
                        $scope.mostrarChat = true;
                    }
                    if (route.URI.substr(0, 1) === '/') {
                        route.URI = servidor + route.URI;
                    }
                    $.get(route.URI).done(responder);
                };
                return function () {
                    url_actual = transformar_url(window.location.href);
                    var parametros = {};
                    if (url_location !== url_actual) {
                        var $scope = $scopes.get('applicationController');
                        if($scope.webrtc !== undefined) {
                            $scope.webrtc.webrtc.stop();
                        }
                        logged = window.session !== undefined;
                        url_location = url_actual;
                        URI = transformar_url(window.location.href, true);
                        for (i = 0; i < router.length; i++) {
                            for (j = 0; j < router[i].routers.length; j++) {
                                if (router[i].routers[j].logged === logged) {
                                    params = window.location.href.indexOf('?') >= 0 ? window.location.href.split('?')[1] : '';
                                    router[i].routers[j].parent = router[i];
                                    if (router[i].routers[j].route === URI) {
                                        return importar(router[i].routers[j], params);
                                    } else {
                                        routeQ = router[i].routers[j].route.split('/');
                                        api = router[i].routers[j].api;
                                        locationQ = URI.split('/');
                                        if (routeQ.length === locationQ.length) {
                                            conteo = 0;
                                            for (k = 0; k < routeQ.length; k++) {
                                                if (routeQ[k] === locationQ[k])
                                                    conteo++;
                                                else if (routeQ[k].substr(0, 1) === ':') {
                                                    conteo++;
                                                    api = api.replace(routeQ[k], locationQ[k]);
                                                    parametros[routeQ[k].substr(1)] = locationQ[k];
                                                }
                                            }
                                            if (conteo === routeQ.length) {
                                                route = router[i].routers[j];
                                                route.params = api;
                                                route.parametros = parametros;
                                                return importar(route, params);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        return importar(E404);
                    }
                    delete this;
                };
            })(), 100);
        }
    ]);

    application.directive('permisos', function () {
        return {
            restrict: 'E',
            template: '<div class="dropdown-button">' +
                    '<button href="#" class="dropdown-toggle button primary">Guardar</button>' +
                    '<ul class="split-content d-menu" data-role="dropdown">' +
                    '<li ng-class="{ active: data == permiso.id }" ng-repeat="permiso in permisos">' +
                    '<a href="javascript: void(0)" ng-click="callback(permiso.id, data)">' +
                    '{{permiso.label}}' +
                    '</a>' +
                    '</li>' +
                    '</ul>' +
                    '</ul>',
            scope: {
                data: '=permiso',
                permisos: '=permisos',
                callback: '=callback',
                application: '=application'
            },
            link: function (scope, element) {
                element.find('div[class=dropdown]').id = element.data('id');
                element.find('ul[class="dropdown-menu"]').attr('aria-labelledby', element.data('id'));
                element.find('button.btn').html(element.attr('leyenda') + '<span class="caret"></span>');
                switch (element.attr('tipo')) {
                    case 'dropup':
                        var dropdown = element.find('div[class=dropdown]');
                        dropdown.removeClass('dropdown');
                        dropdown.addClass('dropup');
                        break;
                    case 'right':
                        element.find('ul[class="dropdown-menu"]').addClass('dropdown-menu-right');
                        break;
                }
            }
        };
    });
}