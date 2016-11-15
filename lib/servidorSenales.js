/*global console*/
var yetify = require('yetify');
var fs = require('fs');
var sockets = require('./sockets');
var config = require(global.dirname + '/config/config.json');
var port = config.senales.server.port;
var server_handler = function (req, res) {
    res.writeHead(404);
    res.end();
};
var certificados = {
    key: fs.readFileSync(config.certificados.key),
    cert: fs.readFileSync(config.certificados.cert)
};
module.exports = { 
    start: function (params) {
        var server = null;
        if (config.senales.server.secure) {
            server = require('https').Server(certificados, server_handler);
        } else {
            server = require('http').Server(server_handler);
        }
        server.listen(port);
        sockets(server, config.senales, params);
        if (config.senales.uid) {
            process.setuid(config.senales.uid);
        }
        var httpUrl = "http" + (config.senales.server.secure ? 's' : '') + "://" + config.servidor + ":" + port;
        console.log(yetify.logo() + ' -- signal master is running at: ' + httpUrl);
    }
};