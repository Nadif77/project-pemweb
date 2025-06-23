const express = require("express");
const router = express.Router();
const userController = require("../controllers/teacherController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Get all teachers
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  userController.getAllTeachers
);

// Add a new teacher
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  userController.addTeacher
);

// Update an existing teacher
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  userController.updateTeacher
);

// Delete a teacher
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  userController.deleteTeacher
);

module.exports = router;
