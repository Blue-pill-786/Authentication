const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcrypt');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(passport) {
  // Local strategy for email/password authentication
  passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email });
      if (!user) return done(null, false, { message: 'Incorrect email' });

      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password' });
      }
    } catch (error) {
      return done(error);
    }
  }));

  // Google strategy for Google authentication
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    scope: ['profile', 'email']
  }, async function(accessToken, refreshToken, profile, done) {
    try {
      // Check if the user already exists in your database
      let user = await User.findOne({ googleId: profile.id });
  
      if (user) {
        // If the user already exists, return the user
        return done(null, user);
      } else {
        // Check if a user with the same email already exists
        const existingUser = await User.findOne({ email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null });
  
        if (existingUser) {
          // If a user with the same email exists, log in the user
          return done(null, existingUser);
        } else {
          // If the user doesn't exist, create a new user with profile information
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null
            // Add additional fields as needed
          });
  
          // Save the new user to the database
          user = await newUser.save();
  
          // Return the new user
          return done(null, user);
        }
      }
    } catch (error) {
      return done(error);
    }
  }));
  
  

  // Serialization and deserialization functions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
