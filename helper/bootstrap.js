/* global servidor */

/*{{servidor}};*/
/*{{session}};*/

(function () {
    var html = '';
    var cargar_estilos = function (ruta) {
        return '<link rel=\'stylesheet\' href=\'' + ruta + '\' />';
    };
    var cargar_libreria = function (ruta) {
        return '<script type=\'text/javascript\' src=\'' + ruta + '\'></script>';
    };
    var config = {
        componentes: [
            servidor + '/js/metro/build/js/metro.min.js',
            servidor + '/js/helper/validador.js',
            servidor + '/js/application/application.js',
            servidor + '/js/application/authController.js',
            servidor + '/js/application/perfilController.js',
            servidor + '/js/application/amigosController.js',
            servidor + '/js/application/galeriasController.js',
            servidor + '/js/application/mensajesController.js',
            servidor + '/js/application/cursosController.js',
            servidor + '/js/application/noticiasController.js',
            servidor + '/js/application/chatsController.js'
        ],
        librerias: [
            servidor + '/js/jquery/dist/jquery.min.js',
            servidor + '/js/angular/angular.min.js',
            servidor + '/js/ng-html-compile/ngHtmlCompile.js',
            servidor + '/js/angular-route/angular-route.js',
            servidor + '/js/validator/validator.min.js',
            servidor + '/js/angular-sanitize/angular-sanitize.min.js',
            servidor + '/js/select2/dist/js/select2.min.js',
            servidor + '/js/simplewebrtc.bundle.js',
            servidor + '/js/ui-select/select.js'
        ],
        libreriasIE: [
            'https://oss.maxcdn.com/html5shiv/dist/html5shiv.js',
            'https://oss.maxcdn.com/respond/1.4.2/respond.min.js'
        ],
        estilos: [
            servidor + "/js/metro/build/css/metro.min.css",
            servidor + "/js/metro/build/css/metro-icons.min.css",
            servidor + "/js/metro/build/css/metro-responsive.min.css",
            servidor + '/stylesheets/style.css'
        ]
    };
    for (var i = 0; i < config.estilos.length; i++) {
        html += cargar_estilos(config.estilos[i]);
    }

    for (var i = 0; i < config.librerias.length; i++) {
        html += cargar_libreria(config.librerias[i]);
    }

    html += config.libreriasIE ? '\n<!--[if lt IE 9]>\n' : '';
    for (var i = 0; i < config.libreriasIE.length; i++) {
        html += cargar_libreria(config.libreriasIE[i]);
    }
    html += config.libreriasIE ? '\n<![endif]-->\n' : '';

    for (var i = 0; i < config.componentes.length; i++) {
        html += cargar_libreria(config.componentes[i]);
    }

    var onDeviceReady = function () {
        document.write(html);
    };

    var isAndroid = navigator.appVersion.toLowerCase().indexOf('android') >= 0;
    if (isAndroid) {
        document.addEventListener('deviceready', onDeviceReady, false);
    } else {
        onDeviceReady();
    }
})();