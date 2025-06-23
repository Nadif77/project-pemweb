const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs"); // Needed for hashing default passwords

const DB_PATH = "school.db"; // Database file name

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    initializeDb();
  }
});

function initializeDb() {
  db.serialize(() => {
    // Users table (students and teachers/admin)
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
            class TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      (err) => {
        if (err) console.error("Error creating users table:", err.message);
        else insertDefaultUsers();
      }
    );

    // Materials table
    db.run(
      `CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            file_path TEXT,
            file_name TEXT,
            subject TEXT,
            class TEXT,
            uploaded_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaded_by) REFERENCES users (id)
        )`,
      (err) => {
        if (err) console.error("Error creating materials table:", err.message);
      }
    );

    // Attendance table
    db.run(
      `CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            date DATE,
            status TEXT CHECK(status IN ('present', 'absent', 'late')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users (id)
        )`,
      (err) => {
        if (err) console.error("Error creating attendance table:", err.message);
      }
    );

    // New Enrollments table for student registrations
    db.run(
      `CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            dob TEXT NOT NULL, -- Date of Birth (e.g., "Yogyakarta, 12 Januari 2017")
            address TEXT NOT NULL,
            parent_name TEXT NOT NULL,
            parent_phone TEXT NOT NULL,
            target_class TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      (err) => {
        if (err)
          console.error("Error creating enrollments table:", err.message);
      }
    );
  });
}

function insertDefaultUsers() {
  const adminPassword = bcrypt.hashSync("admin123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, name, role) 
            VALUES ('admin', ?, 'Administrator', 'admin')`,
    [adminPassword],
    (err) => {
      // Insert default admin
      if (err) console.error("Error inserting default admin:", err.message);
    }
  );

  const teacherPassword = bcrypt.hashSync("teacher123", 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password, name, role) 
            VALUES ('guru1', ?, 'Bapak Andi Saputra', 'teacher')`,
    [teacherPassword],
    (err) => {
      // Insert sample teacher
      if (err) console.error("Error inserting sample teacher:", err.message);
    }
  );

  const studentPassword = bcrypt.hashSync("student123", 10);
  const students = [
    // Insert sample students
    ["siswa1", "Ahmad Rizki", "Kelas 1"],
    ["siswa2", "Siti Aminah", "Kelas 1"],
    ["siswa3", "Budi Santoso", "Kelas 2"],
    ["siswa4", "Dewi Sartika", "Kelas 2"],
    ["siswa5", "Fajar Nugraha", "Kelas 3"],
  ];

  students.forEach(([username, name, kelas]) => {
    db.run(
      `INSERT OR IGNORE INTO users (username, password, name, role, class) 
                VALUES (?, ?, ?, 'student', ?)`,
      [username, studentPassword, name, kelas],
      (err) => {
        if (err)
          console.error(`Error inserting student ${username}:`, err.message);
      }
    );
  });
}

// Export a function to get the database instance
// This allows other modules to use the same database connection
module.exports = db;
