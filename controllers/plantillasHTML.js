var fs = require('fs');

module.exports = function (params) {
    var router = params.express.Router();
    var responder = function (req, res, next, url) {
        params.fs.readFile(url, 'utf8', function (err, data) {
            (!err) ? res.end(params.renderizar(data)) : res.end();
        });
    };
    router.get('/layout', function (req, res, next) {
        responder(req, res, next, './views/plantillas/layout-navbar.html');
    });
    router.get('/:page', function (req, res, next) {
        var file = './views/plantillas/' + req.params.page + '.html';
        fs.exists(file, function(existe) {
            if(existe) {
                responder(req, res, next, './views/plantillas/' + req.params.page + '.html');
            } else {
                res.json({success:false, error:'No encontrado'});
            }
        });
    });
    return router;
};
