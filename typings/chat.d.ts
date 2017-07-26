declare module 'chat' {
    export = chat;
}

declare namespace chat {
    export interface Contact {
        _id: string,
        email: string,
        name: string,
        avatar: string,
        online?: boolean,
        status?: string
    }

    export interface Contacts {
        [index: string]: Contact
    }

    export interface User {
        _id: any,
        email: string,
        name: string,
        avatar: string,
        facebook: {
            id: string,
            email: string,
        },
        contacts: [Contact]
    }

    export interface LoginData {
        email: string,
        password: string
    }

    export interface SignupData {
        email: string,
        password: string,
        name: string
    }

    export interface Conversation {
        _id: any,
        name?: string,
        avatar?: string,
        users: Contact[],
        messages: Message[],
        type: string,
        unread?: number
    }

    export interface Conversations {
        [index: string]: Conversation
    }

    export interface UsersXConversations {
        [index: string]: string
    }

    export interface Message {
        conversation?: string,
        message: string,
        messageType: string,
        sender: Contact
    }

    export interface LoginFbService {
        login(): angular.IPromise<chat.User>;
    }

    export interface UserService {
        loginFb(): angular.IPromise<User>;
        loginEmail(data: LoginData): angular.IPromise<User>;
        signUp(data: SignupData): angular.IPromise<User>;
        getUser(): User;
        authenticate(): angular.IPromise<string>;
        logout(): angular.IPromise<User>;
    }

    export interface Socket {
        connect(userid: string): void;
        disconnect(): void;
        on(eventName: string, callback: Function): void;
        emit(eventName: string, data: any, callback?: Function): void;
    }

    export interface SocketClients {
        [index: string]: string;
    }
}