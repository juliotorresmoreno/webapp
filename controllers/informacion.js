module.exports = function (config) {
    var router = config.express.Router();
    router.get('/proyecto', function (req, res, next) {
        config.fs.readFile('./views/extra/proyecto.html', 'utf8', function (err, data) {
            !err ? res.send(config.renderizar(data)) : res.end();
        });
    });
    router.get('/about', function (req, res, next) {
        res.send('nada');
    });
    return router;
};
