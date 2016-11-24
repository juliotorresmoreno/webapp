module.exports = function (config) {
    var router = config.express.Router();
    var params = config;
    var Usuarios = config.modelos.BaseModel(params, config.modelos.usuarios);
    var nodemailer = require('nodemailer');
    var login = function (req, res, next, session) {
        var token = config.mongodb.ObjectID() + config.mongodb.ObjectID();
        session.caduca = (new Date()).setHours(2);
        config.redisdb.set(token, JSON.stringify(session));
        res.cookie('token', token);
        session.token = token;
        res.json({success: true, session: session});
    };
    var validarEmail = function(email, callback) {
        var transporter = nodemailer.createTransport();
        var mailOptions = {
            from: '"Postmaster ?" <postmaster@melleva.ml>',
            to: email,
            subject: 'Cordial saludo',
            text: 'Hello world ?',
            html: '<b>Hello world ?</b>'
        };
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
                return;
            }
        });
    };
    router.get('/validar', function (req, res, next) {
        Usuarios.find({_id:req.session.usuario}, function (error, resultado) {
            resultado.toArray(function(error, data) {
                res.render('interno/correo', {
                    nombres: data[0].nombres,
                    apellidos: data[0].apellidos,
                    link: 'sds'
                });
            });
        });
    });
    router.post('/registrar', function (req, res, next) {
        var usuario = {
            _id: req.body.usuario,
            nombres: req.body.nombres,
            apellidos: req.body.apellidos,
            usuario: req.body.usuario,
            email: req.body.email,
            password: req.body.password,
            password_confirmation: req.body.password_confirmation
        };
        var success = function (resultado) {
            login(req, res, next, {
                nombres: req.body.nombres,
                apellidos: req.body.apellidos,
                usuario: req.body.usuario
            });
        };
        var error = function (resultado) {
            if (resultado.code === 1001) {
                res.json(resultado.error);
            } else {
                res.end();
            }
        };
        Usuarios.add(usuario, success, error);
    });
    router.post('/login', function (req, res, next) {
        var usuario = req.body.usuario;
        var password = req.body.password;
        var credenciales, campos = {nombres: 1, apellidos: 1, usuario: 1, leyenda:1};
        if (usuario.indexOf('@') > -1)
            credenciales = {email: usuario, password: config.md5(password)};
        else
            credenciales = {usuario: usuario, password: config.md5(password)};
        var success = function (err, data) {
            data.toArray(function (error, dato) {
                if (dato.length == 0) {
                    res.json({success: false, login: ['Usuario o contrasena invalida']});
                } else {
                    delete dato[0]._id;
                    login(req, res, next, dato[0]);
                }
            })
        };

        Usuarios.find(credenciales, success, campos);
    });
    router.get('/session', function (req, res, next) {
        var token = req.cookies != undefined && req.cookies.token ? req.cookies.token : req.query.token;
        if (req.session) {
            var campos = {nombres: 1, apellidos: 1, usuario: 1, leyenda:1};
            var credenciales = {usuario: req.session.usuario};
            var success = function (err, data) {
                data.toArray(function (error, dato) {
                    if (dato.length == 0) {
                        res.json({success: false});
                    } else {
                        config.redisdb.set(req.session.token, JSON.stringify(dato[0]));
                        dato[0].token = token;
                        res.json({success: true, session: dato[0]});
                    }
                })
            };
            Usuarios.find(credenciales, success, campos);
        } else {
            res.json({success: false});
        }
    });
    router.get('/logout', function (req, res, next) {
        res.clearCookie('token');
        res.json({success: true});
    });

    return router;
};
