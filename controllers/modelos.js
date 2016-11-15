module.exports = function (config) {
    var router = config.express.Router();
    router.get('/:modelo', function (req, res, next) {
        config.fs.readFile('./modelos/' + req.params.modelo + '.json', 'utf8', function (err, data) {
            if (!err) {
                res.setHeader("Content-Type", "application/json");
                res.send(config.renderizar(data))
            } else
                res.end();
        });
    });
    return router;
};
