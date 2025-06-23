const db = require("../config/database");

// Submit attendance (students only)
const submitAttendance = (req, res) => {
  const { status, notes } = req.body;
  const studentId = req.user.id;
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  // Check if attendance is already marked for today
  db.get(
    "SELECT * FROM attendance WHERE student_id = ? AND date = ?",
    [studentId, today],
    (err, existing) => {
      if (err) {
        console.error(
          "Database error checking existing attendance:",
          err.message
        );
        return res.status(500).json({ error: "Database error" });
      }

      if (existing) {
        return res
          .status(400)
          .json({ error: "Attendance already marked for today" });
      }

      // Insert new attendance record
      db.run(
        "INSERT INTO attendance (student_id, date, status, notes) VALUES (?, ?, ?, ?)",
        [studentId, today, status || "present", notes],
        function (insertErr) {
          if (insertErr) {
            console.error(
              "Database error submitting attendance:",
              insertErr.message
            );
            return res.status(500).json({ error: "Database error" });
          }
          res.status(201).json({ message: "Attendance marked successfully" });
        }
      );
    }
  );
};

// Get attendance records (students see their own, teachers/admin see all)
const getAttendanceRecords = (req, res) => {
  let query, params;

  if (req.user.role === "student") {
    // Students can only see their own attendance
    query = `
            SELECT a.*, u.name as student_name 
            FROM attendance a 
            LEFT JOIN users u ON a.student_id = u.id 
            WHERE a.student_id = ? 
            ORDER BY a.date DESC
        `;
    params = [req.user.id];
  } else {
    // Teachers/admin can see all attendance
    query = `
            SELECT a.*, u.name as student_name, u.class 
            FROM attendance a 
            LEFT JOIN users u ON a.student_id = u.id 
            ORDER BY a.date DESC, u.name
        `;
    params = [];
  }

  db.all(query, params, (err, attendance) => {
    if (err) {
      console.error("Database error fetching attendance records:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(attendance);
  });
};

// Check today's attendance status for student
const checkTodayAttendanceStatus = (req, res) => {
  const studentId = req.user.id;
  const today = new Date().toISOString().split("T")[0]; // Get today's date

  db.get(
    "SELECT * FROM attendance WHERE student_id = ? AND date = ?",
    [studentId, today],
    (err, attendance) => {
      // Query for today's attendance
      if (err) {
        console.error(
          "Database error checking today's attendance:",
          err.message
        );
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ hasAttendance: !!attendance, attendance });
    }
  );
};

module.exports = {
  submitAttendance,
  getAttendanceRecords,
  checkTodayAttendanceStatus,
};
