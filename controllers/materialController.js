const db = require("../config/database");
const fs = require("fs");
const path = require("path");

// Get all materials
const getAllMaterials = (req, res) => {
  const query = `
        SELECT m.*, u.name as uploaded_by_name 
        FROM materials m 
        LEFT JOIN users u ON m.uploaded_by = u.id 
        ORDER BY m.created_at DESC
    `; // SQL query to fetch materials with uploader name

  db.all(query, [], (err, materials) => {
    if (err) {
      console.error("Database error fetching materials:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(materials);
  });
};

// Upload material
const uploadMaterial = (req, res) => {
  const { title, description, subject, class: materialClass } = req.body;
  const file = req.file;

  if (!title) {
    // Title is required
    if (file) fs.unlinkSync(file.path); // Clean up uploaded file if validation fails
    return res.status(400).json({ error: "Title is required" });
  }

  const filePath = file ? file.path : null;
  const fileName = file ? file.originalname : null;

  db.run(
    "INSERT INTO materials (title, description, file_path, file_name, subject, class, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      title,
      description,
      filePath,
      fileName,
      subject,
      materialClass,
      req.user.id,
    ],
    function (err) {
      if (err) {
        console.error("Database error uploading material:", err.message);
        if (file) fs.unlinkSync(file.path); // Clean up uploaded file on DB error
        return res.status(500).json({ error: "Database error" });
      }
      res
        .status(201)
        .json({ id: this.lastID, message: "Material uploaded successfully" }); // Respond with success
    }
  );
};

// Delete material
const deleteMaterial = (req, res) => {
  const materialId = req.params.id;

  db.get(
    "SELECT file_path FROM materials WHERE id = ?",
    [materialId],
    (err, material) => {
      // Get file path before deleting from database
      if (err) {
        console.error(
          "Database error fetching material for deletion:",
          err.message
        );
        return res.status(500).json({ error: "Database error" });
      }

      if (material && material.file_path) {
        fs.unlink(material.file_path, (unlinkErr) => {
          // Delete file from filesystem
          if (unlinkErr)
            console.log("Error deleting file from filesystem:", unlinkErr);
        });
      }

      db.run(
        "DELETE FROM materials WHERE id = ?",
        [materialId],
        function (dbErr) {
          // Delete from database
          if (dbErr) {
            console.error(
              "Database error deleting material record:",
              dbErr.message
            );
            return res.status(500).json({ error: "Database error" });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: "Material not found" });
          }
          res.json({ message: "Material deleted successfully" });
        }
      );
    }
  );
};

module.exports = { getAllMaterials, uploadMaterial, deleteMaterial };
