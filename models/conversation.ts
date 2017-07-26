import * as mongoose from 'mongoose';

var Schema = mongoose.Schema;

// create User Schema
var ConversationSchema = new Schema({
    name: String,
    avatar: { type: String, default: "/assets/img/ghosty.png" },
    users: [{
        _id: String,
        email: String,
        name: String,
        avatar: String
    }],
    messages: [{
        sender: {
            _id: String,
            email: String,
            name: String,
            avatar: String
        },
        messageType: String,
        message: String
    }],
    type: String
});

interface ConversationModel extends chat.Conversation, mongoose.Document { }
var Conversation = mongoose.model<ConversationModel>('Conversation', ConversationSchema);

export = Conversation;