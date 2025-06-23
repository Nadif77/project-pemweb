const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Submit attendance (students only)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("student"), // Only students can submit attendance
  attendanceController.submitAttendance
);

// Get attendance records (students see their own, teachers/admin see all)
router.get("/", authenticateToken, attendanceController.getAttendanceRecords);

// Check today's attendance status for student
router.get(
  "/today",
  authenticateToken,
  authorizeRoles("student"), // Only students can check their own daily attendance
  attendanceController.checkTodayAttendanceStatus
);

module.exports = router;
