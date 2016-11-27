module.exports = function (config) {
    var router = config.express.Router();
    var Mensajes = config.modelos.BaseModel(config);
    Mensajes.setModelo(config.modelos.mensajes);
    router.post('/enviar', function (req, res, next) {
        var destinatarios = typeof req.body.destinatarios === 'string' ? 
                                   JSON.stringify(req.body.destinatarios): 
                                   req.body.destinatarios;
        var mensaje = {
            remitente: {
                usuario:req.session.usuario,
                nombres:req.session.nombres,
                apellidos:req.session.apellidos
            },
            destinatarios: destinatarios,
            asunto: req.body.asunto,
            contenido: req.body.contenido,
            fecha: Date.now()
        };
        Mensajes.setColeccion('mensajes_' + req.session.usuario);
        Mensajes.add(mensaje, function () {
            for(var i = 0; i < mensaje.destinatarios.length; i++) {
                Mensajes.setColeccion('mensajes_' + mensaje.destinatarios[i].usuario);
                Mensajes.add(mensaje, undefined, req.error, true);
            }
            res.json({success: true});
        }, req.error);
    });
    var bandeja = function(req, res, next) {
        Mensajes.setColeccion('mensajes_' + req.session.usuario);
        Mensajes.find(req.filtro, function (err, data) {
            data.count(function(error, total) {
                var limite, pagina;
                limite = req.query.limite && !isNaN(req.query.limite) ? req.query.limite: (config.mensajes && !isNaN(config.mensajes.limite) ? config.mensajes.limite: 50);
                pagina = req.query.pagina && !isNaN(req.query.pagina) ? req.query.pagina: 1;
                data.skip(limite * (pagina-1));
                data.limit(limite);
                data.sort({ fecha: -1 });
                data.toArray(function (error, resultado) {
                    res.json({
                        success: true, 
                        data: resultado,
                        total: total,
                        limite: limite,
                        recordsTotal: total,
                        recordsFiltered: total
                    });
                });
            });
        });
    };
    router.get('/', function(req, res, next) {
        req.filtro = { 
            $where: "this.remitente.usuario!='" + req.session.usuario + "'", 
            estado: { $ne: 'eliminado' } 
        };
        bandeja(req, res, next);
    });
    router.get('/salida', function(req, res, next) {
        req.filtro = { 
            $where: "this.remitente.usuario=='" + req.session.usuario + "'", 
            estado: { $ne: 'eliminado' } 
        };
        bandeja(req, res, next);
    });
    router.get('/papelera', function(req, res, next) {
        req.filtro = { estado: 'eliminado' };
        bandeja(req, res, next);
    });
    router.get('/mensaje/:mensaje', function(req, res, next) {
        req.filtro = { _id: config.mongodb.ObjectID(req.params.mensaje) };
        bandeja(req, res, next);
    });
    router.post('/eliminar', function(req, res, next) {
        var IDs = JSON.parse(req.body.id);
        Mensajes.setColeccion('mensajes_' + req.session.usuario);
        if(req.body.definitivo === 'true') {
            for(var i = 0; i < IDs.length; i++) {
                Mensajes.delete({_id: config.mongodb.ObjectID(IDs[i])});
            }
        } else {
            for(var i = 0; i < IDs.length; i++) {
                Mensajes.update({_id: config.mongodb.ObjectID(IDs[i])}, {estado: 'eliminado'}, undefined, undefined, true);
            }
        }
        res.json({success: true});
    });
    router.post('/restaurar', function(req, res, next) {
        var IDs = JSON.parse(req.body.id);
        Mensajes.setColeccion('mensajes_' + req.session.usuario);
        for(var i = 0; i < IDs.length; i++) {
            Mensajes.update({_id: config.mongodb.ObjectID(IDs[i])}, {estado: undefined}, undefined, undefined, true);
        }
        res.json({success: true});
    });
    return router;
};