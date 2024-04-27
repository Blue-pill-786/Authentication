const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const {ensureAuthenticated} = require('../controllers/authController')

//welcome
router.get('/', authController.getWelcome);
// Signup
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

// Login
router.get('/login', authController.getLogin);
router.post('/login', passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}));

// Logout
router.get('/logout', authController.logout);

// Home
router.get('/home',ensureAuthenticated, authController.getHome);

//resetpassword
router.get('/resetpassword', authController.getResetPassword);
router.post('/resetpassword', authController.postResetPassword);
router.get('/resetpassword/success', authController.getResetPasswordSuccess);

//Google routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });
// router.get('/reset-password', (req, res) => {
//     // You can render a reset password form here
//     res.send('Reset Password Form');
// });

module.exports = router;
