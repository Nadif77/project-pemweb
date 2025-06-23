// controllers/userController.js
const db = require("../config/database");

// Get students list (teachers/admin only)
const getStudents = (req, res) => {
  db.all(
    'SELECT id, username, name, class FROM users WHERE role = "student" ORDER BY class, name', // Query to fetch student details
    [],
    (err, students) => {
      if (err) {
        console.error("Database error fetching students:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(students);
    }
  );
};

module.exports = { getStudents };
