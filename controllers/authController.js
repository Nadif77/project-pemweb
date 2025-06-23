const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { JWT_SECRET } = require("../config/config");

// Login controller function
const login = (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    // Query database for user
    if (err) {
      console.error("Database error during login:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" }); // Invalid username or password
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" } // Token expires in 24 hours
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        class: user.class,
      },
    });
  });
};

// Get current user info controller function
const getMe = (req, res) => {
  res.json({ user: req.user }); // User info already attached by authenticateToken middleware
};

module.exports = { login, getMe };
