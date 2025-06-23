const db = require("../config/database");
const bcrypt = require("bcryptjs");

// Helper to promisify db.get for async/await use
const dbGetAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to promisify db.run for async/await use
const dbRunAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    // Use 'function' keyword to retain 'this' context for lastID/changes
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this); // 'this' contains lastID, changes
    });
  });
};

// Get all teachers
const getAllTeachers = (req, res) => {
  db.all(
    'SELECT id, username, name FROM users WHERE role = "teacher" ORDER BY name',
    [],
    (err, teachers) => {
      if (err) {
        console.error("Database error fetching teachers:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(teachers);
    }
  );
};

// Add a new teacher
const addTeacher = async (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res
      .status(400)
      .json({
        error: "Username, password, and name are required for a new teacher.",
      });
  }

  try {
    // Check if username already exists
    const existingUser = await dbGetAsync(
      "SELECT username FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new teacher into the database
    const result = await dbRunAsync(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, "teacher")',
      [username, hashedPassword, name]
    );
    res
      .status(201)
      .json({ id: result.lastID, message: "Teacher added successfully." });
  } catch (err) {
    console.error("Error adding new teacher:", err.message);
    // Catch specific unique constraint error for a more user-friendly message
    if (
      err.message &&
      err.message.includes("UNIQUE constraint failed: users.username")
    ) {
      return res.status(409).json({ error: "Username already exists." });
    }
    res.status(500).json({ error: "Internal server error." });
  }
};

// Update an existing teacher
const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { username, name, password } = req.body; // Password is optional for update

  if (!username || !name) {
    return res
      .status(400)
      .json({
        error: "Username and name are required for updating a teacher.",
      });
  }

  try {
    // Verify the user exists and is a teacher
    const user = await dbGetAsync(
      'SELECT id, password FROM users WHERE id = ? AND role = "teacher"',
      [id]
    );
    if (!user) {
      return res
        .status(404)
        .json({ error: "Teacher not found or unauthorized." });
    }

    let updateQuery = "UPDATE users SET username = ?, name = ?";
    let queryParams = [username, name];

    // If password is provided, hash it and add to the update query
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ", password = ?";
      queryParams.push(hashedPassword);
    }

    updateQuery += " WHERE id = ?";
    queryParams.push(id);

    // Execute the update query
    const result = await dbRunAsync(updateQuery, queryParams);
    if (result.changes === 0) {
      // This might happen if the ID is valid but no actual changes were made to values
      return res
        .status(404)
        .json({ error: "Teacher not found or no changes made." });
    }
    res.json({ message: "Teacher updated successfully." });
  } catch (err) {
    console.error("Error updating teacher:", err.message);
    // Catch specific unique constraint error for username
    if (
      err.message &&
      err.message.includes("UNIQUE constraint failed: users.username")
    ) {
      return res.status(409).json({ error: "Username already exists." });
    }
    res.status(500).json({ error: "Internal server error." });
  }
};

// Delete a teacher
const deleteTeacher = (req, res) => {
  const { id } = req.params;

  // Ensure only teachers can be deleted and prevent deleting admin itself
  db.run(
    'DELETE FROM users WHERE id = ? AND role = "teacher"',
    [id],
    function (err) {
      if (err) {
        console.error("Database error deleting teacher:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({
            error:
              "Teacher not found or unable to delete (e.g., trying to delete admin).",
          });
      }
      res.json({ message: "Teacher deleted successfully." });
    }
  );
};

module.exports = {
  getAllTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
};
