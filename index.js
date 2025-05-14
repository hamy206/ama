const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const db = new sqlite3.Database('./ama.db');

// ✅ Session middleware
app.use(session({
  secret: 'ama_secret_2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Use true only if using HTTPS
}));

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from root

// ✅ Create users table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

// ✅ Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashedPassword],
    (err) => {
      if (err) {
        console.error('Signup Error:', err.message);
        return res.status(400).send('Email already in use.');
      }
      res.redirect('/login.html');
    }
  );
});

app.get('/login.html', (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/index.html');
  }
  next();
});


// ✅ Login route with session
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).send('Server error');
    if (!user) return res.status(400).send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Incorrect password');

    // ✅ Save user in session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    // ✅ Redirect to homepage after login
    res.redirect('/index.html');
  });
});


// ✅ Welcome page (only if logged in)
app.get('/welcome.html', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }

  res.send(`
    <h1>Welcome, ${req.session.user.name}!</h1>
    <p>You are logged in as ${req.session.user.email}</p>
    <a href="/logout">Logout</a>
  `);
});

// ✅ Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed.');
    }
    res.redirect('/login.html');
  });
});

// ✅ Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

