var socketIO = require('socket.io');
var uuid = require('node-uuid');
var crypto = require('crypto');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var redis = require("redis");

module.exports = function (server, config, params) {
    var username = params.database.username;
    var password = params.database.password;
    var servidor = params.database.servidor;
    var puerto = params.database.puerto;
    var database = params.database.database;
    var conexion = 'mongodb://' + username + ':' + password + '@' + servidor + ':' + puerto + '/' + database;
    var io = socketIO.listen(server);
    var redisdb = redis.createClient();

    MongoClient.connect(conexion, function (err, db) {
        if (err) {
            console.log(err);
        } else {
            var usuariosChats = db.collection('usuariosChats');
            io.sockets.on('connection', function (client) {
                var token = client.handshake.headers.cookie.split(';');
                for (var i = 0; i < token.length; i++) {
                    var cookie = token[i].trim().split('=');
                    if (cookie[0] === 'token') {
                        token = cookie[1];
                        break;
                    }
                }
                client.resources = {
                    screen: false,
                    video: true,
                    audio: false
                };
                client.on('message', function (details) {
                    if (!details)
                        return;
                    var otherClient = io.to(details.to);
                    if (!otherClient)
                        return;
                    details.from = client.id;
                    otherClient.emit('message', details);
                });
                client.on('shareScreen', function () {
                    client.resources.screen = true;
                });
                client.on('unshareScreen', function (type) {
                    client.resources.screen = false;
                    removeFeed('screen');
                });
                client.on('join', join);
                function removeFeed(type) {
                    if (client.room) {
                        io.sockets.in(client.room).emit('remove', {
                            id: client.id,
                            type: type
                        });
                        if (!type) {
                            client.leave(client.room);
                            client.room = undefined;
                        }
                    }
                }

                function join(name, cb) {
                    if (typeof name !== 'string')
                        return;
                    if (config.rooms && config.rooms.maxClients > 0 &&
                            clientsInRoom(name) >= config.rooms.maxClients) {
                        safeCb(cb)('full');
                        return;
                    }
                    //safeCb(cb)();
                    if (client.session === undefined) {
                        validarSession(function () {
                            validarChat(name, cb);
                        }, function () {
                            safeCb(cb)('Auth');
                        });
                    } else {
                        validarChat(name, cb);
                    }
                }
                function validarSession(success, error) {
                    redisdb.get(token, function (err, data) {
                        if (data === undefined || data === '[object Object]') {
                            client.disconnect();
                            safeCb(error)();
                        } else {
                            client.session = JSON.parse(data);
                            safeCb(success)();
                        }
                    });
                }
                function validarChat(name, cb) {
                    var session = client.session;
                    usuariosChats.find({usuario: session.usuario}, function (err, data) {
                        data.toArray(function (err, data) {
                            if (data.length > 0) {
                                data = data[0];
                                for (var i = 0; i < data.chats.length; i++) {
                                    if (data.chats[i].id === name) {
                                        removeFeed();
                                        safeCb(cb)(null, describeRoom(name));
                                        client.join(name);
                                        client.room = name;
                                        console.log('Login exitoso');
                                        return;
                                    }
                                }
                                console.log('error session');
                                safeCb(cb)('Auth');
                            } else {
                                safeCb(cb)('Auth');
                            }
                        });
                    });
                }
                client.on('disconnect', function () {
                    removeFeed();
                });
                client.on('leave', function () {
                    removeFeed();
                });
                client.on('create', function (name, cb) {
                    if (arguments.length === 2) {
                        cb = (typeof cb === 'function') ? cb : function () {};
                        name = name || uuid();
                    } else {
                        cb = name;
                        name = uuid();
                    }
                    var room = io.nsps['/'].adapter.rooms[name];
                    if (room && room.length) {
                        safeCb(cb)('taken');
                    } else {
                        join(name);
                        safeCb(cb)(null, name);
                    }
                });
                client.on('trace', function (data) {
                    console.log('trace', JSON.stringify([data.type, data.session, data.prefix, data.peer, data.time, data.value]));
                });
                client.emit('stunservers', config.stunservers || []);
                var credentials = [];
                var origin = client.handshake.headers.origin;
                if (!config.turnorigins || config.turnorigins.indexOf(origin) !== -1) {
                    config.turnservers.forEach(function (server) {
                        var hmac = crypto.createHmac('sha1', server.secret);
                        var username = Math.floor(new Date().getTime() / 1000) + (server.expiry || 86400) + "";
                        hmac.update(username);
                        credentials.push({
                            username: username,
                            credential: hmac.digest('base64'),
                            urls: server.urls || server.url
                        });
                    });
                }
                client.emit('turnservers', credentials);
            });
        }
    });

    function describeRoom(name) {
        var adapter = io.nsps['/'].adapter;
        var clients = adapter.rooms[name] || {};
        var result = { clients: {} };
        Object.keys(clients).forEach(function (id) {
            try {
                result.clients[id] = adapter.nsp.connected[id].resources;
            } catch(e) {
                console.log("Error inesperado", name, adapter.nsp.connected);
            }
        });
        return result;
    }

    function clientsInRoom(name) {
        return io.sockets.clients(name).length;
    }
};
function safeCb(cb) {
    if (typeof cb === 'function') {
        return cb;
    } else {
        return function () {};
    }
}
