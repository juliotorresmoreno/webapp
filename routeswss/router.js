/* global request, resultado, global, process */

var getUrlParams = function (url) {
    if (url.indexOf('?') >= 0) {
        var params = url.substr(url.indexOf('?') + 1).toString().split('&');
        var r = {};
        for (var i = 0; i < params.length; i++) {
            var t = params[i].split('=');
            r[t[0]] = t[1];
        }
        return r;
    }
    return {};
};
var conexiones = {};
var wssEvents = { open: [], message: [], close: [] };
module.exports = {
    getWSSEvents: function() { return wssEvents; },
    getConexiones: function() { return conexiones; },
    manejador: function (app, config) {
        var auth = require(global.dirname + '/controllersws/auth')(config);
        var mensajes = require(global.dirname + '/controllersws/mensajes')(config);
        var amigos = require(global.dirname + '/controllersws/amigos')(config);

        var res = function (request) {
            //var connection = request.origin === 'file://' ? request.accept() : request.accept('echo-protocol', request.origin);
            var connection = request.accept();
            var params = getUrlParams(request.httpRequest.url);
            if (params.token) {
                config.redisdb.get(params.token, function (err, data) {
                    if (data !== undefined && data !== '[object Object]') {
                        data = JSON.parse(data);
                        connection.session = data;
                        data.token = params.token;
                        if (conexiones[data.usuario] === undefined) {
                            conexiones[data.usuario] = data;
                        }
                        if (conexiones[data.usuario].conexiones === undefined) {
                            conexiones[data.usuario].conexiones = [];
                        }
                        conexiones[data.usuario].conexiones.push(connection);
                    } else {
                        connection.close();
                        console.log(new Date() + ': Conexion rechazada');
                        return;
                    }
                });
            } else {
                connection.close();
                console.log(new Date() + ': Conexion rechazada');
                return;
            }
            connection.on('close', function (reasonCode, description) {
                if(wssEvents.close) {
                    for(var i = 0; i < wssEvents.close.length; i++) {
                        wssEvents.close[i](connection, reasonCode, description);
                    }
                }
            });
            connection.enviar = function (data) {
                var dataF = JSON.stringify(data);
                this.sendUTF(dataF);
            };
            connection.on('message', function (message) {
                if (connection.hasOwnProperty('session')) {
                    if (message.type === 'utf8') {
                        var request = JSON.parse(message.utf8Data);
                        if (!request.data) {
                            request.data = {};
                        }
                        request.data.session = connection.session;
                        switch (request.peticion) {
                            case 'videollamada':
                            case 'llamada':
                                process.send({
                                    success: true,
                                    peticion: request.peticion,
                                    session: request.data.usuario,
                                    usuario: request.data.session.usuario,
                                    accion: request.data.accion
                                });
                                break;
                        }
                        console.log(new Date() + ': ' + request.peticion);
                    }
                } else {
                    console.log(new Date() + ': Conexion cerrada');
                    connection.close();
                }
            });
            console.log(new Date() + ': Conexion aceptada');
        };
        return res;
    }
};