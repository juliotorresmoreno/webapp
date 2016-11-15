module.exports = function (config) {
    var params = config;
    params.coleccion = 'usuarios';
    params.modelo = config.modelos.usuarios;
    var usuariosChats = config.modelos.BaseModel(config);
    usuariosChats.setModelo(config.modelos.usuariosChats);
    usuariosChats.setColeccion('usuariosChats');

    var chats = config.modelos.BaseModel(config);
    chats.setModelo(config.modelos.chats);

    var app = {
        enviar: function (data, fn) {
            var _usuarios = [];
            var usuario = data.session.usuario;
            var session = data.session;
            var destino = data.destino.usuario;
            var mensaje = data.mensaje;
            var tipo = data.destino.tipo;
            var _mensaje = {
                mensaje: mensaje,
                usuario: usuario,
                fecha: new Date()
            };
            var id = 'chat' + config.mongodb.ObjectID();
            _usuarios.push(usuario);
            if (data.destino.tipo === 'usuario') {
                _usuarios.push(destino);
            }
            var registrarMensaje = function (usuario, registrar) {
                usuariosChats.find({usuario: usuario}, function (err, data) {
                    data.toArray(function (error, dato) {
                        chats.setColeccion(id);
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
                                usuariosChats.update(id, dato);
                            }
                        }
                        if (registrar) {
//                            chats.add(_mensaje);
                        }
                    });
                });
            };
            //console.log(data);
//            registrarMensaje(usuario, true);
//            registrarMensaje(destino);

            if (tipo === 'usuario') {
                process.send({
                    success: true,
                    peticion: 'mensaje',
                    session: _usuarios[0],
                    usuarios: _usuarios,
                    data: mensaje
                });
                process.send({
                    success: true,
                    peticion: 'mensaje',
                    session: _usuarios[1],
                    usuarios: _usuarios,
                    data: mensaje
                });
            }

        },
        listarMensajes: function (data, fn) {
            var usuario = data.session.usuario;
            var destino = data.usuario;
            var tipo = data.tipo;
            var _usuarios = [usuario, destino];
            usuariosChats.find({usuario: usuario}, function (err, data) {
                data.toArray(function (error, dato) {
                    if (dato.length > 0) {
                        dato = dato[0];
                        for (var i = 0; i < dato.chats.length; i++) {
                            if (tipo === 'usuario') {
                                var a = dato.chats[i].usuarios.length === 2;
                                var b = dato.chats[i].usuarios.indexOf(_usuarios[0]) >= 0;
                                var c = dato.chats[i].usuarios.indexOf(_usuarios[1]) >= 0;
                                if (a && b && c) {
                                    var id = dato.chats[i].id;
                                    chats.setColeccion(id);
                                    chats.find(function (error, data) {
                                        data.toArray(function (error, dato) {
                                            fn(null, {id: id, data: dato});
                                        });
                                    });
                                    return;
                                }
                            }
                        }
                    } else {
                        fn(null, {id: usuario, data: []});
                    }
                });
            });
        }
    };
    return app;
};