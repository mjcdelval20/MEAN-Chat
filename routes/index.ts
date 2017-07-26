import * as express from 'express';
import * as passport from 'passport';
import * as User from '../models/user';

var router = express.Router();

/* GET home page. */
router.get('/chat', function (req, res) {
    res.redirect('/');
});

router.get("/authenticate", function (req, res) {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.json({});
    }
});

/* Authentication Routes */
router.post('/login', passport.authenticate('local'), function (req, res) {
    res.json(req.user);
});

router.get('/logout', function (req, res) {
    req.logout();
    res.json({});
});

router.post('/signup', function (req, res, next) {
    User.register(new User({ email: req.body.email, name: req.body.name }), req.body.password, function (err) {
        if (err) {
            //Error Handling for repeated user or other sign up related errors
            console.log('error while user register!', err);
            //return res.render('index', { error : err.message });
            return next(err);
        }

        passport.authenticate('local')(req, res, function () {
            req.session.save(function (err) {
                if (err) {
                    return next(err);
                }
                //res.redirect('/');
                res.json(req.user);
            });
        });
    });
});

// handle the callback after facebook has authenticated the user
router.post('/auth/facebook/callback', function (req, res, next) {
    var searchQuery = {
        'facebook.id': req.body.id
    };
    User.findOne(searchQuery, function (err, user) {
        if (err) {
            return next(err);
        }
        if (user) {
            if (!req.isAuthenticated()) {
                req.login(user, function (err) {
                    return next(err);
                });
            }
            return res.json(user);
        } else {
            var user = new User();

            user.facebook.id = req.body.id;
            user.facebook.email = req.body.email;
            user.email = req.body.email;
            user.name = req.body.displayName;
            user.avatar = req.body.avatar;

            user.save(function (err) {
                if (err) {
                    throw err;
                }
                else {
                    req.login(user, function (err) {
                        return next(err);
                    });
                    return res.json(user);
                }
            });
        }
    });
});

export = router;