import * as express from 'express';
import * as User from '../models/user';
import * as Conversation from "../models/conversation";

var router = express.Router();

/* GET home page. */
router.get('/:userid', function (req, res) {
    //retrieve all users from Mongo except for the one passed as a parameter
    User.find({ "_id": { $ne: req.params.userid } }, { name: 1, email: 1, avatar: 1 }, function (err, users) {
        if (err) {
            return console.error(err);
        } else {
            //JSON response will show all users in JSON format
            res.json(users);
        }
    });
});

router.post("/:userid/contacts", function (req, res) {
    var contacts: chat.Contact[] = req.body.contacts;
    User.findById(req.params.userid, function (err, user) {
        if (err) {
            return console.error(err);
        } else {
            for (let contact of contacts) {
                User.findByIdAndUpdate(contact._id,
                    {
                        $push: {
                            "contacts": {
                                _id: user._id,
                                name: user.name,
                                avatar: user.avatar,
                                email: user.email,
                                status: contact.status
                            }
                        }
                    },
                    { new: true },
                    function (err, contactUser) {
                        if (err) {
                            return console.error(err);
                        } else {
                            if (contact.status === "accepted") {
                                User.findOneAndUpdate({ "_id": user._id, "contacts._id": contact._id },
                                    { "contacts.$.status": "accepted" }, function (err, user) {
                                        if (err) {
                                            return console.log(err);
                                        }
                                    });
                            }
                        }
                    });
            }

            res.json(user);
        }
    });
});

router.get("/:userid/contacts", function (req, res) {
    User.findById(req.params.userid, function (err, user) {
        if (err) {
            return console.error(err);
        } else {
            //JSON response will show all users in JSON format
            res.json(user.contacts);
        }
    })
});

router.get("/:userid/conversations", function (req, res, next) {
    if (!req.params.userid) {
        return next(new Error('No user id.'));
    }
    //retrieve all conversations from Monogo
    Conversation.find({ "users._id": req.params.userid }, function (err, conversations) {
        if (err) {
            return console.error(err);
        } else {
            //JSON response will show all conversations in JSON format
            res.json(conversations);
        }
    });
});

export = router;