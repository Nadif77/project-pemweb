const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from header

  if (!token) {
    return res.status(401).json({ error: "Access token required" }); // No token provided
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" }); // Token verification failed
    }
    req.user = user; // Attach user payload to request
    next(); // Proceed to the next middleware/route handler
  });
};

// Middleware for role-based authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" }); // User does not have required role
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
