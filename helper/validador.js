(function () {
    var errores = {
        requerido: 'El campo {campo} es obligatorio.',
        minimo: 'El campo {campo} debe tener minimo {minimo} caracteres.',
        maximo: 'El campo {campo} debe tener maximo {maximo} caracteres.',
        caracteres: 'El campo {campo} tiene caracteres invalidos.',
        email: 'El campo {campo} no es un correo electronico valido.',
        fecha: 'El campo {campo} no es una fecha valida.',
        password: 'El campo {campo} no es una contraseña segura, debe tener mayusculas, minusculas y minimo 6 caracteres.',
        confirmar: 'El campo {campo} debe ser confirmado.',
        duplicado: 'El {campo} {valor} ya ha sido registrado antes.',
        enum: 'El valor del campo {campo} no es valido.',
        foraneo: 'El {campo} {valor} no existe.'
    };
    var alfabeto = 'abcdefghijklmnñopqrstuvwxyzABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    var numeros = '0123456789';
    var especiales = '_-';
    function init(validator, md5) {
        validador = function (modelo, dato, config) {
            if (config === undefined)
                config = {};
            var campo, resultado = {success: true}, permitido, caracter, filtro;
            var estado = 0, limite = modelo.campos.length;
            var buscarDuplicado = function (campo, valor) {
                return function (err, data) {
                    if (data.length > 0) {
                        resultado[campo].push(errores.duplicado.replace('{campo}', campo).replace('{valor}', valor));
                    }
                    resultado.success = resultado.success && resultado[campo].length > 0 ? false: resultado.success;
                    estado += 1;
                    if (estado == limite && config.callback != undefined) {
                        config.callback(resultado);
                    }
                };
            };
            var buscarForaneo = function (campo, valor) {
                return function (err, data) {
                    if (data.length == 0) {
                        resultado[campo].push(
                                errores.foraneo.replace('{campo}', campo)
                                .replace('{valor}', valor)
                                );
                    }
                    resultado.success = resultado.success && resultado[campo].length > 0 ? false: resultado.success;
                    estado += 1;
                    if (estado == limite && config.callback != undefined) {
                        config.callback(resultado);
                    }
                };
            };
            var revisarModelo = function (campo, valor) {
                return function (respuesta) {
                    if (respuesta.success == false) {
                        for (var i in respuesta) {
                            if (respuesta.hasOwnProperty(i) && i != 'success') {
                                for (var j; j < respuesta[i].length; j++) {
                                    resultado[campo.nombre].push(respuesta[i][j]);
                                }
                            }
                        }
                    }
                    estado += 1;
                    if (estado == limite && config.callback != undefined) {
                        config.callback(resultado);
                    }
                }
            }
            var revisar = function (campo, valor) {
                if (valor != '' && valor != undefined) {
                    if (campo.modelo && config.modelos && config.modelos[campo.modelo]) {
                        limite += 1;
                        validador(config.modelos[campo.modelo], valor, {
                            modelos: config.modelos,
                            finder: config.finder,
                            callback: revisarModelo(campo, valor)
                        });
                        return;
                    }
                    if (campo.tamano && valor != '' && valor != undefined) {
                        if (campo.tamano.minimo && valor.length < campo.tamano.minimo)
                            resultado[campo.nombre].push(
                                    errores.minimo.replace('{campo}', campo.nombre)
                                    .replace('{minimo}', campo.tamano.minimo)
                                    );
                        if (campo.tamano.minimo && valor.length > campo.tamano.maximo)
                            resultado[campo.nombre].push(
                                    errores.maximo.replace('{campo}', campo.nombre)
                                    .replace('{maximo}', campo.tamano.maximo)
                                    );
                    };
                    if (campo.caracteres) {
                        for (var j = 0; j < valor.length; j++) {
                            caracter = valor.substr(j, 1);
                            permitido = campo.caracteres.alfabeto ? alfabeto.indexOf(caracter) != -1 : false;
                            permitido = campo.caracteres.numeros && !permitido ? numeros.indexOf(caracter) != -1 : permitido;
                            permitido = campo.caracteres.espacios && !permitido ? caracter == ' ' : permitido;
                            permitido = campo.caracteres.especiales && !permitido ? especiales.indexOf(caracter) != -1 : permitido;
                            if (!permitido) {
                                resultado[campo.nombre].push(errores.caracteres.replace('{campo}', campo.nombre));
                                break;
                            }
                        };
                    };
                    switch (campo.formato) {
                        case 'email':
                            if (!validator.isEmail(valor))
                                resultado[campo.nombre].push(errores.email.replace('{campo}', campo.nombre));
                            break;
                        case 'password':
                            if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(valor))
                                resultado[campo.nombre].push(errores.password.replace('{campo}', campo.nombre));
                            break;
                        case 'fecha':
                            if (!validator.isDate(valor.toString()))
                                resultado[campo.nombre].push(errores.fecha.replace('{campo}', campo.nombre));
                            break;
                    };
                    if (campo.confirmar) {
                        if (valor != dato[campo.nombre + '_confirmation']) {
                            resultado[campo.nombre + '_confirmation'] = [errores.confirmar.replace('{campo}', campo.nombre)];
                            resultado.success = false;
                        }
                        if (config != undefined && config.eliminar_confirmation)
                            delete dato[campo.nombre + '_confirmation'];
                    }
                    if (config.finder != undefined && config.callback != undefined && (config.modo == 'insert' || campo.constante != true)) {
                        if (campo.unico) {
                            filtro = {}
                            filtro[campo.nombre] = valor;
                            if (config.modo != 'insert' && dato._id != undefined)
                                filtro._id = {$ne: dato._id};
                            limite += 1;
                            config.finder(undefined, filtro, buscarDuplicado(campo.nombre, valor));
                        };
                        if (campo.foraneo) {
                            filtro = {_id: valor};
                            limite += 1;
                            config.finder(campo.foraneo.tabla, filtro, buscarForaneo(campo.nombre, valor));
                        };
                    };
                    if (campo.mascara) {
                        switch (campo.mascara) {
                            case "md5":
                                if (typeof md5 !== 'undefined')
                                    valor = md5(valor);
                                break;
                        }
                    }
                    if (campo.enum) {
                        if (campo.enum.indexOf(valor) == -1) {
                            resultado[campo.nombre].push(errores.enum.replace('{campo}', campo.nombre));
                        }
                    }
                } else {
                    var question1 = campo.extra != 'ignorar';
                    var question2 = campo.requerido === true;
                    var question3 = config.modo == campo.requerido && config.modo != undefined;

                    if (question1 && (question2 || question3)) {
                        resultado[campo.nombre].push(errores.requerido.replace('{campo}', campo.nombre));
                    }
                }
            };
            if (modelo.campos) {
                for (var i = 0; i < modelo.campos.length; i++) {
                    campo = modelo.campos[i];
                    resultado[campo.nombre] = [];
                    if (campo.multiple === true) {
                        for (var j = 0; j < dato[campo.nombre].length; j++)
                            revisar(campo, dato[campo.nombre][j]);
                    } else {
                        revisar(campo, dato[campo.nombre]);
                    }
                    resultado.success = resultado[campo.nombre].length > 0 ? false : resultado.success;
                    estado += 1;
                };
            }
            if (estado == limite && config.callback != undefined) {
                config.callback(resultado);
            }
            return resultado;
        }
        return validador;
    };
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = function (validator, md5) {
            return init(validator, md5);
        };
    } else {
        window.validador = init(validator);
    }
})();