module.exports = function (config, api) {
    var router = config.express.Router();
    var Noticias = config.modelos.BaseModel(config);
    Noticias.setModelo(config.modelos.noticias);
    var Relaciones = config.modelos.BaseModel(config);
    Relaciones.setModelo(config.modelos.amistades);
    var FechaLimite = '2015';
    var obtenerMes = function(fecha) {
        return fecha.getFullYear() + '_' + (fecha.getMonth() < 9 ? '0': '') + (fecha.getMonth() + 1);
    };
    var noticias = function(config, fn, previo) {
        Noticias.setColeccion('noticias_' + config.contenedor);
        Noticias.find(config.filtro, function (err, data) {
            data.skip(config.limite*(config.pagina-1));
            data.limit(config.limite);
            data.sort({ fecha: -1 });
            data.toArray(function(error, resultado) {
                if(resultado.length === config.limite) {
                    fn(error, previo != undefined ? previo.concat(resultado): resultado);
                } else {
                    config.contenedor = config.contenedor.split('_');
                    if(config.contenedor[1] === '01') {
                        config.contenedor[0] = parseInt(config.contenedor[0]) -1;
                        config.contenedor[1] = 12;
                    } else {
                        config.contenedor[1] = parseInt(config.contenedor[1]) -1;
                        if(config.contenedor[1] <= 9)
                            config.contenedor[1] = '0' + config.contenedor[1];
                    }
                    config.contenedor = config.contenedor.join('_');
                    if(FechaLimite >= config.contenedor) {
                        fn(error, previo != undefined ? previo.concat(resultado): resultado);
                    } else {
                        noticias(config, fn, previo != undefined ? previo.concat(resultado): resultado);
                    }
                }
            });
        });
    };
    router.get('/', function (req, res, next) {
        var pagina, limite;
        limite = config.limite && !isNaN(config.limite) ? parseInt(config.limite): config.limite;
        pagina = config.pagina && !isNaN(config.pagina) ? parseInt(config.pagina): 1;
        Relaciones.setColeccion('amistades_' + req.session.usuario);
        Relaciones.find({relacion: 'confirmado'}, function (err, data) {
            data.toArray(function (error, resultado) {
                var usuarios = [];
                for(var i = 0; i < resultado.length; i++) {
                    usuarios.push(resultado[i]._id);
                }
                var filtro = {
                    $where: 'this.usuario.usuario=="' + req.session.usuario + '" || (' + 
                            JSON.stringify(usuarios) + '.indexOf(this.usuario.usuario) >= 0 && ' +
                            '["friends", "public"].indexOf(this.permiso) >= 0' +
                            ')'
                };
                if(req.query.minimo) {
                    var contenedor = new Date(parseInt(req.query.minimo));
                    filtro.fecha = {$gte: contenedor};
                } else {
                    var contenedor = new Date();
                }
                noticias({ 
                    limite: limite, 
                    pagina: pagina,
                    contenedor: obtenerMes(contenedor), 
                    filtro: filtro
                }, function (error, resultado) {
                    res.json({ success: true, data: resultado, limite: limite });
                });
            });
        });
    }); 
    router.get('/:usuario', function (req, res, next) {
        if(config.limite && !isNaN(config.limite))
            var limite = parseInt(config.limite);
        else
            var limite = config.limite;
        if(config.pagina && !isNaN(config.pagina))
            var pagina = parseInt(config.pagina);
        else
            var pagina = 1;
        if(req.session.usuario !== req.params.usuario) {
            var filtro = {
                $where: 'this.usuario.usuario=="' + req.params.usuario + '" && ' +
                        '["friends", "public"].indexOf(this.permiso) >= 0'
            };
        } else {
            var filtro = {$where: 'this.usuario.usuario=="' + req.params.usuario + '"'};
        }
        if(req.query.minimo) {
            var contenedor = new Date(parseInt(req.query.minimo));
            filtro.fecha = {$lt: contenedor};
        } else {
            var contenedor = new Date();
        }
        noticias({
            limite: limite,
            pagina: pagina,
            contenedor: obtenerMes(contenedor),
            filtro: filtro
        }, function (error, resultado) {
            res.json({ success: true, data: resultado, limite: limite });
        });
    });
    router.post('/publicar', function (req, res, next) {
        var data = {
            usuario: req.session,
            comentario: req.body.comentario,
            permiso: req.body.permiso,
            fecha: Date.now(),
            contenedor: obtenerMes(new Date()),
            likes: [],
            comentarios: [],
            compartidos: []
        };
        Noticias.setColeccion('noticias_' + data.contenedor);
        Noticias.add(data, function() {
            res.json({success:true});
        }, req.error, true);
    });
    router.post('/noticia/comentar', function (req, res, next) {
        var filtro = { _id: config.mongodb.ObjectID(req.body.id) };
        Noticias.setColeccion('noticias_' + req.body.contenedor);
        Noticias.find(filtro, function (err, data) {
            data.toArray(function (error, resultado) {
                if(resultado.length == 1) {
                    resultado = resultado[0];
                    if(resultado.comentarios == undefined) {
                        resultado.comentarios = [];
                    }
                    resultado.comentarios.push({
                        usuario: {
                            nombres: req.session.nombres,
                            apellidos: req.session.apellidos,
                            usuario: req.session.usuario
                        },
                        comentario: req.body.comentario,
                        fecha: Date.now()
                    });
                    Noticias.update(filtro, {comentarios:resultado.comentarios}, function() {
                        res.json({success:true,comentarios:resultado.comentarios});
                    }, req.error, true);
                } else {
                    res.json({ success: false, mensaje: 'Noticia no encontrada' });
                }
                
            });
        }, req.error, true);
    });
    router.post('/like', function (req, res, next) {
        var filtro = {
            _id: config.mongodb.ObjectID(req.body.id)
            //$where: "this.usuario.usuario=='" + req.session.usuario + "'"
        }, encontrado = -1;
        Noticias.setColeccion('noticias_' + req.body.contenedor);
        Noticias.find(filtro, function (err, data) {
            data.toArray(function (error, resultado) {
                if(resultado.length == 1) {
                    resultado = resultado[0];
                    if(resultado.likes == undefined)
                        resultado.likes = [];
                    for(var i = 0; i < resultado.likes.length; i++) {
                        if(resultado.likes[i].usuario == req.session.usuario) {
                            encontrado = i;
                            break;
                        }
                    }
                    if(encontrado >= 0) {
                        resultado.likes.splice(encontrado);
                    } else {
                        resultado.likes.push({
                            nombres: req.session.nombres,
                            apellidos: req.session.apellidos,
                            usuario: req.session.usuario
                        });
                    }
                    Noticias.update(filtro, {likes:resultado.likes}, function() {
                        res.json({success:true,likes:resultado.likes});
                    }, req.error, true);
                } else {
                    res.json({ success: false, mensaje: 'Noticia no encontrada' });
                }
                
            });
        }, req.error, true);
    });
    router.post('/eliminar', function (req, res, next) {
        var filtro = {
            _id: config.mongodb.ObjectID(req.body.id),
            $where: "this.usuario.usuario=='" + req.session.usuario + "'"
        }, encontrado = -1;
        Noticias.setColeccion('noticias_' + req.body.contenedor);
        Noticias.delete(filtro, function() {
            res.json({success:true});
        }, req.error);
    });
    return router;
};