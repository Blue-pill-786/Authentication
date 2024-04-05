const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
require('dotenv').config(); // Load variables from .env

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI ;
const SESSION_SECRET = process.env.SESSION_SECRET || 'mysecretkey';

// Connect to MongoDB
// mongoose.connect(MONGODB_URI);
//connect to mongodb
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});


app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 14 * 24 * 60 * 60, // Session TTL (optional)
    }),
}));


//use images
app.use(express.static('public'));
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Passport Configuration
require('./config/passport')(passport);

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());



// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Server
app.listen(PORT, () => console.log(`Server running `));
