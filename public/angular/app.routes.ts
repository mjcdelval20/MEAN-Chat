angular.module("chatApp")
    .config(function ($routeProvider: angular.route.IRouteProvider, $locationProvider: angular.ILocationProvider) {

        $locationProvider.html5Mode(true);

        $routeProvider.when("/chat", {
            templateUrl: "/angular/components/chat/chat.html"
        });

        $routeProvider.otherwise({
            templateUrl: "/angular/components/login/login.html"
        });
    });