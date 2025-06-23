const db = require("../config/database");
const bcrypt = require("bcryptjs"); // Needed for hashing student passwords if approved

// Submit a new enrollment application (public access)
const submitEnrollment = (req, res) => {
  const { full_name, dob, address, parent_name, parent_phone, target_class } =
    req.body;

  if (
    !full_name ||
    !dob ||
    !address ||
    !parent_name ||
    !parent_phone ||
    !target_class
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const query = `
        INSERT INTO enrollments (full_name, dob, address, parent_name, parent_phone, target_class, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
  db.run(
    query,
    [
      full_name,
      dob,
      address,
      parent_name,
      parent_phone,
      target_class,
      "pending",
    ],
    function (err) {
      if (err) {
        console.error("Database error submitting enrollment:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({
        id: this.lastID,
        message:
          "Enrollment application submitted successfully. We will contact you soon!",
      });
    }
  );
};

// Get all enrollment applications (Admin only)
const getAllEnrollments = (req, res) => {
  const query = `SELECT * FROM enrollments ORDER BY created_at DESC`;
  db.all(query, [], (err, enrollments) => {
    if (err) {
      console.error("Database error fetching enrollments:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(enrollments);
  });
};

// Get a single enrollment application by ID (Admin only)
const getEnrollmentById = (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM enrollments WHERE id = ?", [id], (err, enrollment) => {
    if (err) {
      console.error("Database error fetching single enrollment:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.json(enrollment);
  });
};

// Update an enrollment application (Admin only)
const updateEnrollment = (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    dob,
    address,
    parent_name,
    parent_phone,
    target_class,
    status,
    notes,
  } = req.body;

  if (
    !full_name ||
    !dob ||
    !address ||
    !parent_name ||
    !parent_phone ||
    !target_class ||
    !status
  ) {
    return res
      .status(400)
      .json({ error: "All fields (except notes) are required for update." });
  }

  const query = `
        UPDATE enrollments
        SET full_name = ?, dob = ?, address = ?, parent_name = ?, parent_phone = ?, target_class = ?, status = ?, notes = ?
        WHERE id = ?
    `;
  db.run(
    query,
    [
      full_name,
      dob,
      address,
      parent_name,
      parent_phone,
      target_class,
      status,
      notes,
      id,
    ],
    function (err) {
      if (err) {
        console.error("Database error updating enrollment:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json({ message: "Enrollment updated successfully" });
    }
  );
};

// Delete an enrollment application (Admin only)
const deleteEnrollment = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM enrollments WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Database error deleting enrollment:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }
    res.json({ message: "Enrollment deleted successfully" });
  });
};

// Approve an enrollment and create a new student user (Admin only)
const approveEnrollment = (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body; // Admin provides username and password for the new student

  if (!username || !password) {
    return res.status(400).json({
      error:
        "Username and password are required to approve enrollment and create a user.",
    });
  }

  db.get(
    'SELECT * FROM enrollments WHERE id = ? AND status = "pending"',
    [id],
    async (err, enrollment) => {
      if (err) {
        console.error(
          "Database error fetching enrollment for approval:",
          err.message
        );
        return res.status(500).json({ error: "Database error" });
      }
      if (!enrollment) {
        return res.status(404).json({
          error: "Pending enrollment not found or already processed.",
        });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Start a transaction for atomicity
        db.serialize(() => {
          db.run("BEGIN TRANSACTION;");

          // 1. Insert into users table
          const insertUserQuery = `
                    INSERT INTO users (username, password, name, role, class)
                    VALUES (?, ?, ?, 'student', ?)
                `;
          db.run(
            insertUserQuery,
            [
              username,
              hashedPassword,
              enrollment.full_name,
              enrollment.target_class,
            ],
            function (insertErr) {
              if (insertErr) {
                db.run("ROLLBACK;"); // Rollback on error
                console.error(
                  "Database error inserting new user during approval:",
                  insertErr.message
                );
                if (
                  insertErr.message.includes(
                    "UNIQUE constraint failed: users.username"
                  )
                ) {
                  return res
                    .status(409)
                    .json({ error: "Username already exists." });
                }
                return res
                  .status(500)
                  .json({ error: "Failed to create student user." });
              }

              // 2. Update enrollment status to 'approved'
              const updateEnrollmentQuery = `
                        UPDATE enrollments SET status = 'approved', notes = ? WHERE id = ?
                    `;
              db.run(
                updateEnrollmentQuery,
                [`Approved and user created: ${username}`, id],
                function (updateErr) {
                  if (updateErr) {
                    db.run("ROLLBACK;"); // Rollback on error
                    console.error(
                      "Database error updating enrollment status:",
                      updateErr.message
                    );
                    return res
                      .status(500)
                      .json({ error: "Failed to update enrollment status." });
                  }

                  db.run("COMMIT;", (commitErr) => {
                    if (commitErr) {
                      console.error(
                        "Database error committing transaction:",
                        commitErr.message
                      );
                      return res.status(500).json({
                        error: "Failed to complete approval process.",
                      });
                    }
                    res.json({
                      message: `Enrollment approved and student user '${username}' created successfully.`,
                    });
                  });
                }
              );
            }
          );
        });
      } catch (hashError) {
        console.error(
          "Error hashing password during enrollment approval:",
          hashError.message
        );
        res
          .status(500)
          .json({ error: "Internal server error during password hashing." });
      }
    }
  );
};

module.exports = {
  submitEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  approveEnrollment,
};
