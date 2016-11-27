module.exports = function (config, modelo) {
    var coleccion, modelo, ncoleccion;
    var resultado = {
        setModelo: function (params) {
            modelo = params;
        },
        getModelo: function () {
            return modelo;
        },
        find: function (filtro, callback, campos) {
            if (campos) {
                coleccion.find(filtro, campos, callback);
            } else {
                coleccion.find(filtro, callback);
            }
        },
        setColeccion: function (params) {
            coleccion = config.mongodb.collection(params);
            ncoleccion = params;
        },
        getColeccion: function () {
            return coleccion;
        },
        getData: function (data, relacion) {
            if (coleccion === undefined || modelo === undefined)
                return undefined;
            for (var i = 0; i < modelo.campos.length; i++) {
                if (modelo.campos[i].permiso !== undefined) {
                    for (var j = 0; j < data.length; j++) {
                        if (data[j][modelo.campos[i].permiso] === undefined)
                            delete data[j][modelo.campos[i].nombre];
                        switch (data[j][modelo.campos[i].permiso]) {
                            case 'friends':
                                if (relacion !== 'friends')
                                    delete data[j][modelo.campos[i].nombre];
                                break;
                            case 'private':
                                if (relacion !== 'me')
                                    delete data[j][modelo.campos[i].nombre];
                                break;
                        }
                    }
                }
            }
            return data;
        },
        leftJoin: function (params) {
            var filtro = {};
            filtro[params.relacion] = {$in: []};
            for (var i = 0; i < params.datos.length; i++) {
                if (params.inverso !== true) {
                    params.datos[i][params.alias] = params.relacion === '_id' ? {} : [];
                }
                filtro[params.relacion].$in.push(params.datos[i][params.campo]);
            }
            var responder = function (err, data) {
                data.toArray(function (error, resultado) {
                    for (var i = 0; i < params.datos.length; i++) {
                        for (var j = 0; j < resultado.length; j++) {
                            if (params.datos[i][params.campo].toString() === resultado[j][params.relacion].toString()) {
                                if (params.inverso !== true) {
                                    if (params.relacion === '_id') {
                                        params.datos[i][params.alias] = resultado[j];
                                    } else {
                                        params.datos[i][params.alias].push(resultado[j]);
                                    }
                                } else {
                                    if (params.relacion === '_id') {
                                        resultado[j][params.alias] = params.datos[i];
                                    } else {
                                        if (resultado[j][params.alias] === undefined) {
                                            resultado[j][params.alias] = [];
                                        }
                                        resultado[j][params.alias].push(params.datos[i]);
                                    }
                                }
                            }
                        }
                    }
                    if (params.callback) {
                        params.callback(params.inverso !== true ? params.datos : resultado);
                    }
                });
            };
            if (params.campos) {
                config.mongodb.collection(params.tabla).find(filtro, params.campos, responder);
            } else {
                config.mongodb.collection(params.tabla).find(filtro, responder);
            }
        },
        add: function (data, callback, error, omitirvalidacion) {
            if (modelo !== undefined) {
                if (omitirvalidacion !== true) {
                    config.validador(modelo, data, {
                        eliminar_confirmation: true,
                        modelos: config.modelos,
                        modo: 'insert',
                        finder: function (tabla, filtro, callback) {
                            if (tabla === undefined || tabla === ncoleccion) {
                                coleccion.find(filtro, function (err, data) {
                                    data.toArray(callback);
                                });
                            } else {
                                config.mongodb.collection(tabla).find(filtro, function (err, data) {
                                    data.toArray(callback);
                                });
                            }
                        },
                        callback: function (resultado) {
                            if (coleccion !== undefined) {
                                if (resultado.success) {
                                    for (var i = 0; i < modelo.campos.length; i++) {
                                        if (modelo.campos[i].mascara === 'md5') {
                                            data[modelo.campos[i].nombre] = config.md5(data[modelo.campos[i].nombre]);
                                        }
                                    };
                                    coleccion.insert(data, function (err, result) {
                                        callback !== undefined ? callback(result) : '';
                                    });
                                } else {
                                    error !== undefined ? error({code: 1001, error: resultado}) : '';
                                }
                            } else {
                                error !== undefined ? error({code: 1000, mensaje: 'No se ha seleccionado la coleccion.'}) : '';
                            }
                        }
                    });
                } else {
                    coleccion.insert(data, function (err, result) {
                        callback !== undefined ? callback(result) : '';
                    });
                }
            } else {
                error !== undefined ? error({code: 1002, mensaje: 'No se ha seleccionado el modelo.'}) : '';
            }
        },
        update: function (key, data, callback, error, omitirvalidacion) {
            if (modelo !== undefined) {
                if (omitirvalidacion !== true) {
                    config.validador(modelo, data, {
                        modelos: config.modelos,
                        modo: 'update',
                        finder: function (tabla, filtro, callback) {
                            if (tabla === undefined || tabla === ncoleccion) {
                                coleccion.find(filtro, function (err, data) {
                                    data.toArray(callback);
                                });
                            } else {
                                config.mongodb.collection(tabla).find(filtro, function (err, data) {
                                    data.toArray(callback);
                                });
                            }
                        },
                        callback: function (resultado) {
                            if (data._id !== undefined)
                                delete data._id;
                            if (coleccion) {
                                if (resultado.success) {
                                    for (var i = 0; i < modelo.campos.length; i++) {
                                        if (modelo.campos[i].constante === true) {
                                            delete data[modelo.campos[i].nombre];
                                        }
                                        if (modelo.campos[i].mascara === 'md5' && data.hasOwnProperty(modelo.campos[i].nombre)) {
                                            data[modelo.campos[i].nombre] = config.md5(data[modelo.campos[i].nombre]);
                                        }
                                    }
                                    coleccion.update({_id:key}, {$set: data}, function (err, result) {
                                        if (err) {
                                            error ? error(err) : '';
                                        } else {
                                            callback ? callback(result) : '';
                                        }
                                    });
                                } else {
                                    error !== undefined ? error({code: 1001, error: resultado}) : '';
                                }
                            } else {
                                error !== undefined ? error({code: 1000, mensaje: 'No se ha seleccionado la coleccion.'}) : '';
                            }
                        }
                    });
                } else {
                    coleccion.update(key, {$set: data}, function (err, result) {
                        if (err) {
                            error ? error(err) : '';
                        } else {
                            callback ? callback(result) : '';
                        }
                    });
                }
            } else {
                error !== undefined ? error({code: 1002, mensaje: 'No se ha seleccionado el modelo.'}) : '';
            }
        },
        delete: function (key, callback, error) {
            if (coleccion) {
                coleccion.remove(key, function (err, result) {
                    if (err) {
                        error ? error(err) : '';
                    } else {
                        callback ? callback(result) : '';
                    }
                });
            }
        }
    };
    if (typeof modelo !== 'undefined') {
        resultado.setModelo(modelo);
        if(modelo.tabla !== '@') {
            resultado.setColeccion(modelo.tabla);
        }
    }
    return resultado;
};