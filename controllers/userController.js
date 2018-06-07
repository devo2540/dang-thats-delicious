const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login' });    // render login page
};

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register' });  // render register page 
};

exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name');   // sanitize req.body.name
    req.checkBody('name', 'You must supply a name!').notEmpty();    // check to make sure a name has been entered
    req.checkBody('email', 'That email is not valid!').isEmail();  // check to make sure email is entered and valid
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: true,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank!').notEmpty();  // check to make sure password is not empty 
    req.checkBody('password-confirm', 'Please confirm your password!').notEmpty(); 
    req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password)

    const errors = req.validationErrors();
    if (errors) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });

        return; // if errors, stop running
    }
    next(); // no errors, continue
};

exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });  // get user name/email from req
    const register = promisify(User.register, User);
    await register(user, req.body.password);    // take password and encrpyt 

    next(); // pass to authController.login
};

exports.account = (req, res) => {
    res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user._id},    // query
        { $set: updates},   // take const updates and set on top of whatever is already in DB 
        { new: true, runValidators: true, context: 'query' }    // return new info, run through validators
    );
    req.flash('success', 'Your profile has been updated!');
    res.redirect('back');   // send user right back to URL they came from
};