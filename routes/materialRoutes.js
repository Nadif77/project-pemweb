const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig"); // Import multer configuration

// Get all materials (accessible by all authenticated users)
router.get("/", authenticateToken, materialController.getAllMaterials);

// Upload material (teachers/admin only)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("teacher", "admin"), // Only teachers and admins can upload
  upload.single("file"), // Use multer to handle single file upload
  materialController.uploadMaterial
);

// Delete material (teachers/admin only)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("teacher", "admin"), // Only teachers and admins can delete
  materialController.deleteMaterial
);

module.exports = router;
