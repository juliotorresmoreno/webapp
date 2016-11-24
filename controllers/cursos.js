module.exports = function (config) {
    var router = config.express.Router();
    var params = config;

    var Cursos = config.modelos.BaseModel(params, config.modelos.cursos);
    var Contenidos = config.modelos.BaseModel(config, config.modelos.contenidos);
    var Actividades = config.modelos.BaseModel(config, config.modelos.actividades);
    var Preguntas = config.modelos.BaseModel(config, config.modelos.preguntas);
    var CursosEstudiantes = config.modelos.BaseModel(config, config.modelos.cursosEstudiantes);
    
    router.post('/crear', function (req, res) {
        var data = {
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            prerequisitos: req.body.prerequisitos,
            video_introduccion: req.body.video_introduccion,
            creador: req.session.usuario,
            permiso: req.body.permiso
        };
        var success = function (resultado) {
            if(resultado.insertedCount == 1) {
                res.json({
                    success: true, 
                    mensaje: 'Agregado correctamente.',
                    cursoid: resultado.insertedIds[0]
                });
            } else {
                res.json({
                    success: false, 
                    mensaje: "Ocurrio un error inesperado"
                });
            }
        };
        var error = function (resultado) {
            if (resultado.code === 1001) {
                res.json(resultado.error);
            } else {
                res.end();
            }
        };
        Cursos.add(data, success, error);
    });
    router.post('/editar', function (req, res) {
        var data = {
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            prerequisitos: req.body.prerequisitos,
            video_introduccion: req.body.video_introduccion,
            creador: req.session.usuario,
            permiso: req.body.permiso
        };
        var success = function (resultado) {
            res.json({
                success: true, 
                mensaje: 'Editado correctamente.'
            });
        };
        var error = function (resultado) {
            if (resultado.code === 1000 || resultado.code === 1001) {
                res.json(resultado.error);
            } else {
                res.end();
            }
        };
        Cursos.update(config.mongodb.ObjectID(req.body.id), data, success, error);
    });
    router.get('/', function (req, res) {
        var buscar = req.query.buscar;
        var filtro = buscar ? {nombre: new RegExp(buscar), descripcion: new RegExp(buscar)}: {};
        if(req.query.user == 'me') {
            filtro.$or = [{creador: req.session.usuario}];
            CursosEstudiantes.find({usuario:req.session.usuario}, function (error, data) {
                data.toArray(function (err, resultado) {
                    var ids = [];
                    for(var i = 0; i < resultado.length; i++) {
                        ids.push(resultado[i].curso);
                    }
                    filtro.$or.push({ _id: {'$in': ids}});
                    Cursos.find(filtro, function (error, data) {
                        data.toArray(function (err, resultado) {
                            res.json({success:true,data:resultado});
                        });
                    });
                });
            });
        } else {
            Cursos.find(filtro, function (error, data) {
                data.toArray(function (err, resultado) {
                    res.json({success:true,data:resultado});
                });
            });
        }
    });
    var obtenerCurso = function(id, usuario, callback, registrado) {
        Cursos.find({_id: config.mongodb.ObjectID(id)}, function (error, data) {
            data.toArray(function (err, resultado) {
                if (resultado.length === 1) {
                    var dato = {
                        usuario: usuario,
                        curso: config.mongodb.ObjectID(id)
                    };
                    if(registrado) {
                        CursosEstudiantes.find(dato, function (error, data) {
                            data.count(function (err, result) {
                                if (result === 1) {
                                    resultado[0].registrado = true;
                                }
                                if(typeof callback === 'function') {
                                    callback({success: true, data: resultado[0]});
                                }
                            });
                        });
                    } else {
                        if(typeof callback === 'function') {
                            callback({success: true, data: resultado[0]});
                        }
                    }
                } else {
                    if(typeof callback === 'function') {
                        callback({success: false, mensaje: 'Curso no encontrado'});
                    }
                }
            });
        });
    };
    router.get('/:id', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            res.json(resultado);
        }, true);
    });
    router.post('/retirar', function (req, res) {
        var dato = {
            usuario: req.session.usuario,
            curso: config.mongodb.ObjectID(req.body.id)
        };
        CursosEstudiantes.delete(dato, function () {
            res.json({success: true, mensaje: 'Te retiraste correctamente.'});
        }, req.error);
    });
    router.post('/suscribir', function (req, res) {
        var dato = {
            usuario: req.session.usuario,
            curso: config.mongodb.ObjectID(req.body.id)
        };
        CursosEstudiantes.find(dato, function (error, data) {
            data.toArray(function (err, resultado) {
                if (resultado.length === 1) {
                    res.json({success: false, mensaje: 'Ya estas registrado.'});
                } else {
                    var success = function () {
                        res.json({success: true, mensaje: 'Te registraste correctamente.'});
                    };
                    var error = function (resultado) {
                        if (resultado.code === 1001 || resultado.code === 1002) {
                            res.json(resultado.error);
                        } else {
                            res.end({success: false, mensaje: 'Error no controlado'});
                        }
                    };
                    CursosEstudiantes.add(dato, success, error);
                }
            });
        });
    });
    router.get('/:id/listarConectados', function(req, res, nexr) {
        res.json(req.params);
    });
    router.post('/:id/comentarStreaming', function (req, res) {
        var curso = req.body.curso;
        var mensaje = {
            curso: req.body.id,
            fechaHora: req.body.fechaHora,
            mensaje: req.body.mensaje,
            nombres: req.body.nombres,
            apellidos: req.body.apellidos,
            usuario: req.body.usuario
        };
        CursosEstudiantes.find({curso: config.mongodb.ObjectID(curso)}, function (error, result) { 
            result.toArray(function(error, data) {
                for(var i = 0; i < data.length; i++) {
                    process.send({
                        success: true,
                        peticion: 'mensajeCurso',
                        session: data[i].usuario,
                        data: mensaje
                    });
                }
                res.json({success: true});
            });
        });
    });

    router.get('/:id/contenidos', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            var filtro = {curso:config.mongodb.ObjectID(req.params.id)};
            if(resultado.success == false) {
                res.json(resultado);
                return;
            }
            if(resultado.data.creador !== req.session.usuario) {
                filtro.publico = true;
            }
            Contenidos.find(filtro, function (error, resultado) { 
                resultado.toArray(function(error, data) {
                    res.json({success:true,data:data});
                });
            });
        }, false);
    });

    router.post('/:id/contenidos/crear', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var data = {
                    nombre: req.body.nombre,
                    descripcion: req.body.descripcion,
                    video: req.body.video,
                    curso: config.mongodb.ObjectID(req.params.id),
                    publico: req.body.publico === 'true'
                }
                var success = function (resultado) {
                    if(resultado.insertedIds.length > 0) {
                        res.json({
                            success: true, 
                            mensaje: 'Agregado correctamente.',
                            id: resultado.insertedIds[0]
                        });
                    } else {
                        res.json({
                            success: false, 
                            mensaje: 'Ocurrio un error inesperado',
                            id: resultado.insertedIds[0]
                        });
                    }
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Contenidos.add(data, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });

    router.post('/:id/contenidos/editar', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var data = {
                    nombre: req.body.nombre,
                    descripcion: req.body.descripcion,
                    video: req.body.video,
                    curso: config.mongodb.ObjectID(req.params.id),
                    publico: req.body.publico === 'true'
                }
                var success = function (resultado) {
                    res.json({success: true, mensaje: 'Actualizado correctamente.'});
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Contenidos.update(config.mongodb.ObjectID(req.body._id), data, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });

    router.post('/:id/contenidos/eliminar', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var success = function (resultado) {
                    res.json({success: true, mensaje: 'Eliminado correctamente.'});
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Contenidos.delete({_id:config.mongodb.ObjectID(req.body._id)}, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });


    router.get('/contenido/:contenido/actividades', function (req, res) {
        Actividades.find({contenido: config.mongodb.ObjectID(req.params.contenido)}, function (error, data) {
            data.toArray(function (err, resultado) {
                res.json({success:true, data:resultado})
            });
        });
    });

    router.post('/:id/actividades/:contenido/crear', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var data = {
                    nombre: req.body.nombre,
                    descripcion: req.body.descripcion,
                    contenido: config.mongodb.ObjectID(req.params.contenido),
                    publico: req.body.publico === 'true'
                }
                var success = function (resultado) {
                    res.json({success: true, mensaje: 'Agregado correctamente.'});
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Actividades.add(data, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });

    router.post('/:id/actividades/:contenido/editar', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var data = {
                    nombre: req.body.nombre,
                    descripcion: req.body.descripcion,
                    contenido: config.mongodb.ObjectID(req.params.contenido),
                    publico: req.body.publico === 'true'
                }
                var success = function (resultado) {
                    res.json({success: true, mensaje: 'Actualizado correctamente.'});
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Actividades.update(config.mongodb.ObjectID(req.body._id), data, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });

    router.post('/:id/actividades/:contenido/eliminar', function (req, res) {
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var success = function (resultado) {
                    res.json({success: true, mensaje: 'Eliminado correctamente.'});
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Actividades.delete({_id:config.mongodb.ObjectID(req.body._id)}, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });



       router.post('/:id/actividades/:contenido/actividad/:actividad/preguntas/editar', function (req, res, next) {
        var cursoid = req.params.id;
        var contenido = req.params.contenido;
        var actividad = req.params.actividad;
        var data = {
            actividad: config.mongodb.ObjectID(actividad),
            enunciado: req.body.enunciado,
            descripcion: req.body.descripcion,
            publico: req.body.publico === 'true',
            tipo: req.body.tipo,
            respuestas: []
        };
        var respuestas = typeof req.body.respuestas === 'string' ? 
                         JSON.parse(req.body.respuestas):
                         req.body.respuestas;
        if(Array.isArray(respuestas)) {
            for(var i = 0; i < respuestas.length; i++) {
                if(respuestas[i].enunciado) {
                    data.respuestas.push({
                        id: respuestas[i].id || config.md5(new Date() + respuestas[i].enunciado),
                        enunciado:respuestas[i].enunciado,
                        valor:parseInt(respuestas[i].valor)
                    });
                }
            }
        }
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var success = function (resultado) {
                    res.json({success: true, mensaje: 'Actualizado correctamente.'});
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Preguntas.update(config.mongodb.ObjectID(req.body._id), data, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });

    router.get('/actividad/:actividad/preguntas', function (req, res) {
        var filtro = {actividad: config.mongodb.ObjectID(req.params.actividad)};
        Preguntas.find(filtro, (error, resultado) => {
            if(error) {
                res.json({success:true,error:'Ocurrio un error inesperado.'});
            } else {
                resultado.toArray((err, data) => {
                    res.json({success:true,data:data});
                });
            }
        });
    });

    router.post('/:id/actividades/:contenido/actividad/:actividad/preguntas/crear', function (req, res, next) {
        var cursoid = req.params.id;
        var contenido = req.params.contenido;
        var actividad = req.params.actividad;
        var data = {
            actividad: config.mongodb.ObjectID(actividad),
            enunciado: req.body.enunciado,
            descripcion: req.body.descripcion,
            publico: req.body.publico === 'true',
            tipo: req.body.tipo,
            respuestas: []
        };
        var respuestas = typeof req.body.respuestas === 'string' ? 
                         JSON.parse(req.body.respuestas):
                         req.body.respuestas;
        if(Array.isArray(respuestas)) {
            for(var i = 0; i < respuestas.length; i++) {
                if(respuestas[i].enunciado) {
                    data.respuestas.push({
                        id: config.md5(new Date() + respuestas[i].enunciado),
                        enunciado:respuestas[i].enunciado,
                        valor:parseInt(respuestas[i].valor)
                    });
                }
            }
        }
        obtenerCurso(req.params.id, req.session.usuario, function (resultado) {
            if(resultado.data.creador === req.session.usuario) {
                var success = function (resultado) {
                    res.json({success: true, mensaje: 'Agregado correctamente.'});
                };
                var error = function (resultado) {
                    if (resultado.code === 1000 || resultado.code === 1001) {
                        res.json(resultado.error);
                    } else {
                        res.end();
                    }
                };
                Preguntas.add(data, success, error);
            } else {
                res.json({success: false, error: 'No eres el creador'});
            }
        }, false);
    });

    var url = '/:id/actividades/:contenido/actividad/:actividad/preguntas/eliminar';
    router.post(url, function (req, res, next) {
        var pregunta = req.body.pregunta;
        Preguntas.delete({_id: config.mongodb.ObjectID(pregunta)}, function () {
            res.json({success: true, mensaje: 'Pregunta eliminada correctamente.'});
        }, req.error);
    });

    var url = "/:id/actividades/:contenido/actividad/:actividad/preguntas/responder";
    router.post(url, function (req, res, next) {
        var pregunta = req.body.pregunta;
        var respuestasU = req.body.data;
        var cursoid = req.params.id;
        var contenido = req.params.contenido;
        var actividad = req.params.actividad;
        if(typeof respuestasU !== 'undefined') {
            if(typeof respuestasU == "string") {
                respuestasU = JSON.parse(respuestasU);
            }
            Preguntas.find({actividad:config.mongodb.ObjectID(actividad)}, (error, result) => {
                if(!error) {
                    result.toArray(function(error, data) {
                        if(data.length > 0) {
                            var respuestas = [];
                            for(let i = 0; i < data.length; i++) {
                                let pregunta = data[i];
                                if(typeof respuestasU[pregunta._id] !== undefined) {
                                    console.log(pregunta._id);
                                }
                            }
                            res.json(data);
                        } else {
                            res.json({success: false, mensaje: 'No hay preguntas en la actividad'})
                        }
                    });
                    return;
                }
                res.json({
                    success: false,
                    mensaje: 'Ocurrio un error inesperado'
                })
            });
        } else {
            res.json({
                success: false,
                mensaje: 'Peticion mal formada'
            })
        }
    });

    return router;
};
