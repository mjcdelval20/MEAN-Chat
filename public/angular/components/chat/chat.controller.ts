class ChatCtrl {
    public user: chat.User;
    public conversations: chat.Conversations;
    public selectedContact: chat.Contact;
    public selectedConversation: chat.Conversation;
    public selectedUsers: chat.Contact[];
    public message: string;
    public selectedInput: string;
    public contactsShown: string;
    public conversationsShown: string;
    public toggleContactsButtonText: string;

    private users: [chat.User]; //replace this with async call to search for users
    private contacts: chat.Contacts; //Object with all the user's contacts <id, contact>
    private usersXconversations: chat.UsersXConversations; //Object with relationship between contact and conversation <contactid, conversationid>
    private usersInGroup: chat.Contacts; //Object with all the users in the selected group <id, user>
    private canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas");
    private canvasContainer = angular.element(this.canvas).parent();
    private paint: boolean;
    private clickX: number[] = [];
    private clickY: number[] = [];
    private clickDrag: boolean[] = [];
    private offsetLeft = this.canvas.getBoundingClientRect().left - window.scrollX;
    private offsetTop = this.canvas.getBoundingClientRect().top - window.scrollY;
    private context = this.canvas.getContext("2d");

    static $inject = ["$scope", "$mdSidenav", "$location", "userService", "$http", "socketIO", "$timeout", "$mdToast", "$mdDialog", "$translate"];
    constructor(
        private $scope: angular.IScope,
        private $mdSidenav: angular.material.ISidenavService,
        private $location: angular.ILocationService,
        private userService: chat.UserService,
        private $http: angular.IHttpService,
        private socketIO: chat.Socket,
        private $timeout: angular.ITimeoutService,
        private $mdToast: angular.material.IToastService,
        private $mdDialog: angular.material.IDialogService,
        private $translate: angular.translate.ITranslateService
    ) {
        this.user = userService.getUser();
        this.selectedUsers = [];

        $translate("CONTACT REQUESTS")
            .then((ContactRequests) => {
                this.toggleContactsButtonText = ContactRequests;
            });

        this.contactsShown = "accepted";
        this.socketIO.connect(this.user._id);
        this.socketIO.on("connect", () => {
            console.log("client connected to io");
            this.joinConversation(this.user._id);
            this.loadContacts();
            this.loadUsers();
            this.loadConversations();

            this.socketIO.on("disconnect:contact", (userid: string) => {
                if (this.contacts[userid]) {
                    this.contacts[userid].online = false;
                }
            });

            this.socketIO.on("new:message", (message: chat.Message) => {
                this.conversations[message.conversation].messages.push(message);
                if (this.selectedConversation && this.selectedConversation._id === message.conversation) {
                    this.updateChatWindow();
                } else {
                    if (message.messageType === "text") {
                        this.$mdToast.showSimple(message.sender.name + ": " + message.message);
                    } else {
                        $translate("SENT A DRAWING")
                            .then((sentADrawing) => {
                                this.$mdToast.showSimple(message.sender.name + " " + sentADrawing);
                            });
                    }
                    this.conversations[message.conversation].unread++;
                }
            });
            this.socketIO.on("add:conversation", (conversation: chat.Conversation) => {
                let names: string[] = [];
                if (this.conversations[conversation._id]) {
                    return;
                }
                for (let user of conversation.users) {
                    if (user.name !== this.user.name) {
                        names.push(user.name);
                        if (conversation.type === "single") {
                            conversation.avatar = user.avatar;
                        }
                    }
                }
                conversation.name = names.join(", ");
                conversation.unread = 0;
                this.conversations[conversation._id] = conversation;
                this.joinConversation(conversation._id);
            });
            this.socketIO.on("refresh:contacts", () => {
                this.refreshContacts();
            });
            this.socketIO.on("update:contact-status", (data: any) => {
                if (data.user === this.user._id) {
                    this.contacts[data.contact].online = data.online;
                } else {
                    if (data.online && this.contacts[data.user].status === "accepted") {
                        $translate("IS ONLINE")
                            .then((isOnline) => {
                                this.$mdToast.showSimple(this.contacts[data.user].name + " " + isOnline);
                            });
                        this.contacts[data.user].online = data.online;
                        this.socketIO.emit("check:online", data);
                    }
                }
            });
        });

        //Key event
        angular.element("#txtMessage").keyup((event) => {
            if (event.keyCode === 13 && !event.shiftKey) {
                this.sendMessage();
            }
        })

        //CANVAS
        //Run function when browser resizes
        angular.element(window).resize(() => {
            angular.element(this.canvas).attr('width', this.canvasContainer.width()); //max width
            angular.element(this.canvas).attr('height', this.canvasContainer.height()); //max height

            //Call a function to redraw other content (texts, images etc)
            this.redraw();
        });
    }

    private refreshContacts() {
        this.$http.get("/users/" + this.user._id + "/contacts")
            .then((response: angular.IHttpPromiseCallbackArg<[chat.Contact]>) => {
                this.user.contacts = response.data;
                this.loadContacts();
            });
    }

    /*LEFT TOOLBAR */
    logout() {
        this.userService.logout()
            .then((data: any) => {
                this.socketIO.disconnect();
                this.$location.path("/");
            });
    }

    toggleSidebar() {
        this.$mdSidenav('left').toggle();
    }

    /* AUTOCOMPLETE CHIPS */
    loadUsers() {
        this.$http.get("/users/" + this.user._id)
            .then((response: angular.IHttpPromiseCallbackArg<[chat.User]>) => {
                this.users = response.data;
            });
    }

    getMatches(query: string) {
        return query ? this.users.filter(this.createFilterFor(query)) : [];
    }

    private createFilterFor(query: string) {
        var uppercaseQuery = angular.uppercase(query);
        return function filterFn(user: chat.User) {
            return (user.name.toUpperCase().indexOf(uppercaseQuery) === 0);
        };
    }

    /* ADD CONTACT */
    addContact() {
        var updateMongo = false;
        var contacts: chat.Contact[] = [];
        for (let user of this.selectedUsers) {
            if (!this.contacts[user._id]) {
                updateMongo = true;
                let contact = {
                    _id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                    email: user.email,
                    status: "unaccepted"
                };
                contacts.push(contact);
            }
        }
        if (updateMongo) {
            //UPDATE MONGO
            this.$http.post("/users/" + this.user._id + "/contacts", { contacts })
                .then((response: angular.IHttpPromiseCallbackArg<chat.User>) => {
                    console.log("contact added");
                    this.socketIO.emit("update:contacts", contacts);
                });
        }
        this.selectedUsers = [];
    }

    /* ADD CONVERSATION */
    createConversation() {
        if (this.selectedUsers.length === 1) {
            if (this.usersXconversations[this.selectedUsers[0]._id]) {
                this.selectConversation(this.conversations[this.usersXconversations[this.selectedUsers[0]._id]]);
            } else {
                let contact = {
                    _id: this.selectedUsers[0]._id,
                    name: this.selectedUsers[0].name,
                    avatar: this.selectedUsers[0].avatar,
                    email: this.selectedUsers[0].email
                };
                let user = {
                    _id: this.user._id,
                    name: this.user.name,
                    avatar: this.user.avatar,
                    email: this.user.email
                };
                let conversation: chat.Conversation = {
                    _id: undefined,
                    users: [contact, user],
                    messages: [],
                    type: "single"
                };
                //UPDATE MONGO
                this.$http.post("/conversations/", conversation)
                    .then((response: angular.IHttpPromiseCallbackArg<chat.Conversation>) => {
                        console.log("conversation added");
                        let convo = response.data;
                        convo.name = contact.name;
                        convo.avatar = contact.avatar;
                        this.conversations[convo._id] = convo;
                        this.selectConversation(this.conversations[convo._id]);
                        this.usersXconversations[contact._id] = convo._id;
                        this.joinConversation(convo._id);
                        this.socketIO.emit("create:conversation", response.data);
                    }, (reason) => {
                        console.log(reason);
                    });
            }
        } else if (this.selectedUsers.length > 1) {
            let names: string[] = [];
            let contacts: chat.Contact[] = [];
            contacts.push({ //this user
                _id: this.user._id,
                name: this.user.name,
                avatar: this.user.avatar,
                email: this.user.email
            });
            for (let user of this.selectedUsers) {
                names.push(user.name);
                contacts.push(user);
            }
            let conversation: chat.Conversation = {
                _id: undefined,
                avatar: "/assets/img/ghosty.png",
                users: contacts,
                messages: [],
                type: "group"
            }
            //UPDATE MONGO
            this.$http.post("/conversations/", conversation)
                .then((response: angular.IHttpPromiseCallbackArg<chat.Conversation>) => {
                    console.log("conversation added");
                    let convo = response.data;
                    convo.name = names.join(", ");
                    this.conversations[convo._id] = convo;
                    this.selectConversation(this.conversations[convo._id]);
                    this.joinConversation(convo._id);
                    this.socketIO.emit("create:conversation", response.data);
                });
        }
        this.selectedUsers = [];
    }

    private joinConversation(conversationid: string) {
        this.socketIO.emit("join", conversationid);
    }

    /* CONTACT LIST */
    private loadContacts() {
        this.contacts = {};
        for (let contact of this.user.contacts) {
            this.contacts[contact._id] = contact;
            if (this.contacts[contact._id].status === "accepted") {
                this.socketIO.emit("check:online", { user: this.user._id, contact: contact._id });
            }
        }
    }
    selectContact(contact: chat.Contact) {
        if (contact.status === "unaccepted") {
            this.$translate(["ACCEPT", "CANCEL", "ACCEPT REQUEST", "DO YOU WANT TO ACCEPT", "AS CONTACT", "ACCEPT CONTACT REQUEST"])
                .then((translations) => {
                    var confirmDialog = this.$mdDialog.confirm()
                        .title(translations["ACCEPT CONTACT REQUEST"])
                        .textContent(translations["DO YOU WANT TO ACCEPT"] + " " + contact.name + " " + translations["AS CONTACT"])
                        .ariaLabel(translations["ACCEPT REQUEST"])
                        .ok(translations["ACCEPT"])
                        .cancel(translations["CANCEL"]);
                    this.$mdDialog.show(confirmDialog)
                        .then(() => {
                            contact.status = "accepted";
                            //UPDATE MONGO
                            this.$http.post("/users/" + this.user._id + "/contacts", { contacts: [contact] })
                                .then((response: angular.IHttpPromiseCallbackArg<chat.User>) => {
                                    console.log("contact added");
                                    this.socketIO.emit("update:contacts", [contact]);
                                });
                            //create conversations
                            this.selectedUsers = [contact];
                            this.createConversation();
                        });
                });

        } else {
            this.selectConversation(this.conversations[this.usersXconversations[contact._id]]);
        }

    }
    toggleContactsShown() {
        if (this.contactsShown === "accepted") {
            this.$translate("ACCEPTED CONTACTS")
                .then((acceptedContacts) => {
                    this.toggleContactsButtonText = acceptedContacts;
                    this.contactsShown = "unaccepted";
                });
        } else {
            this.$translate("CONTACT REQUESTS")
                .then((contactRequests) => {
                    this.toggleContactsButtonText = contactRequests;
                    this.contactsShown = "accepted";
                });
        }
    }

    /* CONVERSATION LIST */
    private loadConversations() {
        this.conversations = {};
        this.usersXconversations = {};
        this.$http.get("/users/" + this.user._id + "/conversations")
            .then((response: angular.IHttpPromiseCallbackArg<[chat.Conversation]>) => {
                this.conversations = {};
                for (let convo of response.data) {
                    let names: string[] = [];
                    for (let user of convo.users) {
                        if (user._id != this.user._id) {
                            names.push(user.name);
                            if (convo.type === "single") {
                                convo.avatar = user.avatar;
                                this.usersXconversations[user._id] = convo._id;
                            }
                        }
                    }
                    convo.name = names.join(", ");
                    convo.unread = 0;
                    this.conversations[convo._id] = convo;
                    this.joinConversation(convo._id);
                }
            });
    }

    selectConversation(conversation: chat.Conversation) {
        conversation.unread = 0;
        if (this.selectedConversation && this.selectedConversation._id === conversation._id) {
            return;
        }
        this.usersInGroup = {};
        this.selectedConversation = conversation;
        this.updateChatWindow();
        if (conversation.type === "group") {
            for (let user of conversation.users) {
                this.usersInGroup[user._id] = user;
            }
        }
        this.selectInput("textarea");
        this.resetInputs();
        this.toggleSidebar();
    }

    /* CHAT UPPER TOOLBAR */
    addUserToConversation() {
        var updateMongo = false;
        var users: chat.Contact[] = [];
        for (let user of this.selectedUsers) {
            if (!this.usersInGroup[user._id]) {
                updateMongo = true;
                users.push(user);
                this.selectedConversation.name += ", " + user.name;
                this.selectedConversation.users.push(user);
                this.usersInGroup[user._id] = user;
            }
        }
        if (updateMongo) {
            //UPDATE MONGO
            this.$http.post("/conversations/" + this.selectedConversation._id + "/users", { users })
                .then((response: angular.IHttpPromiseCallbackArg<chat.Conversation>) => {
                    console.log("user added to conversation");
                    this.socketIO.emit("join:group", response.data);
                });
        }

        this.selectedUsers = [];
    }

    /* CHAT LOWER TOOLBAR */
    selectInput(input: string) {
        this.selectedInput = input;
        if (input === "canvas") {
            this.$timeout(() => {
                angular.element(this.canvas).attr('width', this.canvasContainer.width()); //max width
                angular.element(this.canvas).attr('height', this.canvasContainer.height()); //max height

                //Call a function to redraw other content (texts, images etc)
                this.redraw();
            }, 100);
        } else {
            this.$timeout(() => {
                angular.element("#txtMessage").focus();
            }, 100);
        }
    }


    sendMessage() {
        var messageType: string = "text";
        if (this.selectedInput === "canvas") {
            this.message = this.canvas.toDataURL("image/png");
            messageType = "image"
        }

        var message = {
            sender: {
                _id: this.user._id,
                name: this.user.name,
                avatar: this.user.avatar,
                email: this.user.email
            },
            messageType: messageType,
            message: this.message
        };

        this.socketIO.emit("send:message", {
            conversation: this.selectedConversation._id,
            sender: message.sender,
            message: message.message,
            messageType: message.messageType
        });

        this.selectedConversation.messages.push(message);
        this.resetInputs();
        this.updateChatWindow();
        this.$http.post("/conversations/" + this.selectedConversation._id + "/messages", message);
    }

    private resetInputs() {
        this.message = "";
        this.clickX = [];
        this.clickY = [];
        this.clickDrag = [];
        this.redraw();
    }

    /* MESSAGES WINDOW */
    private updateChatWindow() {
        this.$timeout(() => {
            var chatWindow = angular.element("#content");
            chatWindow.scrollTop(chatWindow[0].scrollHeight);
        }, 50);
    }



    /* CANVAS */
    canvasMouseDown(event: JQueryEventObject) {
        // var mouseX = event.pageX - this.offsetLeft;
        // var mouseY = event.pageY - this.offsetTop;
        var mouseX = event.offsetX;
        var mouseY = event.offsetY;
        this.paint = true;
        this.addClick(mouseX, mouseY);
        this.redraw();
    }

    canvasMouseMove(event: JQueryEventObject) {
        if (this.paint) {
            this.addClick(event.offsetX, event.offsetY, true);
            this.redraw();
        }
    }

    canvasMouseUp(event: JQueryEventObject) {
        this.paint = false;
        this.redraw();
    }

    canvasMouseLeave(event: JQueryEventObject) {
        this.paint = false;
    }

    addClick(x: number, y: number, dragging?: boolean) {
        this.clickX.push(x);
        this.clickY.push(y);
        this.clickDrag.push(dragging);
    }

    redraw() {
        this.context.strokeStyle = "black";
        this.context.lineJoin = "round";
        this.context.lineWidth = 5;
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height); // Clears the canvas
        for (var i = 0; i < this.clickX.length; i++) {
            this.context.beginPath();
            if (this.clickDrag[i] && i) {
                this.context.moveTo(this.clickX[i - 1], this.clickY[i - 1]);
            } else {
                this.context.moveTo(this.clickX[i] - 1, this.clickY[i]);
            }
            this.context.lineTo(this.clickX[i], this.clickY[i]);
            this.context.closePath();
            this.context.stroke();
        }
    }

}

angular.module("chatApp")
    .controller("chatCtrl", ChatCtrl);