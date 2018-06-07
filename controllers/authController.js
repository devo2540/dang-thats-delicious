const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out.')
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    // check if user is authenticated
    if (req.isAuthenticated()) {
        next(); // carry on, user is logged in
        return;
    } 
    req.flash('error', 'Oops! You must be logged in to add a store!');
    res.redirect('/login');
};

exports.forgot = async (req, res) => {
    // 1. See if user with that email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        req.flash('error', 'No account is associated with that login');
        return res.redirect('/login');
    }
    // 2. Set reset tokens and expiry on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');   // reset code
    user.resetPasswordExpires = Date.now() + 3600000;  // expires 1 hour from now
    await user.save();
    // 3. Send them email with token
    const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    req.flash('success', `You have been emailed a password reset link. ${resetUrl}`);
    // 4. Redirect to login page.
    res.redirect('/login');
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,   // get token from request
        resetPasswordExpires: { $gt: Date.now() }   // check that token isnt expired
    });
    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired.');
        return res.redirect('/login');
    }
    // if there is a user, show reset password form
    res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Passwords do not match!');
    res.redirect('back');
};

exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,   // get token from request
        resetPasswordExpires: { $gt: Date.now() }   // check that token isnt expired
    });
    if (!user) {
        req.flash('error', 'Password reset is invalid or has expired.');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);

    user.resetPasswordToken = undefined;    // remove from database
    user.resetPasswordExpires = undefined;  // remove from database
    const updatedUser = await user.save();  // save to database 
    
    await req.login(updatedUser);
    req.flash('success', 'Your password has been updated!');
    res.redirect('/');
};