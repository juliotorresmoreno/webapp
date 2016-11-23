/* global __dirname, fs, global */

module.exports = {
    start: function (config) {
        var fs = require('fs');
        var https = require('https');
        var redis = require("redis");
        var mongodb = require('mongodb');
        var express = require('express');
        var MongoClient = mongodb.MongoClient;
        var path = require('path');
        var app = express();
        var options = {
            key: fs.readFileSync(config.certificados.key),
            cert: fs.readFileSync(config.certificados.cert)
        };
        var vhost = require('vhost');

        app.set('views', path.join(global.dirname, 'views'));
        //app.set('view options', {layout: false});
        app.set('view engine', 'jade');
        
        app.use('/cache.appcache', function (req, res, next) {
            res.setHeader('Content-Type', 'text/cache-manifest');
            next();
        });
        
        var serverHTTP = express();
        serverHTTP.use(function (req, res) {
            res.redirect('https://' + config.servidor + ':' + config.puertos.https + req.url);
        });
        var serverHTTPS = https.createServer(options, app);
        serverHTTP.on('listening', function () {
            console.log(new Date() + ': HTTP Server online');
        });

        var username = config.database.username;
        var password = config.database.password;
        var servidor = config.database.servidor;
        var puerto = config.database.puerto;
        var database = config.database.database;
        var conexion = 'mongodb://' + username + ':' + password + '@' + servidor + ':' + puerto + '/' + database;

        MongoClient.connect(conexion, function (err, db) {
            if (err) {
                console.log(err);
            } else {
                var router = require(global.dirname + '/routes/router');
                var routerwss = require(global.dirname + '/routeswss/router');
                var redisdb = redis.createClient();
                var validator = require(global.dirname + '/bower_components/validator/validator.min');
                var md5 = require("MD5");
                var WebSocketServer = require('websocket').server;
                var wsServerS = new WebSocketServer({
                    httpServer: serverHTTPS,
                    autoAcceptConnections: false
                });
                db.ObjectID = mongodb.ObjectID;
                config.database.conexion = db;
                config.location = global.dirname;
                config.express = express;
                config.fs = fs;
                config.renderizar = function (html) {
                    return html.replace(/\s+/gi, ' ').replace(/> /gi, '>').replace(/< /gi, '<');
                };
                config.randomize = function (a, b) {
                    return Math.round(Math.random() * (b - a) + parseInt(a));
                };
                config.modelos = {
                    usuario: require(global.dirname + '/modelos/usuario.json'),
                    usuarios: require(global.dirname + '/modelos/usuarios.json'),
                    galerias: require(global.dirname + '/modelos/galerias.json'),
                    amistades: require(global.dirname + '/modelos/amistades.json'),
                    mensajes: require(global.dirname + '/modelos/mensajes.json'),
                    noticias: require(global.dirname + '/modelos/noticias.json'),
                    cursos: require(global.dirname + '/modelos/cursos.json'),
                    usuariosChats: require(global.dirname + '/modelos/usuariosChats.json'),
                    cursosEstudiantes: require(global.dirname + '/modelos/cursosEstudiantes.json'),
                    chats: require(global.dirname + '/modelos/chats.json'),
                    contenidos: require(global.dirname + '/modelos/contenidos.json'),
                    actividades: require(global.dirname + '/modelos/actividades.json'),
                    preguntas: require(global.dirname + '/modelos/preguntas.json'),
                    BaseModel: require(global.dirname + '/modelos/BaseModel')
                };
                config.mongodb = config.database.conexion;
                config.redisdb = redisdb;
                config.validator = validator;
                config.validador = require(global.dirname + '/helper/validador.js')(validator, md5);
                config.md5 = md5;
                config.routerwss = routerwss;
                config.getConexiones = routerwss.getConexiones;
                config.getWSSEvents = routerwss.getWSSEvents;
 
                app.use(router(config));
                serverHTTP.listen(config.puertos.http);
                serverHTTPS.listen(config.puertos.https);
                wsServerS.on('request', routerwss.manejador(app, config));
            }
        });
    }
};