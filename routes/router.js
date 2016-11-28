module.exports = function (params) {
    var express = require('express');
    var router = express.Router();
    var fs = require('fs');
    var rnd = parseInt(Math.random() * 89999) + 10000;
    var root = fs.readFileSync('./views/index.html').toString();
    var bodyParser = require('body-parser');
    var cookieParser = require('cookie-parser');
    var logger = require('morgan');
    var path = require('path');
        
    router.use(logger('dev'));
    router.use(bodyParser.json({limit: '50mb'}));
    router.use(bodyParser.urlencoded({extended: false, limit: '50mb'}));
    router.use(cookieParser());
    router.use(express.static(path.join(global.dirname, 'public')));
    router.use('/js', express.static(path.join(global.dirname, 'bower_components')));
    router.use('/js/helper', express.static(path.join(global.dirname, 'helper')));
    router.use('/js/application', express.static(path.join(global.dirname, 'application')));
    router.use('/plantillasHTML', express.static(path.join(global.dirname, 'views/plantillas')));
    router.use('/plantillasHTML', function(req, res) {
        res.redirect('/plantillasHTML/404.html');
    });

    router.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Cache-Control");

        req.error = function (error) {
            if ([1000, 1001].indexOf(error.code) >= 0) {
                res.json(error.error);
            } else {
                res.json({success: false, error: error});
            }
        };
        var token = req.cookies !== undefined && req.cookies.token ? req.cookies.token : req.query.token;
        req.body = req.body || {};
        if (token) {
            params.redisdb.get(token, function (err, data) {
                if (data !== undefined && data !== '[object Object]') {
                    data.token = token;
                    req.session = JSON.parse(data);
                    req.session.token = token;
                    res.cookie('token', token);
                }
                next();
            });
        } else {
            next();
        }
    });

    router.use('/js/bootstrap.js', function (req, res) {
        var bootstrap = fs.readFileSync('./helper/bootstrap.js').toString();
        var protocol = req.connection.encrypted ? 'https' : 'http';
        var js = bootstrap.replace('/*{{servidor}};*/', 'var servidor = "' + protocol + '://' + req.headers.host + '";');
        res.setHeader("Content-Type", "text/javascript");
        delete req.headers['if-none-match'];

        if (req.session !== undefined) {
            res.send(js.replace('/*{{session}};*/', 'var session = ' + JSON.stringify(req.session) + ';'));
        } else {
            res.send(js.replace('/*{{session}};*/', ''));
        }
    });

    var routers = [
        {controller: 'modelos', ruta: '/modelos', proteger: false},
        {controller: 'auth', ruta: '/api/v1/auth', proteger: false},
        {controller: 'api_v1', ruta: '/api/v1', proteger: true}
    ];
    var proteger = function (req, res, next) {
        if (req.session === undefined) {
            res.json({success: false, mensaje: 'Autenticacion fallida'});
        } else {
            next();
        }
    };

    for (var i = 0; i < routers.length; i++) {
        try {
            routers[i].compile = require(global.dirname + '/controllers/' + routers[i].controller)(params);
            if (routers[i].proteger) {
                router.use(routers[i].ruta, proteger, routers[i].compile);
            } else {
                router.use(routers[i].ruta, routers[i].compile);
            }
        } catch (e) {
            console.log(e);
            continue;
        }
    }
    router.get('/chats/:usuario/external', function (req, res, next) {
        var chat = fs.readFileSync('./views/chat.html').toString();
        res.send(chat);
    });
    router.get('/chats/:usuario/external/:media', function (req, res, next) {
        var chat = fs.readFileSync('./views/chat.html').toString();
        res.send(chat);
    });
    router.get('*', function (req, res, next) {
        res.setHeader('Etag', 'W/"1499c-1504' + rnd);
        params.fs.stat('./views/index.html', function (erro, attr) {
            res.setHeader('Etag', attr.mtime);
            if(req.headers['if-none-match'] == attr.mtime) {
                res.status(304).end();
            } else {
                root = fs.readFileSync('./views/index.html').toString();
                res.send(params.renderizar(root));
            }
        });
    });
    return router;
};
