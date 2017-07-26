import * as mongoose from 'mongoose';
import * as passportLocalMongoose from 'passport-local-mongoose';

var Schema = mongoose.Schema;

// create User Schema
var UserSchema = new Schema({
    email: String,
    name: String,
    avatar: { type: String, default: "/assets/img/ghosty.png" },
    facebook: {
        id: String,
        email: String,
    },
    contacts: [
        {
            id: String,
            email: String,
            name: String,
            avatar: String,
            status: String
        }
    ]
});

var options = {
    usernameField: "email"
};

UserSchema.plugin(passportLocalMongoose, options);
interface UserModel extends chat.User, mongoose.PassportLocalDocument { }
var User = mongoose.model<UserModel>('User', UserSchema);

export = User;