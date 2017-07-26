import * as express from 'express';
import * as Conversation from '../models/conversation';
import * as mongoose from 'mongoose';
var router = express.Router();

router.post('/', function (req, res) {
    //CREATE CONVERSATION
    var conversation = new Conversation();
    conversation.avatar = req.body.avatar;
    conversation.users = req.body.users;
    conversation.messages = req.body.messages;
    conversation.type = req.body.type;
    conversation.save(function (err, conversation) {
        if (err) {
            throw err;
        }
        else {
            return res.json(conversation);
        }
    })
});

router.post('/:conversationid/messages', function (req, res, next) {
    //ADD MESSAGE TO CONVERSATION
    Conversation.findByIdAndUpdate(req.params.conversationid,
        {
            $push: {
                "messages": {
                    sender: req.body.sender,
                    message: req.body.message,
                    messageType: req.body.messageType
                }
            }
        }, function (err, conversation) {
            if (err) {
                return console.error(err);
            }
            res.json(conversation);
        });
});

router.post('/:conversationid/users', function (req, res, next) {
    //ADD USERS TO CONVERSATION
    var users: chat.Contact[] = req.body.users;
    Conversation.findByIdAndUpdate(req.params.conversationid,
        {
            $push: {
                "users": {
                    $each: users
                }
            }
        }, { new: true }, function (err, conversation) {
            if (err) {
                return console.error(err);
            }
            res.json(conversation);
        });
});

export = router;