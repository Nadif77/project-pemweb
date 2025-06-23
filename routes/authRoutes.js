const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Login route
router.post("/login", authController.login);

// Get current user info route
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
