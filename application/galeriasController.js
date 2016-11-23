/* global routers, servidor, $scopes, application, datosVideo */

'use strict';

(function () {
    routers.add({
        vista: 'galerias',
        routers: [
            {
                route: '/galerias',
                api: servidor + '/plantillasHTML/galerias.html',
                location: 'galerias',
                logged: true,
                before: function () {
                    var $scope = $scopes.get('applicationController');
                    if ($scope.galerias === undefined)
                        $scope.galerias = {};
                    $.get(servidor + '/api/v1/galerias').done(function (resultado) {
                        delete $scope.galerias.id;
                        delete $scope.galerias.nombre;
                        delete $scope.galerias.permiso;
                        delete $scope.galerias.galerias;
                        if (resultado.success) {
                            $scope.galerias.galerias = resultado.galerias;
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
        vista: 'galeria',
        routers: [
            {
                route: '/galerias/:galeria',
                api: servidor + '/plantillasHTML/galeria.html',
                location: 'galeria',
                logged: true,
                before: function () {
                    var $scope = $scopes.get('applicationController');
                    var api = servidor + '/api/v1/galerias/' + $scope.route.parametros.galeria;
                    if ($scope.galerias === undefined)
                        $scope.galerias = {};
                    $scope.galerias.modo = 'galeria';
                    $.get(api).done(function (resultado) {
                        if (resultado.success) {
                            $scope.galerias.id = $scope.route.parametros.galeria;
                            $scope.galerias.nombre = $scope.route.parametros.galeria;
                            $scope.galerias.permiso = resultado.permiso;
                            $scope.galerias.fotos = resultado.fotos;
                            delete $scope.galerias.galerias;
                        } else {
                            delete $scope.galerias.id;
                            delete $scope.galerias.nombre;
                            delete $scope.galerias.permiso;
                            delete $scope.galerias.galerias;
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
        vista: 'foto',
        routers: [
            {
                route: '/galerias/:galeria/:foto',
                api: servidor + '/plantillasHTML/foto.html',
                location: 'foto',
                logged: true,
                before: function () {
                    verFoto();
                    return this.parent.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
                }
            }
        ]
    });

    var verFoto = function () {
        var $scope = $scopes.get('applicationController');
        if ($scope.galerias === undefined)
            $scope.galerias = {};
        $scope.galerias.id = $scope.route.parametros.foto.replace('%20', ' ').replace('+', ' ');
        $scope.galerias.foto = $scope.galerias.id;
        $scope.galerias.nombre = $scope.route.parametros.galeria;
        delete $scope.galerias.galerias;

        if ($scope.galerias.fotos === undefined) {
            var api = servidor + '/api/v1/galerias/' + $scope.route.parametros.galeria;
            $.get(api).done(function (resultado) {
                if (resultado.success) {
                    $scope.galerias.permiso = resultado.permiso;
                    $scope.galerias.fotos = resultado.fotos;
                    navegacion();
                }
                $scope.preload = false;
                $scope.safeApply();
            });
        } else {
            navegacion();
            $scope.preload = false;
        }
    };

    var navegacion = function () {
        var $scope = $scopes.get('applicationController');
        for (var i = 0; i < $scope.galerias.fotos.length; i++) {
            if ($scope.galerias.foto === $scope.galerias.fotos[i].nombre) {
                $scope.galerias.siguiente = $scope.galerias.fotos[i < $scope.galerias.fotos.length - 1 ? i + 1 : 0].nombre;
                $scope.galerias.anterior = $scope.galerias.fotos[i > 0 ? i - 1 : $scope.galerias.fotos.length - 1].nombre;
                $scope.galerias.presente = $scope.galerias.fotos[i].ruta;
            }
        }
    };

    application.directive('resize', function ($window) {
        return function (scope, element, attr) {
            var w = angular.element($window);
            scope.$watch(function () {
                if (scope.galeriasController && scope.galeriasController.fotoStyle === undefined) {
                    scope.galeriasController.fotoStyle = function () {
                        scope.$eval(attr.notifier);
                        return {'width': $('#fotos').width() + 'px'};
                    };
                }
            });
            w.bind('resize', function () {
                scope.$apply();
            });
        };
    });
    application.controller('galeriasController', ['$scope',
        function ($scope) {
            $scope.galeriasController = {
                errores: {success: true},
                estilos: {},
                navegacionStyle() {
                    var oFoto = $('#foto');
                    return {
                        'float': 'left',
                        'z-index': 1000,
                        'background': '#cccccc',
                        'width': '100px',
                        'opacity': 0.25,
                        'height': oFoto.height() + 'px',
                        left: 0
                    };
                },
                nombre: '',
                foto: '',
                files: [],
                establecerFotoPerfil() {
                    $.post(servidor + '/api/v1/galerias/' + $scope.galerias.nombre + '/establecerFotoPerfil', {
                        id: $scope.galerias.id
                    }).done(function (resultado) {
                        if (resultado.success)
                            $scope.applicationController.fotoPerfilReload += 1;
                        else
                            $scope.applicationController.mostrarErrores(resultado);
                        $scope.safeApply();
                    });
                },
                eliminarFoto() {
                    if ($scope.galerias.foto && $scope.galerias.foto.length >= 3) {
                        $.post(servidor + '/api/v1/galerias/' + $scope.galerias.nombre + '/eliminarFoto', {
                            id: $scope.galerias.id
                        }).done(function (resultado) {
                            if (resultado.success) {
                                $scope.galerias.permiso = resultado.permiso;
                                $scope.galerias.fotos = resultado.fotos;
                                $scope.galerias.modo = 'galeria';
                                $scope.applicationController.mostrarInfo('Eliminado correctamente');
                            } else
                                $scope.applicationController.mostrarErrores(resultado);
                            $scope.safeApply();
                        });
                    }
                },
                save(permiso) {
                    if ($scope.galerias.nombre && $scope.galerias.nombre.length > 3) {
                        $.post(servidor + '/api/v1/galerias', {
                            id: $scope.galerias.id,
                            nombre: $scope.galerias.nombre,
                            permiso: permiso
                        }).done(function (resultado) {
                            if (resultado.success) {
                                if($scope.galerias.galerias === undefined) {
                                    $scope.galerias.galerias = [];
                                }
                                $scope.galerias.galerias.push({
                                    nombre: $scope.galerias.nombre,
                                    permiso: $scope.galerias.permiso
                                });
                            } else {
                                $scope.applicationController.mostrarErrores({success: false, nombre: [resultado.mensaje]});
                            }
                            $scope.safeApply();
                        });
                    } else {
                        $scope.applicationController.mostrarErrores({
                            success: false,
                            nombre: ['El nombre debe tener minimo 3 caracteres.']
                        });
                    }
                },
                renombrarFoto() {
                    if ($scope.galerias.foto && $scope.galerias.foto.length >= 3) {
                        $.post(servidor + '/api/v1/galerias/' + $scope.galerias.nombre + '/renombrarFoto', {
                            id: $scope.galerias.id,
                            nombre: $scope.galerias.foto
                        }).done(function (resultado) {
                            if (resultado.success)
                                $scope.galerias.id = $scope.galerias.foto;
                            else
                                $scope.applicationController.mostrarErrores(resultado);
                            $scope.safeApply();
                        });
                    }
                },
                filesChange() {
                    var files = $('#files');
                    $scope.galerias.files = [];
                    if (files[0].files && files[0].files.length > 0) {
                        var reader;
                        for (var i = 0; i < files[0].files.length; i++) {
                            reader = new FileReader();
                            reader.onload = (function () {
                                var file = files[0].files[i];
                                return function (e) {
                                    $scope.galerias.files.push({name: file.name, src: e.target.result});
                                    $scope.safeApply();
                                };
                            })();
                            reader.readAsDataURL(files[0].files[i]);
                        }
                        $scope.galerias.modo = 'subirFotos';
                        $scope.safeApply();
                    }
                },
                tomarFoto() {
                    $scope.galerias.modo = 'tomarFoto';
                    navigator.getUserMedia(
                            {audio: false, video: true},
                            function (streamVideo) {
                                datosVideo.StreamVideo = streamVideo;
                                datosVideo.url = window.URL.createObjectURL(streamVideo);
                                $('#camara').attr('src', datosVideo.url);
                            }, function () {
                        $scope.applicationController.mostrarErrores({
                            success: false,
                            error: ['No fue posible obtener acceso a la cámara.']
                        });
                    });
                },
                cancelarTomarFoto() {
                    if (datosVideo.StreamVideo) {
                        datosVideo.StreamVideo.stop();
                        window.URL.revokeObjectURL(datosVideo.url);
                    }
                    $scope.galerias.modo = 'galeria';
                    $scope.safeApply();
                },
                capturarFoto() {
                    var oCamara, oFoto, oContexto, w, h;
                    oCamara = $('#camara');
                    oFoto = $('#foto');
                    w = oCamara.width();
                    h = oCamara.height();
                    oFoto.attr({'width': w, 'height': h});
                    oContexto = oFoto[0].getContext('2d');
                    oContexto.drawImage(oCamara[0], 0, 0, w, h);
                    $scope.galeriasController.cancelarTomarFoto();
                    $scope.galerias.modo = 'salvarFotoTomada';
                    $scope.safeApply();
                },
                guardarFotoCapturada () {
                    var oFoto = jQuery('#foto');
                    $scope.applicationController.mostrarInfo("Subiendo imagen");
                    oFoto[0].toBlob(function (blob, type) {
                        var form = new FormData();
                        form.append('file', blob);
                        $.ajax({
                            url: servidor + '/api/v1/galerias/' + $scope.galerias.nombre + '/subirFoto',
                            type: "POST",
                            data: form,
                            processData: false,
                            contentType: false,
                            success: function (resultado) {
                                if (resultado.success) {
                                    $scope.galerias.permiso = resultado.permiso;
                                    $scope.galerias.fotos = resultado.fotos;
                                    navegacion();
                                    $scope.galeriasController.cancelarTomarFoto();
                                    $scope.galerias.modo = 'galeria';
                                    $scope.safeApply();
                                }
                            }
                        });
                    });
                },
                subirFoto() {
                    $('#files').trigger('click');
                },
                subirTodo() {
                    var files = $('#files');
                    $scope.applicationController.mostrarInfo("Subiendo imagen");
                    var subirFoto = function (file) {
                        var form = new FormData();
                        form.append('file', file);
                        $.ajax({
                            url: servidor + '/api/v1/galerias/' + $scope.galerias.nombre + '/subirFoto',
                            type: "POST",
                            data: form,
                            processData: false,
                            contentType: false,
                            success: function (resultado) {
                                if (resultado.success) {
                                    var encontrado = false;
                                    file.estado = 1;
                                    for (var i = 0; i < files[0].files.length; i++)
                                        if (files[0].files[i].estado !== 1)
                                            encontrado = true;
                                    if (encontrado === false)
                                        $scope.galerias.files = [];
                                    $scope.galerias.permiso = resultado.permiso;
                                    $scope.galerias.fotos = resultado.fotos;
                                    $scope.galerias.modo = 'galeria';
                                    $scope.safeApply();
                                }
                            }
                        });
                    };
                    for (var i = 0; i < files[0].files.length; i++)
                        if (files[0].files[i].estado !== 1)
                            subirFoto(files[0].files[i]);
                },
                subirCancelar() {
                    delete $scope.galerias.files;
                    $scope.galerias.files = [];
                    $scope.galerias.modo = 'galeria';
                },
                navegacion: verFoto,
                urlImagen(galeria) {
                    var usuario = $scope.route.parametros || $scope.applicationController.session.usuario;
                    var servidor = $scope.applicationController.servidor;
                    return servidor + '/api/v1/galerias/' + usuario + '/' + galeria.nombre + '/@preview';
                }
            };
            $scopes.add('galeriasController', $scope);
        }
    ]);
})();