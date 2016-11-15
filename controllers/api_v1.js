module.exports = function (config) {
    router = config.express.Router();
    api = {};
    api.perfil = require(config.location + '/controllers/perfil')(config, api);
    api.amigos = require(config.location + '/controllers/amigos')(config, api);
    api.galerias = require(config.location + '/controllers/galerias')(config, api);
    api.mensajes = require(config.location + '/controllers/mensajes')(config, api);
    api.noticias = require(config.location + '/controllers/noticias')(config, api);
    api.cursos = require(config.location + '/controllers/cursos')(config, api);
    api.chats = require(config.location + '/controllers/chats')(config, api);

    router.use('/perfil', api.perfil);
    router.use('/amigos', api.amigos);
    router.use('/solicitudes', api.amigos);
    router.use('/galerias', api.galerias);
    router.use('/mensajes', api.mensajes);
    router.use('/noticias', api.noticias);
    router.use('/cursos', api.cursos);
    router.use('/chats', api.chats);

    router.use('*', function (req, res) {
        res.send({success:false,error:'Recurso no encontrado'});
    });
    return router;
};