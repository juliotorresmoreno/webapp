/* global servidor, $scopes, routers, application */

'use strict';
(function () {
    var cargar_datos = function () {
        var $scope = $scopes.get('applicationController');
        if ($scope.perfil === undefined)
            $scope.perfil = {};
        $.get(servidor + '/api/v1/perfil').done(function (resultado) {
            $scope.perfil = resultado;
            delete $scope.perfil.success;
            if (resultado.nacimiento_mes !== undefined)
                $scope.perfil.nacimiento_mes = $scope.applicationController.meses_disponibles[resultado.nacimiento_mes - 1];
            if (resultado.nacimiento_dia !== undefined)
                $scope.perfil.nacimiento_dia = $scope.perfil.nacimiento_mes.days[resultado.nacimiento_dia - 1];
            if (resultado.nacimiento_ano !== undefined) {
                for (var i = 0; i < $scope.applicationController.anos_disponibles.length; i++) {
                    if ($scope.applicationController.anos_disponibles[i].value === resultado.nacimiento_ano) {
                        $scope.perfil.nacimiento_ano = $scope.applicationController.anos_disponibles[i];
                        break;
                    }
                }
            }
            $scope.preload = false;
            $scope.safeApply();
        });
    };
    routers.add({
        vista: 'perfil',
        before: function () {
            var $scope = $scopes.get('applicationController');
            cargar_datos();
            return this.view ? routers.estados.NOCONSULTAR : routers.estados.CONSULTAR;
        },
        routers: [
            {
                route: '/perfil/editar',
                api: servidor + '/plantillasHTML/perfil.html',
                location: 'basico',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            },
            {
                route: '/perfil/editar/basico',
                api: servidor + '/plantillasHTML/perfil.html',
                location: 'basico',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            },
            {
                route: '/perfil/editar/contacto',
                api: servidor + '/plantillasHTML/perfil.html',
                location: 'contacto',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            },
            {
                route: '/perfil/editar/intereses',
                api: servidor + '/plantillasHTML/perfil.html',
                location: 'intereses',
                logged: true,
                before: function () {
                    return this.parent.before();
                }
            }
        ]
    });

    application.controller('perfilController', ['$scope',
        function ($scope) {
            $scope.perfilController = {
                errores: {success: true},
                guardarBasico: function () {
                    var params = {
                        nombres: $scope.perfil.nombres,
                        apellidos: $scope.perfil.apellidos
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.session.nombres = params.nombres;
                            $scope.applicationController.session.apellidos = params.apellidos;
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarEmail: function (permiso) {
                    $scope.perfil.permiso_email = permiso;
                    var params = {
                        email: $scope.perfil.email,
                        permiso_email: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarDiaNacimiento: function (permiso) {
                    $scope.perfil.permiso_nacimiento_dia = permiso;
                    var params = {
                        nacimiento_mes: $scope.perfil.nacimiento_mes.value,
                        nacimiento_dia: $scope.perfil.nacimiento_dia.value,
                        permiso_nacimiento_dia: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarAnoNacimiento: function (permiso) {
                    $scope.perfil.permiso_nacimiento_ano = permiso;
                    var params = {
                        nacimiento_ano: $scope.perfil.nacimiento_ano.value,
                        permiso_nacimiento_ano: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarSexo: function (permiso) {
                    $scope.perfil.permiso_sexo = permiso;
                    var params = {
                        sexo: $scope.perfil.sexo,
                        permiso_sexo: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarPaisNacimiento: function (permiso) {
                    $scope.perfil.permiso_pais_nacimiento = permiso;
                    var params = {
                        pais_nacimiento: $scope.perfil.pais_nacimiento,
                        permiso_pais_nacimiento: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarCiudadNacimiento: function (permiso) {
                    $scope.perfil.permiso_ciudad_nacimiento = permiso;
                    var params = {
                        ciudad_nacimiento: $scope.perfil.ciudad_nacimiento,
                        permiso_ciudad_nacimiento: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarPaisResidencia: function (permiso) {
                    $scope.perfil.permiso_pais_residencia = permiso;
                    var params = {
                        pais_residencia: $scope.perfil.pais_residencia,
                        permiso_pais_residencia: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarCiudadResidencia: function (permiso) {
                    $scope.perfil.permiso_ciudad_residencia = permiso;
                    var params = {
                        ciudad_residencia: $scope.perfil.ciudad_residencia,
                        permiso_ciudad_residencia: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarDireccion: function (permiso) {
                    $scope.perfil.permiso_direccion = permiso;
                    var params = {
                        direccion: $scope.perfil.direccion,
                        permiso_direccion: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarTelefono: function (permiso) {
                    $scope.perfil.permiso_telefono = permiso;
                    var params = {
                        telefono: $scope.perfil.telefono,
                        permiso_telefono: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarCelular: function (permiso) {
                    $scope.perfil.permiso_celular = permiso;
                    var params = {
                        celular: $scope.perfil.celular,
                        permiso_celular: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarPersonalidad: function (permiso) {
                    $scope.perfil.permiso_personalidad = permiso;
                    var params = {
                        personalidad: $scope.perfil.personalidad,
                        permiso_personalidad: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarIntereses: function (permiso) {
                    $scope.perfil.permiso_intereses = permiso;
                    var params = {
                        intereses: $scope.perfil.intereses,
                        permiso_intereses: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarSeries: function (permiso) {
                    $scope.perfil.permiso_series = permiso;
                    var params = {
                        series: $scope.perfil.series,
                        permiso_series: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarMusica: function (permiso) {
                    $scope.perfil.permiso_musica = permiso;
                    var params = {
                        musica: $scope.perfil.musica,
                        permiso_musica: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarCreenciasReligiosas: function (permiso) {
                    $scope.perfil.permiso_creencias_religiosas = permiso;
                    var params = {
                        creencias_religiosas: $scope.perfil.creencias_religiosas,
                        permiso_creencias_religiosas: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                guardarCreenciasPoliticas: function (permiso) {
                    $scope.perfil.permiso_creencias_politicas = permiso;
                    var params = {
                        creencias_politicas: $scope.perfil.creencias_politicas,
                        permiso_creencias_politicas: permiso
                    };
                    $.post(servidor + '/api/v1/perfil', params).done(function (resultado) {
                        if (resultado.success) {
                            $scope.applicationController.mostrarInfo("Guardado correctamente.");
                        } else {
                            $scope.applicationController.mostrarErrores(resultado);
                        }
                        $scope.$apply();
                    });
                },
                isMe: function () {
                    return $scope.applicationController.session && $scope.perfil.usuario === $scope.applicationController.session.usuario;
                }
            };
            $scopes.add('perfilController', $scope);
        }
    ]);
})();