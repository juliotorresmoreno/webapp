module.exports = function (config) {
    var params = config;
    params.coleccion = 'usuarios';
    params.modelo = config.modelos.usuarios;
    var Usuarios = config.modelos.BaseModel(params);
    var login = function (session, fn) {
        var token = config.mongodb.ObjectID() + config.mongodb.ObjectID();
        config.redisdb.set(token, JSON.stringify(session));
        session.token = token;
        fn(false, {success: true, session: session});
    };
    var app = {
        registrar: function (req, fn) {
            var usuario = {
                _id: req.usuario,
                nombres: req.nombres,
                apellidos: req.apellidos,
                usuario: req.usuario,
                email: req.email,
                password: req.password,
                password_confirmation: req.password_confirmation
            };
            var success = function (resultado) {
                login({
                    nombres: req.nombres,
                    apellidos: req.apellidos,
                    usuario: req.usuario
                }, fn);
            };
            var error = function (resultado) {
                fn(resultado.code, resultado.error);
            };
            Usuarios.add(usuario, success, error);
        },
        login: function (req, fn) {
            var usuario = req.usuario;
            var password = req.password;
            var credenciales, campos = {nombres: 1, apellidos: 1, usuario: 1};
            if (usuario.indexOf('@') > -1)
                credenciales = {email: usuario, password: config.md5(password)};
            else
                credenciales = {usuario: usuario, password: config.md5(password)};
            var success = function (err, data) {
                data.toArray(function (error, dato) {
                    if (dato.length === 0) {
                        fn('Usuario o contrasena invalido', {
                            success: false,
                            login: ['Usuario o contrasena invalido']
                        });
                    } else {
                        delete dato[0]._id;
                        login(dato[0], fn);
                    }
                });
            };
            Usuarios.find(credenciales, success, campos);
        }
    };
    return app;
};