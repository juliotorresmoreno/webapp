module.exports = function (config) {
    var express = require('express');
    var router = express.Router();
    var Usuarios = config.modelos.BaseModel(config, config.modelos.usuarios);
    var Relaciones = config.modelos.BaseModel(config, config.modelos.amistades);

    //console.log(Usuarios.getColeccion());

    var campos = {
        nombres: 1, apellidos: 1, leyenda:1,
        usuario: 1,
        email: 1, email_mostrar: 1, permiso_email: 1,
        sexo: 1, permiso_sexo: 1,
        ciudad_residencia: 1, permiso_ciudad_residencia: 1
    };
    router.get('/', function (req, res, next) {
        var query;
        if (req.query.query && req.baseUrl == '/api/v1/amigos') {
            query = new RegExp(req.query.query.replace(/\s+/gi, ' ').replace(' ', '|'));
            query = {
                usuario: {$ne: req.session.usuario},
                $or: [
                    {nombres: {$regex: query}},
                    {apellidos: {$regex: query}},
                    {email: {$regex: query}},
                    {usuario: {$regex: query}}
                ]
            };
            Usuarios.find(query, function (err, data) {
                data.count(function(error, total) {
                    data.toArray(function (error, resultado) {
                        //resultado = Usuarios.getData(resultado);
                        Usuarios.leftJoin({
                            datos: resultado,
                            alias: 'relacion',
                            campo: '_id',
                            tabla: 'amistades_' + req.session.usuario,
                            relacion: '_id',
                            callback: function (resultado) {
                                //for (var i = 0; i < resultado.length; i++) {
                                //    resultado[i] = Usuarios.getData(resultado[i]);
                                //}
                                res.json({success: true, data: resultado, total: total});
                            }
                        });
                    });
                });
            }, campos);
        } else {
            if (req.baseUrl == '/api/v1/solicitudes') {
                if (req.query.query) {
                    query = new RegExp(req.query.query.replace(/\s+/gi, ' ').replace(' ', '|'));
                    query = {
                        usuario: {$ne: req.session.usuario},
                        relacion: {$in: ['solicitado', 'solicitudes']},
                        $or: [
                            {nombres: {$regex: query}},
                            {apellidos: {$regex: query}},
                            {email: {$regex: query}},
                            {usuario: {$regex: query}}
                        ]
                    };
                } else {
                    query = {relacion: {$in: ['solicitado', 'solicitante']}};
                }
            } else {
                query = {};//{relacion: 'confirmado'};
            }
            Relaciones.setColeccion('amistades_' + req.session.usuario);
            Relaciones.find(query, function (err, data) {
                data.count(function(error, total) {
                    data.toArray(function (error, resultado) {
                        Relaciones.leftJoin({
                            datos: resultado,
                            alias: 'relacion',
                            campo: '_id',
                            tabla: 'usuarios',
                            relacion: '_id',
                            callback: function (resultado) {
                                res.json({success: true, data: resultado, total: total});
                            },
                            inverso: true,
                            campos: campos
                        });
                    });
                });
            });
        }
    });
    router.post('/agregar', function (req, res, next) {
        req.query = {usuario: req.body.usuario};
        Usuarios.find(req.query, function (err, data) {
            data.count(function (error, resultado) {
                
                if (resultado > 0) {
                    req.error = function (error) {
                        if ([1000, 1001].indexOf(error.code) >= 0) {
                            res.json(error.error);
                        } else {
                            res.json({success: false, error: error});
                        }
                    };

                    Relaciones.setColeccion('amistades_' + req.session.usuario);
                    Relaciones.find({_id: req.query.usuario, relacion: {$in: ['solicitante', 'confirmado']}}, function (err, data) {
                        data.count(function (err, resultado) {
                            if (resultado == 0) {
                                Relaciones.add({_id: req.query.usuario, relacion: 'solicitado'}, function () {
                                    Relaciones.setColeccion('amistades_' + req.query.usuario);
                                    Relaciones.add({_id: req.session.usuario, relacion: 'solicitante'}, function () {
                                        res.json({success: true, relacion: 'solicitado'});
                                    }, req.error);
                                }, req.error);
                            } else {
                                Relaciones.setColeccion('amistades_' + req.session.usuario);
                                Relaciones.update(req.query.usuario, {
                                    _id: req.query.usuario, 
                                    relacion: 'confirmado'
                                }, function (resultado) {
                                    Relaciones.setColeccion('amistades_' + req.query.usuario);
                                    Relaciones.update(req.session.usuario, {_id: req.session.usuario, relacion: 'confirmado'}, function () {
                                        res.json({success: true, relacion: 'confirmado'});
                                    }, req.error);
                                }, req.error);
                            }
                        });
                    });
                } else {
                    res.json({success: false, mensaje: 'El usuario especificado no existe.'});
                }
            });
        }, campos);
    });
    router.post('/cancelar', function (req, res, next) {
        req.query = {usuario: req.body.usuario};
        Usuarios.find(req.query, function (err, data) {
            data.toArray(function (error, resultado) {
                //resultado = Usuarios.getData(resultado);
                if (resultado.length > 0) {
                    req.error = function (error) {
                        if ([1000, 1001].indexOf(error.code) >= 0) {
                            res.json(error.error);
                        } else {
                            res.json({success: false, error: error});
                        }
                    };
                    Relaciones.setColeccion('amistades_' + req.session.usuario);
                    Relaciones.delete({_id: req.query.usuario, relacion: {$in: ['solicitado', 'solicitante']}}, function () {
                        Relaciones.setColeccion('amistades_' + req.query.usuario);
                        Relaciones.delete({_id: req.session.usuario, relacion: {$in: ['solicitado', 'solicitante']}}, function () {
                            res.json({success: true});
                        }, req.error);
                    }, req.error);
                } else {
                    res.json({success: false, mensaje: 'El usuario especificado no existe.'});
                }
            });
        }, campos);
    });
/*
    router.get('/:usuario', function (req, res, next) {
        var query  = {usuario: req.params.usuario};
        var campos = {_id: 1, apellidos: 1, nombres: 1, usuario: 1};
        Usuarios.find(query, ,function (err, data) {
            data.toArray(function (error, resultado) {
                resultado = Usuarios.getData(resultado);
                if (resultado.length > 0) {
                    res.json({success:true, data: resultado});
                } else {
                    res.json({success:false, mensaje: 'El usuario especificado no existe.'});
                }
            });
        }, campos);
    });*/
    return router;
};
