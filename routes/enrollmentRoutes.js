const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");

// Public route to submit a new enrollment application
router.post("/", enrollmentController.submitEnrollment);

// Admin-only routes for managing enrollments
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  enrollmentController.getAllEnrollments
);
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  enrollmentController.getEnrollmentById
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  enrollmentController.updateEnrollment
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  enrollmentController.deleteEnrollment
);

// Admin-only route to approve an enrollment and create a student user
router.post(
  "/:id/approve",
  authenticateToken,
  authorizeRoles("admin"),
  enrollmentController.approveEnrollment
);

module.exports = router;
