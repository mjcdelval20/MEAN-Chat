angular.module("chatApp", ["ngRoute", "ngMaterial", "ngMessages", "pascalprecht.translate"])
    .config(function ($mdIconProvider: angular.material.IIconProvider, $translateProvider: angular.translate.ITranslateProvider) {
        $mdIconProvider.icon("menu", "./assets/svg/menu.svg", 24);
        $mdIconProvider.icon("addcontact", "./assets/svg/ic_person_add_black_24px.svg", 24);
        $mdIconProvider.icon("chat", "./assets/svg/ic_chat_black_24px.svg", 24);
        $mdIconProvider.icon("send", "./assets/svg/ic_send_black_24px.svg", 24);
        $mdIconProvider.icon("addgroup", "./assets/svg/ic_group_add_black_24px.svg", 24);
        $mdIconProvider.icon("draw", "./assets/svg/ic_gesture_black_24px.svg", 24);
        $mdIconProvider.icon("text", "./assets/svg/ic_text_format_black_24px.svg", 24);
        $mdIconProvider.icon("group", "./assets/svg/ic_group_black_24px.svg", 24);

        $translateProvider.translations('en', {
            'CONTACTS': 'Contacts',
            'CONVERSATIONS': 'CONVERSATIONS',
            'SEARCH USER': 'Search User',
            'CONTACT REQUESTS': 'Contact Requests',
            'ACCEPTED CONTACTS': 'Accepted Contacts',
            'IS ONLINE': "is online",
            'SENT A DRAWING': "sent a drawing",
            "ACCEPT CONTACT REQUEST": "Accept Contact Request",
            "DO YOU WANT TO ACCEPT": "Do you want to accept ",
            "AS A CONTACT": "as contact?",
            "ACCEPT REQUEST": "Accept Request",
            "ACCEPT": "Accept",
            "CANCEL": "Cancel",
            "ENTER WITH FACEBOOK": "Enter with Facebook",
            "OR": "Or",
            "EMAIL": "EMAIL",
            "PASSWORD": "PASSWORD",
            "LOGIN": "Log In",
            "SIGNUP": "Sign Up",
            "REGISTER": "Register",
            "NAME": "Name"
        });

        $translateProvider.translations('es', {
            'CONTACTS': 'Contactos',
            'CONVERSATIONS': 'Conversaciones',
            'SEARCH USER': 'Buscar Usuario',
            'CONTACT REQUESTS': 'Solicitudes de Contacto',
            'ACCEPTED CONTACTS': 'Contactos Aceptados',
            'IS ONLINE': "está en línea",
            'SENT A DRAWING': "envió un dibujo",
            "ACCEPT CONTACT REQUEST": "Aceptar Solicitud de Contacto",
            "DO YOU WANT TO ACCEPT": "¿Deseas aceptar a",
            "AS A CONTACT ": "como contacto?",
            "ACCEPT REQUEST": "Aceptar Solicitud",
            "ACCEPT": "Aceptar",
            "CANCEL": "Cancelar",
            "ENTER WITH FACEBOOK": "Entrar usando Facebook",
            "OR": "O",
            "EMAIL": "Correo electrónico",
            "PASSWORD": "Contraseña",
            "LOGIN": "Iniciar Sesión",
            "SIGNUP": "Crear Cuenta",
            "REGISTER": "Cuenta Nueva",
            "NAME": "Nombre"
        });

        $translateProvider.preferredLanguage('es');

    })
    .run(function ($window: angular.IWindowService) {
        $window.fbAsyncInit = function () {
            // Executed when the SDK is loaded
            FB.init({
                appId: '635915976613380',
                //channelUrl: 'components/login/channel.html',
                status: true,
                cookie: true,
                version: 'v2.4'
            });
        };

        (function (d) {
            // load the Facebook javascript SDK
            var id = 'facebook-jssdk';
            var ref = d.getElementsByTagName('script')[0];

            if (d.getElementById(id)) {
                return;
            }

            var js = d.createElement('script');
            js.id = id;
            js.async = true;
            js.src = "//connect.facebook.net/en_US/sdk.js";

            ref.parentNode.insertBefore(js, ref);

        } (document));
    })
    .controller("mainCtrl", function ($location: angular.ILocationService, userService: chat.UserService) {
        userService.authenticate()
            .then(function (userid: string) {
                if (userid) {
                    $location.path("/chat");
                }
            });
    });
