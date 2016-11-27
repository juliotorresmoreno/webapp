"use strict";

module.exports = function (config) {
    const router = config.express.Router();
    const ubicacion = config.location + '/usuarios';
    const multipart = require('connect-multiparty');
    const imagemin = require('imagemin');
    const imageminMozjpeg = require('imagemin-mozjpeg');
    const imageminPngquant = require('imagemin-pngquant');
    const standart = config.location + '/public/vendor/148705-essential-collection/png/user-3.png';
    router.post('/', function (req, res, next) {
        var nombre = req.body.nombre;
        var permiso = req.body.permiso;
        var id = req.body.id !== undefined ? req.body.id : '';
        var fusuario = ubicacion + '/' + req.session.usuario;
        var galeria = fusuario + '/' + nombre + '/build';
        var galeriaid = fusuario + '/' + id;
        var permisos = fusuario + '/' + nombre + '/permiso';
        var crearGaleria = function () {
            config.fs.exists(galeria, function (exists) {
                if (!exists) {
                    config.validador(config.modelos.galerias, {nombre: nombre}, {
                        callback: function (resultado) {
                            if (resultado.success) {
                                config.fs.mkdir(galeria, '0777', function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    config.fs.writeFile(permisos, permiso, function () {
                                        res.json({success: true});
                                    });
                                });
                            } else {
                                res.json({success: false, mensaje: resultado.nombre.join('<br />')});
                            }
                        }
                    });
                } else {
                    res.json({success: false, mensaje: 'Ya existe una galeria con ese nombre.'});
                }
            });
        };
        var renombrarGaleria = function () {
            config.fs.exists(galeriaid, function (exists) {
                if (exists) {
                    config.fs.exists(galeria, function (exists) {
                        if (!exists) {
                            config.validador(config.modelos.galerias, {nombre: nombre}, {
                                callback: function (resultado) {
                                    if (resultado.success) {
                                        config.fs.rename(galeriaid, galeria, function (err) {
                                            config.fs.writeFile(permisos, permiso, function () {
                                                res.json({success: true});
                                            });
                                        });
                                    } else {
                                        res.json({success: false, mensaje: resultado.nombre.join('<br />')});
                                    }
                                }
                            });
                        } else if (galeria !== galeriaid) {
                            res.json({success: false, mensaje: 'Ya existe una galeria con ese nombre.'});
                        } else {
                            res.json({success: true});
                        }
                    });
                } else {
                    res.json({success: false, mensaje: 'No existe la galeria ' + id});
                }
            });
        };
        config.fs.exists(fusuario, function (exists) {
            if (!exists) {
                config.fs.mkdir(fusuario, '0777', function (err) {
                    id === undefined || id === '' ? crearGaleria() : renombrarGaleria();
                });
            } else {
                id === undefined || id === '' ? crearGaleria() : renombrarGaleria();
            }
        });
    });
    var listar_galerias = function (req, res, next) {
        var usuario = req.params.usuario ? req.params.usuario : req.session.usuario;
        var fusuario = ubicacion + '/' + usuario, total;
        config.fs.exists(fusuario, function (exists) {
            if (!exists) {
                return res.json({success: true, galerias: []});
            }
            config.fs.readdir(fusuario, function (err, resultado) {
                var galerias = [];
                if (resultado === undefined || resultado.length === 0) {
                    res.json({success: true, galerias: galerias});
                    return;
                }
                var leer_permiso = function (galeria) {
                    return function (error, data) {
                        galerias.push({nombre: galeria, permiso: data.toString()});
                        if (galerias.length === total) {
                            res.json({success: true, galerias: galerias});
                        }
                    };
                };
                total = resultado.length;
                for (var i = 0; i < resultado.length; i++) {
                    if (resultado[i] !== 'fotoPerfil') {
                        config.fs.readFile(fusuario + '/' + resultado[i] + '/permiso', leer_permiso(resultado[i]));
                    } else {
                        total--;
                    }
                }
            });
        });
    };
    router.get('/', listar_galerias);
    router.get('/:usuario/listar/1', listar_galerias);
    var listar_fotos = function (req, res, next) {
        var usuario = req.params.usuario ? req.params.usuario : req.session.usuario;
        var fusuario = ubicacion + '/' + usuario;
        var galeria = fusuario + '/' + req.params.galeria + '/build';
        var permiso = fusuario + '/' + req.params.galeria + '/permiso';
        config.fs.exists(galeria, function (exists) {
            if (exists) {
                config.fs.readdir(galeria, function (err, resultado) {
                    var respuesta = [];
                    for (var i = 0; i < resultado.length; i++) {
                        respuesta.push({
                            nombre: resultado[i],
                            ruta: '/api/v1/galerias/' + usuario + '/' + req.params.galeria + '/' + resultado[i]
                        });
                    }
                    config.fs.readFile(permiso, function (error, data) {
                        res.json({success: true, fotos: respuesta, permiso: data.toString()});
                    });
                });
            } else {
                res.json({success: false, mensaje: 'La galeria no existe'});
            }
        });
    };
    router.get('/:usuario/fotoPerfil', function (req, res) {
        var fusuario = ubicacion + '/' + req.params.usuario;
        var fotoPerfil = fusuario + '/fotoPerfil';

        config.fs.exists(fotoPerfil, function (exists) {
            if (exists) {
                config.fs.stat(standart, function (erro, attr) {
                    res.setHeader('Content-Type', 'image/png');
                    res.setHeader('Etag', attr.mtime);
                    if(req.headers['if-none-match'] == attr.mtime) {
                        res.status(304).end();
                    } else {
                        config.fs.readFile(fotoPerfil, function (error, data) {
                            res.end(data);
                        });
                    }
                });
            } else {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Etag', config.md5(req.session.usuario));
                if(req.headers['if-none-match'] != config.md5(req.session.usuario)) {
                    config.fs.readFile(standart, function (error, data) {
                        res.end(data);
                    });
                } else {
                    res.status(304).end();
                }
            }
        });
    });
    router.get('/:usuario/:galeria/listar', listar_fotos);
    router.get('/:galeria', listar_fotos);

    var mostrarFoto = function (req, res) {
        var usuario = req.params.usuario ? req.params.usuario : req.session.usuario;
        var fusuario = ubicacion + '/' + usuario;
        var galeria = fusuario + '/' + req.params.galeria;
        var foto = galeria + '/build/' + req.params.foto;
        if(req.headers['if-none-match']) {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Etag', 'W/"1499c-1504d4139db"');
            res.status(304).end();
            return;
        }
        var responder = function (foto) {
            config.fs.exists(foto, function (exists) {
                if (exists) {
                    config.fs.readFile(foto, function (error, data) {
                        res.end(data);
                    });
                } else {
                    res.json({success: false, foto: foto});
                }
            });
        };
        if (req.params.foto === '@preview') {
            config.fs.exists(galeria, function (exists) {
                if (exists) {
                    config.fs.exists(galeria, function (exists) {
                        if(exists) {
                            config.fs.readdir(galeria + '/build', function (err, resultado) {
                                var image = resultado[config.randomize(0, resultado.length - 1)].replace(/^.*\//, '');
                                if (resultado.length > 0) {
                                    res.redirect(image);
                                } else {
                                    responder('./public/images/not-found.png');
                                }
                            });
                        } else {
                            responder('./public/images/not-found.png');
                        }
                    });
                } else {
                    res.json({
                        success: false, 
                        mensaje: 'La galeria no existe'+ galeria,
                        hhh: req.params.galeria
                    });
                }
            });
        } else {
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Etag', 'W/"1499c-1504d4139db"');
            responder(foto);
        }
    };
    router.get('/:galeria/:foto', mostrarFoto);
    router.get('/:usuario/:galeria/:foto', mostrarFoto);

    router.post('/:galeria/establecerFotoPerfil', function (req, res, next) {
        var fusuario = ubicacion + '/' + req.session.usuario;
        var galeria = fusuario + '/' + req.params.galeria + '/build';
        var fotoid = galeria + '/' + req.body.id;
        var fotoPerfil = fusuario + '/fotoPerfil';
        config.fs.exists(fotoid, function (exists) {
            if (exists) {
                config.fs.readFile(fotoid, function (error, data) {
                    config.fs.writeFile(fotoPerfil, data, function () {
                        res.json({success: true});
                    });
                });
            } else {
                res.json({success: false, foto: ['La foto especificada no existe.']});
            }
        });
    });

    router.post('/:galeria/renombrarFoto', function (req, res, next) {
        var fusuario = ubicacion + '/' + req.session.usuario;
        var galeria = fusuario + '/' + req.params.galeria + '/build';
        var foto = galeria + '/' + req.body.nombre;
        var fotoid = galeria + '/' + req.body.id;
        var permiso = fusuario + '/' + req.params.galeria + '/permiso';
        config.fs.exists(fotoid, function (exists) {
            if (exists) {
                config.fs.exists(foto, function (exists) {
                    if (!exists) {
                        config.fs.rename(fotoid, foto, function (err) {
                            res.json({success: true});
                        });
                    } else {
                        res.json({success: false, foto: ['Ya existe otra foto con ese nombre.']});
                    }
                });
            } else {
                res.json({success: false, foto: ['La foto especificada no existe.']});
            }
        });
    });

    router.post('/:galeria/eliminarFoto', function (req, res, next) {
        var fusuario = ubicacion + '/' + req.session.usuario;
        var galeria = fusuario + '/' + req.params.galeria + '/build';
        var fotoid = galeria + '/' + req.body.id;
        var permiso = fusuario + '/' + req.params.galeria + '/permiso';
        config.fs.exists(fotoid, function (exists) {
            if (exists) {
                config.fs.unlink(fotoid, function () {
                    listar_fotos(req, res, next);
                });
            } else {
                res.json({success: false, foto: ['La foto especificada no existe.']});
            }
        });
    });

    router.post('/:galeria/subirFoto', multipart(), function (req, res, next) {
        var foto = req.files.file.path;
        var fusuario = ubicacion + '/' + req.session.usuario;
        var galeria = fusuario + '/' + req.params.galeria;
        var filename = req.files.file.name === req.files.file.name ? config.mongodb.ObjectID().toString() : req.files.file.name;
        var newPath = galeria + '/' + filename;
        var is = config.fs.createReadStream(foto);
        var os = config.fs.createWriteStream(newPath);
        is.pipe(os);
        is.on('end', function () {
            config.fs.unlinkSync(foto);
            imagemin([newPath], galeria + '/build').then(files => {
                config.fs.unlinkSync(newPath);
                listar_fotos(req, res, next);
            });
        });
    });
    router.post('/:galeria/subirFoto64', function (req, res, next) {
        var foto = config.mongodb.ObjectID().toString();
        var fusuario = config.location + '/' + ubicacion + '/' + req.session.usuario;
        var galeria = fusuario + '/' + req.params.galeria;
        var newPath = galeria + '/' + foto;
    });
    return router;
};
