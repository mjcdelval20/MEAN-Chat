export const CanvasComponent: angular.IComponentOptions = {
    bindings: {
        message: '<'
    },
    controller: CanvasController,
    template: "<canvas></canvas>"
};

class CanvasController {
    static $inject = ["$scope"];

    private message: string;

    constructor(private $scope: angular.IScope) { }

    // $onChanges(changes){
    //     if (changes.todo){
    //         this.message = Object.assign({}, this.message);
    //     }
    // }
}

angular.module("chatApp")
    .component("canvasComponent", CanvasComponent);