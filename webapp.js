#!/usr/bin/env node

/* global __dirname, process, global */
 
var cluster = require('cluster');
var fs = require('fs');
var config = require(__dirname + '/config/config.json');
global.dirname = __dirname;
config.numCPUs = config.numCPUs === undefined ? require('os').cpus().length : config.numCPUs;

if (cluster.isMaster) {
    function createWorker(pos) {
        var worker = cluster.fork();
        worker.send({tipo: 'http'});
        worker.on('message', function (data) {
            if (data.response) {
                clusters[data.id].send(data);
            } else {
                if (data.question) {
                    data.id = pos;
                }
                for (var i = 0; i < clusters.length; i++) {
                    if ((data.question && i !== pos) || !data.question) {
                        clusters[i].send(data);
                    }
                }
            }
        });
        return worker;
    }
    var clusters = [];
    if (config.uid) {
        process.setuid(config.uid);
    }
    for (var i = 0; i < config.numCPUs; i++) {
        clusters.push(createWorker(i));
    }
    cluster.on('exit', function (worker, code, signal) {
        if (config.enviroment === "produccion") {
            for (var i = 0; i < clusters.length; i++) {
                if (clusters[i] === worker) {
                    clusters[i] = createWorker(i);
                    break;
                }
            }
        }
    });
    cluster.fork().send({tipo: 'señales'});
}

if (cluster.isWorker) {
    process.on('message', function (params) {
        switch (params.tipo) {
            case 'http':
                var servidorHTTP = require(__dirname + '/lib/servidorHTTP');
                servidorHTTP.start(config);
                break;
            case 'señales':
                var signalmaster = require(__dirname + '/lib/servidorSenales');
                signalmaster.start(config);
                break;
        }
    });
}
