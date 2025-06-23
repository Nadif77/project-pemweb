const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Get students list (teachers/admin only)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("teacher", "admin"), // Only teachers and admins can view student list
  userController.getStudents
);

module.exports = router;
