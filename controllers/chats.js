"use strict";
/* global data, process */

module.exports = function (config) { 
    var router = config.express.Router();
    var params = config, requests = {}, conected = {};
    var usuariosChats = config.modelos.BaseModel(config);
    usuariosChats.setModelo(config.modelos.usuariosChats);
    usuariosChats.setColeccion('usuariosChats');
    var chats = config.modelos.BaseModel(config);
    chats.setModelo(config.modelos.chats);
    params.coleccion = 'usuarios';
    params.modelo = config.modelos.usuarios;
    var Relaciones = config.modelos.BaseModel(config);
    Relaciones.setModelo(config.modelos.amistades);
    var campos = {nombres: 1, apellidos: 1, leyenda: 1, usuario: 1};
    var listarAmigos = function (session, fn) {
        var query = {relacion: 'confirmado'};
        Relaciones.setColeccion('amistades_' + session.usuario);
        Relaciones.find(query, function (err, data) {
            data.count(function (error, total) {
                data.toArray(function (error, resultado) {
                    Relaciones.leftJoin({
                        datos: resultado,
                        alias: 'relacion',
                        campo: '_id',
                        tabla: 'usuarios',
                        relacion: '_id',
                        callback: function (resultado) {
                            if (Object.prototype.toString.call(fn)) {
                                fn(null, resultado);
                            }
                        },
                        inverso: true,
                        campos: campos
                    });
                });
            });
        });
    };
    config.getWSSEvents().close.push(function (connection, reasonCode, description) {
        var conexiones = params.getConexiones();
        var usuario = connection.session.usuario;
        var request = params.mongodb.ObjectID().toString();
        console.log(new Date() + ': Conexion cerrada');
        if (connection.hasOwnProperty(usuario) && conexiones.hasOwnProperty(usuario)) {
            if (conexiones[usuario].hasOwnProperty('conexiones')) {
                conexiones[usuario].conexiones.splice(conexiones[usuario].conexiones.indexOf(connection));
                if (conexiones[usuario].conexiones.length === 0) {
                    delete conexiones[usuario];
                } else {
                    return;
                }
            }
        }
        conected[request] = {
            usuario: usuario,
            estados: [false]
        };
        console.log(new Date() + ': Verificar conexiones cerradas');
        if (!conexiones.hasOwnProperty(usuario)) {
            process.send({
                success: true,
                peticion: 'conexionCerrada',
                usuario: usuario,
                request: request,
                question: true
            });
        }
    });
    var listarAmigosConectados = function (usuario, conectado, response) {
        listarAmigos({usuario: usuario}, function (err, resultado) {
            var conectados = [];
            var conexiones = params.getConexiones();
            var nconectados = [];
            var request = params.mongodb.ObjectID().toString();
            for (var i = 0; i < resultado.length; i++) { 
                if (conexiones.hasOwnProperty(resultado[i].usuario) && 
                    conexiones[resultado[i].usuario].hasOwnProperty('conexiones')) {
                    let wusuario = conexiones[resultado[i].usuario];
                    resultado[i].conectado = true;
                    conectados.push(resultado[i]);
                    for (var j = 0; j < wusuario.conexiones.length; j++) {
                        wusuario.conexiones[j].enviar({
                            success: true,
                            peticion: 'amigoConectado',
                            usuario: usuario
                        });
                    }
                } else {
                    resultado[i].conectado = false;
                    nconectados.push(resultado[i]);
                }
            }
            if (nconectados.length > 0 && config.numCPUs > 1) {
                requests[request] = {
                    response: response,
                    amigos: resultado,
                    conectados: [conectados]
                };
                process.send({
                    success: true,
                    peticion: 'listarConectados',
                    usuarios: nconectados,
                    conectado: conectado,
                    usuario: usuario,
                    question: true,
                    request: request
                });
            } else {
                if (response) {
                    response.json({success: true, data: resultado, total: resultado.length});
                }
            }
        });
    };
    router.get('/amigos', function (req, res, next) {
        listarAmigosConectados(req.session.usuario, true, res);
    });
    router.post('/videollamada', function (req, res, next) {
        if (req.body.usuario) {
            process.send({
                success: true,
                peticion: 'videollamada',
                usuario: req.body.usuario,
                solicita: req.session.usuario,
                accion: req.body.accion
            });
            res.json({success: true});
        } else {
            res.json({success: false, error: 'Falto el usuario de destino'});
        }
    });
    router.post('/mensaje', function (req, res, next) {
        var destino = req.body.usuario;
        var usuario = req.session.usuario;
        var _usuarios = [];
        var session = req.session;
        var mensaje = req.body.mensaje;
        var tipo = req.body.tipo;

        var _mensaje = {
            mensaje: mensaje,
            usuario: usuario,
            fecha: Date.now()
        };
        var id = 'chat' + config.mongodb.ObjectID();
        _usuarios.push(usuario);
        if (tipo === 'usuario') {
            _usuarios.push(destino);
        }
        var registrarMensaje = function (usuario, registrar) {
            usuariosChats.find({usuario: usuario}, function (err, data) {
                data.toArray(function (error, dato) {
                    if (dato.length === 0) {
                        var userChat = {
                            _id: usuario,
                            usuario: usuario,
                            extra: {
                                usuario: session.usuario,
                                nombres: session.nombres,
                                apellidos: session.apellidos
                            },
                            chats: [{id: id, usuarios: _usuarios}]
                        };
                        usuariosChats.add(userChat);
                    } else {
                        var encontrado = false;
                        dato = dato[0];
                        for (var i = 0; i < dato.chats.length; i++) {
                            if (tipo === 'usuario') {
                                if (dato.chats[i].usuarios.length === 2 &&
                                        dato.chats[i].usuarios.indexOf(_usuarios[0]) >= 0 &&
                                        dato.chats[i].usuarios.indexOf(_usuarios[1]) >= 0) {
                                    id = dato.chats[i].id;
                                    encontrado = true;
                                    break;
                                }
                            }
                        }
                        if (encontrado === false) {
                            dato.chats.push({id: id, usuarios: _usuarios});
                            usuariosChats.update(usuario, dato);
                        }
                    }
                    if (registrar) {
                        chats.setColeccion(id);
                        chats.add(_mensaje);
                    }
                });
            });
        };
        registrarMensaje(usuario, true);
        registrarMensaje(destino);
        process.send({
            success: true,
            peticion: 'mensaje',
            session: _usuarios[0],
            usuarios: _usuarios,
            data: _mensaje
        });
        process.send({
            success: true,
            peticion: 'mensaje',
            session: _usuarios[1],
            usuarios: _usuarios,
            data: _mensaje
        });
        res.json({success: true});
    });
    router.get('/:usuario', function (req, res, next) {
        var usuario = req.session.usuario;
        var destino = req.params.usuario;
        var _usuarios = [usuario, destino];
        usuariosChats.find({usuario: usuario}, function (err, data) {
            data.toArray(function (error, dato) {
                var a, b, c;
                if (dato.length > 0) {
                    dato = dato[0];
                    for (var i = 0; i < dato.chats.length & !(a && b && c); i++) {
                        a = dato.chats[i].usuarios.length === 2;
                        b = dato.chats[i].usuarios.indexOf(_usuarios[0]) >= 0;
                        c = dato.chats[i].usuarios.indexOf(_usuarios[1]) >= 0;
                        if (a && b && c) {
                            var id = dato.chats[i].id;
                            chats.setColeccion(id);
                            chats.find(function (error, data) {
                                data.toArray(function (error, dato) {
                                    res.json({success: true, data: dato, chatid: id});
                                });
                            });
                            return;
                        }
                    }
                    res.json({success: false, error: 'Usuario no encontrado'});
                } else {
                    res.json({success: true, data: []});
                }
            });
        });
    });
    process.on('message', function (params) {
        var conexiones = config.getConexiones();
        switch (params.peticion) {
            case 'videollamada':
                if (conexiones.hasOwnProperty(params.usuario) && conexiones[params.usuario].hasOwnProperty('conexiones')) {
                    if (params.solicita !== undefined) {
                        for (var i = 0; i < conexiones[params.usuario].conexiones.length; i++) {
                            conexiones[params.usuario].conexiones[i].enviar({
                                peticion: params.peticion,
                                usuario: params.solicita,
                                accion: params.accion
                            });
                        }
                    }
                }
                break;
            case 'mensaje': case 'mensajeCurso':
                var session = params.session;
                delete params.session;
                var usuario = session;
                if (conexiones.hasOwnProperty(usuario) && conexiones[usuario].hasOwnProperty('conexiones')) {
                    for (var i = 0; i < conexiones[usuario].conexiones.length; i++) {
                        conexiones[usuario].conexiones[i].enviar(params);
                    }
                }
                break;
            case 'listarConectados':
                var conectados = [];
                for (var i = 0; i < params.usuarios.length; i++) {
                    if (conexiones.hasOwnProperty(params.usuarios[i].usuario)) {
                        conectados.push(params.usuarios[i]);
                        for (var j = 0; j < conexiones[params.usuarios[i].usuario].conexiones.length; j++) {
                            conexiones[params.usuarios[i].usuario].conexiones[j].enviar({
                                success: true,
                                peticion: params.conectado ? 'amigoConectado' : 'amigoDesconectado',
                                usuario: params.usuario
                            });
                        }
                    }
                }
                if (params.conectado) {
                    process.send({
                        success: true,
                        id: params.id,
                        peticion: 'listarConectadosResponse',
                        usuarios: conectados,
                        response: true,
                        request: params.request
                    });
                }
                break;
            case 'listarConectadosResponse':
                if (requests.hasOwnProperty(params.request)) {
                    requests[params.request].conectados.push(params.usuarios);
                    if (requests[params.request].conectados.length === config.numCPUs) {
                        for (var i = 0; i < requests[params.request].amigos.length; i++) {
                            requests[params.request].amigos[i].conectado = false;
                            busqueda:
                            for (var j = 0; j < requests[params.request].conectados.length; j++) {
                                for (var k = 0; k < requests[params.request].conectados[j].length; k++) {
                                    if (requests[params.request].amigos[i].usuario === requests[params.request].conectados[j][k].usuario) {
                                        requests[params.request].amigos[i].conectado = true;
                                        break busqueda;
                                    }
                                }
                            }
                        }
                        if (requests[params.request].response) {
                            requests[params.request].response.send({
                                success: true,
                                data: requests[params.request].amigos,
                                total: requests[params.request].amigos.length
                            });
                        }
                        delete requests[params.request];
                    }
                }
                break;
            case 'conexionCerrada':
                var conectado = conexiones.hasOwnProperty(usuario) &&
                                conexiones[usuario].hasOwnProperty('conexiones') &&
                                conexiones[usuario].conexiones.length > 0;
                console.log(new Date() + ': Estado de conexion:' (conectado ? '': 'NO') + 'conectado');
                process.send({
                    success: true,
                    id: params.id,
                    peticion: 'conexionCerradaResponse',
                    usuario: params.usuario,
                    conectado: conectado,
                    request: params.request,
                    response: true
                });
                break;
            case 'conexionCerradaResponse':
                if (conected.hasOwnProperty(params.request)) {
                    conected[params.request].estados.push(params.conectado);
                    if (conected[params.request].estados.length === config.numCPUs) {
                        for (var i = 0; i < conected[params.request].estados.length; i++) {
                            if (conected[params.request].estados[i]) {
                                delete conected[params.request];
                                return;
                            }
                        }
                        listarAmigosConectados(params.usuario, false);
                        delete conected[params.request];
                    }
                }
                break;
        }
    });
    return router;
};

