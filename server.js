const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bodyParser = require('body-parser');

// Initialize express app
const app = express();
const PORT = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected..."))
  .catch(err => console.log("Error connecting to MongoDB:", err));

// Express Session and Passport initialization
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Use body-parser to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Define the User Schema for storing user data
const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  username: String,
});
const User = mongoose.model('User', userSchema);

// Passport Google Strategy setup
passport.use(new GoogleStrategy({
  clientID: 'YOUR_GOOGLE_CLIENT_ID', // Use your client ID here
  clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET', // Use your client secret here
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      // If the user doesn't exist, create a new one
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName
      });
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// routing 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/loginup.html');
});

app.get('/services', (req, res) => {
    res.sendFile(__dirname + '/services.html');
  });


  app.get('/about', (req, res) => {
    res.sendFile(__dirname + '/about.html');
  });

  
app.get('/contact', (req, res) => {
    res.sendFile(__dirname + '/contact.html');
  });

  app.get('/profile', (req, res) => {
    res.sendFile(__dirname + '/profile.html');
  });


  

// Google OAuth route
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback route
app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
}), (req, res) => {
  res.redirect('/dashboard'); // Redirect to a dashboard or home page after successful login
});

// Route to check if the user is logged in
app.get('/dashboard', (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  res.send(`Welcome ${req.user.username}`);
});

// Route to logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
