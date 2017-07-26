class UserService implements chat.UserService {
    static $inject = ["$http", "$q", "loginFbService"];
    private user: chat.User;
    constructor(private $http: angular.IHttpService, private $q: angular.IQService, private loginFbService: chat.LoginFbService) {
    }

    getUser(): chat.User {
        return this.user;
    }

    loginFb(): angular.IPromise<chat.User> {
        var deferred = this.$q.defer();
        this.loginFbService.login()
            .then((userData: chat.User) => {
                this.user = userData;
                deferred.resolve(this.user);
            }, (error: any) => {
                deferred.reject("error");
            });
        return deferred.promise;
    }

    loginEmail(data: chat.LoginData): angular.IPromise<chat.User> {
        var deferred = this.$q.defer();
        this.$http.post("/login", data)
            .then((response: angular.IHttpPromiseCallbackArg<chat.User>) => {
                this.user = response.data;
                deferred.resolve(this.user);
            }, (reason: any) => {
                deferred.reject("error");
            });
        return deferred.promise;
    }

    signUp(data: chat.SignupData): angular.IPromise<chat.User> {
        var deferred = this.$q.defer();
        this.$http.post("/signup", data)
            .then((response: angular.IHttpPromiseCallbackArg<chat.User>) => {
                this.user = response.data;
                deferred.resolve(this.user);
            }, (reason: any) => {
                deferred.reject("error");
            });
        return deferred.promise;
    }

    authenticate(): angular.IPromise<string> {
        var deferred = this.$q.defer();
        this.$http.get("/authenticate")
            .then((res: { data: chat.User }) => {
                this.user = res.data;
                deferred.resolve(this.user._id);
            }, (reason) => {
                deferred.reject(reason);
            });
        return deferred.promise;
    }

    logout(): angular.IPromise<chat.User> {
        var deferred = this.$q.defer();
        this.$http.get("/logout")
            .then((data) => {
                this.user = undefined;
                deferred.resolve(this.user);
            }, (reason) => {
                deferred.reject(reason);
            });
        return deferred.promise;
    }
}

angular.module("chatApp")
    .service("userService", UserService);
