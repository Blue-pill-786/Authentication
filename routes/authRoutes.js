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

router.post('/login', 
passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }),
authController.login);

// Logout
router.get('/logout', authController.logout);

// Home
router.get('/home',ensureAuthenticated,  authController.getHome);

//resetpassword
// Route for displaying the reset password form
router.get('/resetpassword', authController.getResetPassword);

// Route for handling the submission of the reset password form
router.post('/resetpassword', authController.postResetPassword);

// Route for displaying a success message after resetting the password
router.get('/resetpassword/success', authController.getResetPasswordSuccess);

// Route for initiating the password reset process
router.get('/reset', authController.resetpassword);
router.post('/reset', authController.reset)


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
