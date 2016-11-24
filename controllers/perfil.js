module.exports = function (config) {
    var router = config.express.Router();
    var params = config;
    var Usuarios = config.modelos.BaseModel(params, config.modelos.usuarios);
    var campos = {
        nombres: 1,
        apellidos: 1,leyenda:1,
        usuario: 1,
        email: 1, permiso_email: 1, email_mostrar: 1,
        nacimiento_mes: 1, nacimiento_dia: 1, permiso_nacimiento_dia: 1,
        nacimiento_ano: 1, permiso_nacimiento_ano: 1,
        sexo: 1, permiso_sexo: 1,
        pais_nacimiento: 1, permiso_pais_nacimiento: 1,
        ciudad_nacimiento: 1, permiso_ciudad_nacimiento: 1,
        pais_residencia: 1, permiso_pais_residencia: 1,
        ciudad_residencia: 1, permiso_ciudad_residencia: 1,
        direccion: 1, permiso_direccion: 1,
        telefono: 1, permiso_telefono: 1,
        celular: 1, permiso_celular: 1,
        personalidad: 1, permiso_personalidad: 1,
        intereses: 1, permiso_intereses: 1,
        series: 1, permiso_series: 1,
        musica: 1, permiso_musica: 1,
        creencias_religiosas: 1, permiso_creencias_religiosas: 1,
        creencias_politicas: 1, permiso_creencias_politicas: 1
    };
    router.get('/', function (req, res, next) {
        Usuarios.find({_id: req.session.usuario}, function (err, data) {
            data.toArray(function (error, dato) {
                if (dato.length == 0) {
                    res.json({success: false});
                } else {
                    delete dato[0]._id;
                    var usuario = dato[0];
                    usuario.email = usuario.email_mostrar ? usuario.email_mostrar : usuario.email;
                    usuario.success = true;
                    res.json(usuario);
                }
            })
        }, campos);
    });
    router.post('/', function (req, res, next) {
        var usuario = {}, campo;
        var permisos = [
            'permiso_email', 'permiso_nacimiento_dia', 'permiso_nacimiento_ano', 'permiso_sexo',
            'permiso_pais_nacimiento', 'permiso_ciudad_nacimiento', 'permiso_pais_residencia', 'permiso_ciudad_residencia',
            'permiso_direccion', 'permiso_telefono', 'permiso_celular', 'permiso_personalidad', 'permiso_intereses',
            'permiso_series', 'permiso_musica', 'permiso_creencias_religiosas', 'permiso_creencias_politicas'
        ];
        Usuarios.find({_id: req.session.usuario}, function (err, data) {
            data.toArray(function (error, dato) {
                if (dato.length == 0) {
                    res.json({success: false});
                } else {
                    usuario = dato[0];
                    for (var i = 0; i < config.modelos.usuarios.campos.length; i++) {
                        campo = config.modelos.usuarios.campos[i].nombre;
                        if (req.body[campo] != undefined)
                            usuario[campo] = req.body[campo];
                    }
                    for (var i = 0; i < permisos.length; i++) {
                        if (req.body[permisos[i]] && ['public', 'friends', 'private'].indexOf(req.body[permisos[i]]) >= 0) {
                            usuario[permisos[i]] = req.body[permisos[i]];
                        }
                    }
                    if (req.body.email) {
                        usuario.email_mostrar = req.body.email;
                    }
                    Usuarios.update(req.session.usuario, usuario, function (resultado) {
                        res.json({success: true});
                    }, function (resultado) {
                        if (resultado.code == 1001) {
                            delete resultado.error.password;
                            res.json(resultado.error);
                        } else
                            res.json(resultado);
                    });

                }
            })
        }, campos);
    });
    return router;
};
