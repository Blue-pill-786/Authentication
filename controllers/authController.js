const bcrypt = require('bcrypt');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport'); // Add passport import
const user = require('../models/user');
require('../config/passport')(passport); 


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


exports.getHome = (req, res) => {
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
async function generateResetTokenAndStore(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
    await user.save();
    return resetToken;
  } catch (error) {
    console.error('Error generating and storing reset token:', error);
    throw error;
  }
}
//reset password
exports.postResetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const resetToken = await generateResetTokenAndStore(email);
    sendResetPasswordEmail(email, resetToken);
    res.redirect('/resetpassword/success');
  } catch (error) {
    console.error('Error generating reset password token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
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

  // Email content
  const mailOptions = {
      from: '"Maddison 👻" <reset@demomailtrap.com>',
      to: email,
      subject: 'Reset Your Password',
      text: "reset your password",
      html: `<p>Click the following link to reset your password:</p>
             <a href="http://authentication-xx4n.onrender.com/resettoken/${resetToken}">Reset Password</a>`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error('Error sending reset password email:', error);
      } else {
      
      }
  });
}







exports.resetpasswordpage = async (req, res) => {
  const email = req.user.email;
  

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    

    if (!user) {
      // Handle case where user is not found
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Generate a token that expires in 10mins 
    const expiryTime = Date.now() + 10 * 60 * 1000;
    const resetToken = (await generateResetTokenAndStore(email)).toString();
    
    // Save this reset token and expiry time on the users database document
    user.resetToken= resetToken;
    user.resetTokenExpiration= expiryTime;

    await user.save();

    // Render the reset password page
    res.render('reset-password');
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.gettokenreset = async (req, res) => {
  const resetToken = req.params.resetToken;
  try {
    const user = await User.findOne({
      resetToken: resetToken,
      resetTokenExpiration: { $gt: Date.now() } // Check if token is not expired
    });
    if (!user) {
      return res.status(400).send('Invalid or Expired Token');
    }
    res.render('resettoken', { resetToken }); // Render the reset password page
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    res.status(500).send('Server Error');
  }
};

// Function to handle resetting the password
exports.tokenreset = async (req, res) => {
  const token = req.body.token;
  const password = req.body.newPassword;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() } // Check if token is not expired
      },
      {
        $set: {
          password: await bcrypt.hash(password, 10),
          resetToken: null,
          resetTokenExpiration: null
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or Expired Token' });
    }

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};



exports.postReset = async (req, res) => {
  const { newPassword, confirmNewPassword } = req.body;
  const user = req.user;
  try {
    // Check that passwords match
    if (newPassword !== confirmNewPassword) {
      throw new Error('Passwords do not match');
    }

    // Find the user based on the provided reset token
    const userr = await User.findOne(user);
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



