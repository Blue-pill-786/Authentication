const bcrypt = require('bcrypt');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const user = require('../models/user');

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
      return res.redirect('/home'); // Redirect to home page if authentication succeeds
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


//reset password
exports.postResetPassword = async (req, res) => {
    const { email } = req.body;

    // Generate a reset password token (you can use a library like `crypto` to generate a unique token)
    const resetToken = generateResetToken();

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
function generateResetToken() {
    // Implement token generation logic here
}

// Function to send a reset password email
function sendResetPasswordEmail(email, resetToken) {
    // Configure nodemailer to send email (replace placeholders with your SMTP settings)
    const transporter = nodemailer.createTransport({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
            user: 'your-email@example.com',
            pass: 'your-email-password'
        }
    });

    // Email content
    const mailOptions = {
        from: 'your-email@example.com',
        to: email,
        subject: 'Reset Your Password',
        html: `<p>Click the following link to reset your password:</p>
               <a href="http://your-domain.com/resetpassword/${resetToken}">Reset Password</a>`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending reset password email:', error);
        } else {
            console.log('Reset password email sent:', info.response);
        }
    });
}

