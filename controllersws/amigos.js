module.exports = function (config) {
    var params = config;
    params.coleccion = 'usuarios';
    params.modelo = config.modelos.usuarios;
    var Relaciones = config.modelos.BaseModel(config);
    Relaciones.setModelo(config.modelos.amistades);
    var campos = {
        nombres: 1, apellidos: 1, leyenda:1,
        usuario: 1
    };
    var app = {
        listarAmigos: function(data, fn) {
            var session = data.session;
            var query = {relacion: 'confirmado'};
            Relaciones.setColeccion('amistades_' + session.usuario);
            Relaciones.find(query, function (err, data) {
                data.count(function(error, total) {
                    data.toArray(function (error, resultado) {
                        Relaciones.leftJoin({
                            datos: resultado,
                            alias: 'relacion',
                            campo: '_id',
                            tabla: 'usuarios',
                            relacion: '_id',
                            callback: function (resultado) {
                                if (Object.prototype.toString.call(fn)) {
                                    fn(null, resultado);
                                };
                            },
                            inverso: true,
                            campos: campos
                        });
                    });
                });
            });
        }
    };
    return app;
};