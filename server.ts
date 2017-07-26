import * as http from 'http';
import * as express from 'express';
import * as path from 'path';
import * as favicon from 'serve-favicon';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as passport from 'passport';
import * as session from 'express-session';
import * as errorHandler from 'errorhandler';
import * as methodOverride from 'method-override';
import * as mongoose from 'mongoose';
import * as connectMongo from 'connect-mongo';
import * as socketio from 'socket.io';

// *** EXPRESS *** //
const app = express();
app.set('port', process.env.PORT || 3000);

app.use(favicon(path.join(__dirname, 'public/assets/img', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());

// *** MONGOOSE *** //
var mongoStore = connectMongo(session);
mongoose.connect('mongodb://localhost/chat');

// *** AUTHENTICATION *** //
app.use(session({
    secret: 'secretword',
    resave: true,
    saveUninitialized: true,
    store: new mongoStore({ mongooseConnection: mongoose.connection }),
    cookie: { httpOnly: true, maxAge: 2419200000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Configure passport-local to use user model for authentication
var User = require('./models/user');
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// *** ROUTES *** //
const routes = require("./routes/index");
const users = require("./routes/users");
const conversations = require("./routes/conversations");
app.use('/', routes);
app.use('/users', users);
app.use('/conversations', conversations);
app.use(express.static(path.join(__dirname, 'public')));

// *** ERROR HANDLER *** //
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

// *** SOCKET.IO *** //
var clients: chat.SocketClients = {};
var server = http.createServer(app);
var io = socketio(server);
io.on("connection", function (socket) {
    console.log("client connected to server");
    socket.on("disconnecting", function () {
        var rooms = socket.rooms;
        console.log("client disconnecting from server");
        for (let room of Object.keys(rooms)) {
            socket.broadcast.to(room).emit("disconnect:contact", clients[socket.id]);
        }
        clients[socket.id] = undefined;

    });
    socket.on("connect:client", function (userid: string) {
        clients[socket.id] = userid;
    });

    socket.on("join", function (room: string) {
        console.log("joining room: " + room);
        socket.join(room);
    });

    socket.on('leave', function (room: string) {
        console.log("leaving room: " + room);
        socket.leave(room);
    });

    socket.on('send:message', function (message: chat.Message) {
        console.log("sending message");
        socket.broadcast.to(message.conversation).emit("new:message", message);
    });

    socket.on("create:conversation", function (conversation: chat.Conversation) {
        console.log("creating conversation: " + conversation._id);
        for (let user of conversation.users) {
            socket.broadcast.to(user._id).emit("add:conversation", conversation);
        }
    });

    socket.on("update:contacts", function (contacts: chat.Contact[]) {
        console.log("updating contact list of users affected");
        for (let contact of contacts) {
            socket.broadcast.to(contact._id).emit("refresh:contacts");
        }
    });

    socket.on("join:group", function (conversation: chat.Conversation) {
        console.log("Adding users to group");
        for (let user of conversation.users) {
            socket.broadcast.to(user._id).emit("add:conversation", conversation);
        }
    });

    socket.on("check:online", function (data: any) {
        if (data.online) {
            socket.broadcast.to(data.user).emit("update:contact-status", data);
        } else {
            data.online = true;
            socket.broadcast.to(data.contact).emit("update:contact-status", data);
        }

    });
});

// *** START SERVER *** //
server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});