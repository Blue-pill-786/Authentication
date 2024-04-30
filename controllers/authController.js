const bcrypt = require('bcrypt');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport'); // Add passport import
const Brevo = require('@getbrevo/brevo'); // Add Brevo import



exports.getSignup = (req, res) => {
  res.render('register');
};

exports.postSignup = async (req, res) => {
  const { name,email, password, confirmPassword } = req.body;

  // Validation: Check if passwords match
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/signup');
  }

  // Validation: Check if email is unique
  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    req.flash('error', 'Email already registered');
    return res.redirect('/signup');
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name,email, password: hashedPassword });
  await newUser.save();

  res.redirect('/login');
};

exports.getLogin = (req, res) => {
  res.render('login');
};
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login'); // Redirect to login page if authentication fails
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('home'); // Redirect to home page if authentication succeeds
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) {
      // Handle error
      console.error(err);
      return res.redirect('/'); // Redirect to home page or appropriate route
    }
    // Successful logout
    res.redirect('/');
  });
};

var user;

exports.getHome = (req, res) => {
  user=req.user;
  console.log("user:",user);
  res.render('home', { 
    user: req.user
   });
};


exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login'); // Redirect to the login page if the user is not authenticated
};

exports.getWelcome = (req, res) => {
  res.render('welcome'); // This assumes your welcome.ejs file is located in the views folder
};
//generate reset token
function generateResetToken() {
  // Implement token generation logic here
  return crypto.randomBytes(32).toString('hex');

}
//reset password
exports.postResetPassword = async (req, res) => {
    const { email } = req.body;

    // Generate a reset password token (you can use a library like `crypto` to generate a unique token)
    const resetToken = generateResetToken();
    // console.log("token",resetToken);
    // Save the reset token in the database or cache with the user's email (not implemented here)

    // Send an email with the reset password link
    sendResetPasswordEmail(email, resetToken);

    // Redirect to a page indicating that the reset password email has been sent
    res.redirect('/resetpassword/success');
};

exports.getResetPassword = (req, res) => {
    res.render('pre-reset');
};

exports.getResetPasswordSuccess =(req, res)=>{
    res.render('resetpasswordsuccess');
}



// Function to generate a reset password token (implement as needed)


// Function to send a reset password email
// // Function to send a reset password email
function sendResetPasswordEmail(email, resetToken) {
  // Configure nodemailer to send email (replace placeholders with your SMTP settings)
  
  const transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "api",
      pass: "6639b92543819582e59793890d15be42",
    },
  });
  // console.log(transporter)

  // Email content
  const mailOptions = {
      from: '"Maddison Foo Koch 👻" <reset@demomailtrap.com>',
      to: email,
      subject: 'Reset Your Password',
      text: "reset your password",
      html: `<p>Click the following link to reset your password:</p>
             <a href="http://authentication-xx4n.onrender.com/resetpassword/${resetToken}">Reset Password</a>`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error('Error sending reset password email:', error);
      } else {
          // console.log('Reset password email sent:', info.response);
      }
  });
}







exports.resetpassword = (req, res)=>{
  const email = req.user.email;
  // console.log("email:",email);

  // Generate a new reset token and save it on the users model
 
  res.render('reset-password');
 
};



exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    // Validate password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error('Invalid password');

    // Generate token for password reset
    const resetToken = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

    // Store token and its expiration date in user document
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();
    // console.log("reset", resetToken)
    // Send token to user (For demonstration purposes, we'll just send it in the response)
    return res.redirect('home',{resetToken});
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.reset = async (req, res) => {
  const { newPassword, confirmNewPassword, resetToken } = req.body;
  try {
    // Check that passwords match
    if (newPassword !== confirmNewPassword) {
      throw new Error('Passwords do not match');
    }

    // Find the user based on the provided reset token
    const userr = await User.findOne( user );

    // Verify if the user exists
    if (!user) {
      throw new Error('Invalid token');
    }

    // Verify if the token is expired
    if (userr.resetTokenExpiration && userr.resetTokenExpiration < Date.now()) {
      throw new Error('Expired token');
    }

    // Hash the new password and update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userr.password = hashedPassword;
    userr.resetToken = null; // Remove reset token
    userr.resetTokenExpiration = null; // Remove reset token expiration
    await userr.save();

    // Redirect to the home page after resetting the password
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};



