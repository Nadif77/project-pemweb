const API_BASE = "http://localhost:3000/api";
let currentUser = null;

// Check authentication on page load
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = JSON.parse(user);

  // Verify token is still valid
  try {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Token invalid");
    }
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
    return;
  }

  initializeDashboard();
});

// Custom alert/modal function (replacing default alert/confirm)
function showCustomAlert(message, type = "info", callback = null) {
  const modalId = "customAlertModal";
  let modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${modalId}Label" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-${type} text-white">
                        <h5 class="modal-title" id="${modalId}Label">${
    type === "success" ? "Sukses" : type === "danger" ? "Error" : "Informasi"
  }</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add confirmation buttons if a callback is provided
  if (callback) {
    modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header bg-${type} text-white">
                            <h5 class="modal-title" id="${modalId}Label">${
      type === "danger" ? "Konfirmasi Hapus" : "Konfirmasi"
    }</h5>
                            <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Batal</button>
                            <button type="button" class="btn btn-${type}" id="confirmActionButton">Ya</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  document.getElementById("content").insertAdjacentHTML("beforeend", modalHtml); // Insert outside main content for modal
  $(`#${modalId}`).modal("show");

  if (callback) {
    document.getElementById("confirmActionButton").onclick = () => {
      $(`#${modalId}`).modal("hide");
      callback();
    };
  }

  // Remove modal from DOM after it's hidden
  $(`#${modalId}`).on("hidden.bs.modal", function () {
    $(this).remove();
  });
}

function initializeDashboard() {
  // Update user info
  document.getElementById(
    "userInfo"
  ).textContent = `${currentUser.name} (${currentUser.role})`;

  // Setup sidebar navigation
  setupNavigation();

  // Load default content
  loadDashboardHome();
}

function setupNavigation() {
  const sidebar = document.getElementById("sidebarNav");
  let navItems = [];

  // Common navigation items
  navItems.push({
    id: "dashboard",
    icon: "fas fa-tachometer-alt",
    text: "Dashboard",
    onclick: "loadDashboardHome()",
  });

  if (currentUser.role === "student") {
    navItems.push(
      {
        id: "attendance",
        icon: "fas fa-calendar-check",
        text: "Presensi",
        onclick: "loadAttendanceForm()",
      },
      {
        id: "materials",
        icon: "fas fa-book",
        text: "Materi",
        onclick: "loadMaterials()",
      },
      {
        id: "my-attendance",
        icon: "fas fa-history",
        text: "Riwayat Presensi",
        onclick: "loadMyAttendance()",
      }
    );
  } else {
    // Teacher or Admin
    navItems.push(
      {
        id: "students",
        icon: "fas fa-users",
        text: "Data Siswa",
        onclick: "loadStudents()",
      },
      {
        id: "attendance-report",
        icon: "fas fa-chart-bar",
        text: "Laporan Presensi",
        onclick: "loadAttendanceReport()",
      },
      {
        id: "materials",
        icon: "fas fa-book",
        text: "Materi",
        onclick: "loadMaterials()",
      },
      {
        id: "upload-material",
        icon: "fas fa-upload",
        text: "Upload Materi",
        onclick: "loadUploadMaterial()",
      }
    );
    // New enrollment item for admin only
    if (currentUser.role === "admin") {
      navItems.push({
        id: "enrollments",
        icon: "fas fa-user-plus",
        text: "Pendaftaran Siswa Baru",
        onclick: "loadEnrollmentApplications()",
      });
    }
  }

  sidebar.innerHTML = navItems
    .map(
      (item) => `
        <a class="nav-link" href="#" id="nav-${item.id}" onclick="${item.onclick}">
            <i class="${item.icon}"></i>${item.text}
        </a>
    `
    )
    .join("");
}

function setActiveNav(activeId) {
  document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  const activeLink = document.getElementById(`nav-${activeId}`);
  if (activeLink) {
    activeLink.classList.add("active");
  }
}

async function loadDashboardHome() {
  setActiveNav("dashboard");

  let content = `
        <h2><i class="fas fa-tachometer-alt mr-2"></i>Dashboard</h2>
        <div class="row">
    `;

  if (currentUser.role === "student") {
    // Check today's attendance
    const attendanceToday = await checkTodayAttendance();

    content += `
            <div class="col-md-6">
                <div class="stat-card">
                    <h3><i class="fas fa-user"></i></h3>
                    <p class="mb-0">Selamat datang, ${currentUser.name}</p>
                    <small>Kelas: ${currentUser.class || "Tidak diset"}</small>
                </div>
            </div>
            <div class="col-md-6">
                <div class="stat-card">
                    <h3><i class="fas fa-calendar-check"></i></h3>
                    <p class="mb-0">Presensi Hari Ini</p>
                    <small>${
                      attendanceToday ? "Sudah Presensi" : "Belum Presensi"
                    }</small>
                </div>
            </div>
        `;
  } else {
    // Load statistics for teachers/admin
    const stats = await loadStatistics();

    content += `
            <div class="col-md-4">
                <div class="stat-card">
                    <h3>${stats.totalStudents}</h3>
                    <p class="mb-0">Total Siswa</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <h3>${stats.totalMaterials}</h3>
                    <p class="mb-0">Total Materi</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <h3>${stats.todayAttendance}</h3>
                    <p class="mb-0">Presensi Hari Ini</p>
                </div>
            </div>
        `;
  }

  content += `
        </div>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0"><i class="fas fa-info-circle mr-2"></i>Informasi</h5>
            </div>
            <div class="card-body">
                <p>Selamat datang di Sistem Pembelajaran Online SD Muhammadiyah Denpasar.</p>
                ${
                  currentUser.role === "student"
                    ? "<p>Gunakan menu di sebelah kiri untuk mengakses fitur presensi dan materi pembelajaran.</p>"
                    : "<p>Gunakan menu di sebelah kiri untuk mengelola siswa, presensi, dan materi pembelajaran.</p>"
                }
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;
}

async function checkTodayAttendance() {
  try {
    const response = await fetch(`${API_BASE}/attendance/today`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    return data.hasAttendance;
  } catch (error) {
    console.error("Error checking today's attendance:", error);
    return false;
  }
}

async function loadStatistics() {
  try {
    const [studentsRes, materialsRes, attendanceRes, enrollmentsRes] =
      await Promise.all([
        fetch(`${API_BASE}/students`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${API_BASE}/materials`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${API_BASE}/attendance`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        // Fetch enrollments only if admin
        currentUser.role === "admin"
          ? fetch(`${API_BASE}/enrollments`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })
          : Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
      ]);

    const students = await studentsRes.json();
    const materials = await materialsRes.json();
    const attendance = await attendanceRes.json();
    const enrollments = await enrollmentsRes.json();

    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = attendance.filter((a) => a.date === today).length;

    return {
      totalStudents: students.length,
      totalMaterials: materials.length,
      todayAttendance,
      pendingEnrollments: enrollments.filter((e) => e.status === "pending")
        .length, // New stat
    };
  } catch (error) {
    console.error("Error loading dashboard statistics:", error);
    return {
      totalStudents: 0,
      totalMaterials: 0,
      todayAttendance: 0,
      pendingEnrollments: 0,
    };
  }
}

async function loadAttendanceForm() {
  setActiveNav("attendance");

  const attendanceToday = await checkTodayAttendance();

  let content = `
        <h2><i class="fas fa-calendar-check mr-2"></i>Presensi Harian</h2>
    `;

  if (attendanceToday) {
    content += `
            <div class="alert alert-success">
                <i class="fas fa-check-circle mr-2"></i>
                Anda sudah melakukan presensi hari ini.
            </div>
        `;
  } else {
    content += `
            <div class="attendance-form">
                <h4>Formulir Presensi</h4>
                <p>Silakan lakukan presensi harian Anda.</p>
                
                <form id="attendanceForm">
                    <div class="form-group">
                        <label>Status Kehadiran</label>
                        <select class="form-control" id="attendanceStatus" required>
                            <option value="present">Hadir</option>
                            <option value="late">Terlambat</option>
                            <option value="absent">Tidak Hadir</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Catatan (Opsional)</label>
                        <textarea class="form-control" id="attendanceNotes" rows="3" 
                                placeholder="Tambahkan catatan jika diperlukan..."></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-check mr-2"></i>Submit Presensi
                    </button>
                </form>
            </div>
        `;
  }

  document.getElementById("content").innerHTML = content;

  if (!attendanceToday) {
    document
      .getElementById("attendanceForm")
      .addEventListener("submit", submitAttendance);
  }
}

async function submitAttendance(e) {
  e.preventDefault();

  const status = document.getElementById("attendanceStatus").value;
  const notes = document.getElementById("attendanceNotes").value;

  try {
    const response = await fetch(`${API_BASE}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status, notes }),
    });

    const data = await response.json();

    if (response.ok) {
      showCustomAlert("Presensi berhasil disimpan!", "success"); // Use custom alert
      loadAttendanceForm(); // Reload to show success message
    } else {
      showCustomAlert(data.error || "Gagal menyimpan presensi", "danger"); // Use custom alert
    }
  } catch (error) {
    console.error("Error submitting attendance:", error);
    showCustomAlert("Terjadi kesalahan saat menyimpan presensi", "danger"); // Use custom alert
  }
}

async function loadMaterials() {
  setActiveNav("materials");

  try {
    const response = await fetch(`${API_BASE}/materials`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const materials = await response.json();

    let content = `
            <h2><i class="fas fa-book mr-2"></i>Materi Pembelajaran</h2>
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Daftar Materi</h5>
                </div>
                <div class="card-body">
        `;

    if (materials.length === 0) {
      content += '<p class="text-muted">Belum ada materi yang tersedia.</p>';
    } else {
      content += `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Judul</th>
                                <th>Mata Pelajaran</th>
                                <th>Kelas</th>
                                <th>Diunggah Oleh</th>
                                <th>Tanggal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      materials.forEach((material) => {
        const date = new Date(material.created_at).toLocaleDateString("id-ID");
        content += `
                    <tr>
                        <td>
                            <strong>${material.title}</strong>
                            ${
                              material.description
                                ? `<br><small class="text-muted">${material.description}</small>`
                                : ""
                            }
                        </td>
                        <td>${material.subject || "-"}</td>
                        <td>${material.class || "-"}</td>
                        <td>${material.uploaded_by_name}</td>
                        <td>${date}</td>
                        <td>
                            ${
                              material.file_path
                                ? `<a href="http://localhost:3000/${material.file_path}" target="_blank" class="btn btn-sm btn-primary">
                                    <i class="fas fa-download mr-1"></i>Download
                                </a>`
                                : '<span class="text-muted">No file</span>'
                            }
                            ${
                              currentUser.role !== "student"
                                ? `<button class="btn btn-sm btn-danger ml-1" onclick="deleteMaterial(${material.id})">
                                    <i class="fas fa-trash"></i>
                                </button>`
                                : ""
                            }
                        </td>
                    </tr>
                `;
      });

      content += "</tbody></table></div>";
    }

    content += "</div></div>";

    document.getElementById("content").innerHTML = content;
  } catch (error) {
    console.error("Error loading materials:", error);
    document.getElementById("content").innerHTML = `
            <h2><i class="fas fa-book mr-2"></i>Materi Pembelajaran</h2>
            <div class="alert alert-danger">Gagal memuat materi pembelajaran.</div>
        `;
  }
}

async function loadUploadMaterial() {
  setActiveNav("upload-material");

  const content = `
        <h2><i class="fas fa-upload mr-2"></i>Upload Materi</h2>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Form Upload Materi</h5>
            </div>
            <div class="card-body">
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Judul Materi *</label>
                        <input type="text" class="form-control" id="materialTitle" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Deskripsi</label>
                        <textarea class="form-control" id="materialDescription" rows="3"></textarea>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Mata Pelajaran</label>
                                <select class="form-control" id="materialSubject">
                                    <option value="">Pilih Mata Pelajaran</option>
                                    <option value="Matematika">Matematika</option>
                                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                                    <option value="IPA">IPA</option>
                                    <option value="IPS">IPS</option>
                                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                                    <option value="Agama Islam">Agama Islam</option>
                                    <option value="PJOK">PJOK</option>
                                    <option value="Seni Budaya">Seni Budaya</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Kelas</label>
                                <select class="form-control" id="materialClass">
                                    <option value="">Pilih Kelas</option>
                                    <option value="Kelas 1">Kelas 1</option>
                                    <option value="Kelas 2">Kelas 2</option>
                                    <option value="Kelas 3">Kelas 3</option>
                                    <option value="Kelas 4">Kelas 4</option>
                                    <option value="Kelas 5">Kelas 5</option>
                                    <option value="Kelas 6">Kelas 6</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>File Materi</label>
                        <div class="upload-area" id="uploadArea">
                            <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                            <p>Drag & drop file di sini atau klik untuk memilih</p>
                            <small class="text-muted">Mendukung: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, MP4, AVI, MOV (Max: 50MB)</small>
                            <input type="file" id="materialFile" class="d-none" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov">
                        </div>
                        <div id="fileInfo" class="mt-2"></div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-upload mr-2"></i>Upload Materi
                    </button>
                </form>
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;

  // Setup file upload
  setupFileUpload();

  document
    .getElementById("uploadForm")
    .addEventListener("submit", uploadMaterial);
}

function setupFileUpload() {
  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("materialFile");
  const fileInfo = document.getElementById("fileInfo");

  uploadArea.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      showFileInfo(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      showFileInfo(e.target.files[0]);
    }
  });

  function showFileInfo(file) {
    const size = (file.size / 1024 / 1024).toFixed(2);
    fileInfo.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-file mr-2"></i>
                <strong>${file.name}</strong> (${size} MB)
            </div>
        `;
  }
}

async function uploadMaterial(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("title", document.getElementById("materialTitle").value);
  formData.append(
    "description",
    document.getElementById("materialDescription").value
  );
  formData.append("subject", document.getElementById("materialSubject").value);
  formData.append("class", document.getElementById("materialClass").value);

  const fileInput = document.getElementById("materialFile");
  if (fileInput.files[0]) {
    formData.append("file", fileInput.files[0]);
  }

  try {
    const response = await fetch(`${API_BASE}/materials`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      showCustomAlert("Materi berhasil diupload!", "success"); // Use custom alert
      loadMaterials(); // Redirect to materials list
    } else {
      showCustomAlert(data.error || "Gagal mengupload materi", "danger"); // Use custom alert
    }
  } catch (error) {
    console.error("Error uploading material:", error);
    showCustomAlert("Terjadi kesalahan saat mengupload materi", "danger"); // Use custom alert
  }
}

async function deleteMaterial(id) {
  showCustomAlert(
    "Apakah Anda yakin ingin menghapus materi ini?",
    "danger",
    async () => {
      try {
        const response = await fetch(`${API_BASE}/materials/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          showCustomAlert("Materi berhasil dihapus!", "success"); // Use custom alert
          loadMaterials(); // Reload materials list
        } else {
          const data = await response.json();
          showCustomAlert(data.error || "Gagal menghapus materi", "danger"); // Use custom alert
        }
      } catch (error) {
        console.error("Error deleting material:", error);
        showCustomAlert("Terjadi kesalahan saat menghapus materi", "danger"); // Use custom alert
      }
    }
  );
}

async function loadMyAttendance() {
  setActiveNav("my-attendance");

  try {
    const response = await fetch(`${API_BASE}/attendance`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const attendance = await response.json();

    let content = `
            <h2><i class="fas fa-history mr-2"></i>Riwayat Presensi</h2>
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Riwayat Presensi Anda</h5>
                </div>
                <div class="card-body">
        `;

    if (attendance.length === 0) {
      content += '<p class="text-muted">Belum ada riwayat presensi.</p>';
    } else {
      content += `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Status</th>
                                <th>Catatan</th>
                                <th>Waktu Input</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      attendance.forEach((record) => {
        const date = new Date(record.date).toLocaleDateString("id-ID");
        const time = new Date(record.created_at).toLocaleString("id-ID");

        let statusBadge = "";
        switch (record.status) {
          case "present":
            statusBadge = '<span class="badge badge-success">Hadir</span>';
            break;
          case "late":
            statusBadge = '<span class="badge badge-warning">Terlambat</span>';
            break;
          case "absent":
            statusBadge = '<span class="badge badge-danger">Tidak Hadir</span>';
            break;
        }

        content += `
                    <tr>
                        <td>${date}</td>
                        <td>${statusBadge}</td>
                        <td>${record.notes || "-"}</td>
                        <td>${time}</td>
                    </tr>
                `;
      });

      content += "</tbody></table></div>";
    }

    content += "</div></div>";

    document.getElementById("content").innerHTML = content;
  } catch (error) {
    console.error("Error loading my attendance:", error);
    document.getElementById("content").innerHTML = `
            <h2><i class="fas fa-history mr-2"></i>Riwayat Presensi</h2>
            <div class="alert alert-danger">Gagal memuat riwayat presensi.</div>
        `;
  }
}

async function loadStudents() {
  setActiveNav("students");

  try {
    const response = await fetch(`${API_BASE}/students`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const students = await response.json();

    let content = `
            <h2><i class="fas fa-users mr-2"></i>Data Siswa</h2>
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Daftar Siswa</h5>
                </div>
                <div class="card-body">
        `;

    if (students.length === 0) {
      content += '<p class="text-muted">Belum ada data siswa.</p>';
    } else {
      content += `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Nama</th>
                                <th>Kelas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      students.forEach((student) => {
        content += `
                    <tr>
                        <td>${student.username}</td>
                        <td>${student.name}</td>
                        <td>${student.class || "-"}</td>
                    </tr>
                `;
      });

      content += "</tbody></table></div>";
    }

    content += "</div></div>";

    document.getElementById("content").innerHTML = content;
  } catch (error) {
    console.error("Error loading students:", error);
    document.getElementById("content").innerHTML = `
            <h2><i class="fas fa-users mr-2"></i>Data Siswa</h2>
            <div class="alert alert-danger">Gagal memuat data siswa.</div>
        `;
  }
}

async function loadAttendanceReport() {
  setActiveNav("attendance-report");

  try {
    const response = await fetch(`${API_BASE}/attendance`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const attendance = await response.json();

    let content = `
            <h2><i class="fas fa-chart-bar mr-2"></i>Laporan Presensi</h2>
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Laporan Presensi Siswa</h5>
                </div>
                <div class="card-body">
        `;

    if (attendance.length === 0) {
      content += '<p class="text-muted">Belum ada data presensi.</p>';
    } else {
      content += `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Nama Siswa</th>
                                <th>Kelas</th>
                                <th>Status</th>
                                <th>Catatan</th>
                                <th>Waktu Input</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      attendance.forEach((record) => {
        const date = new Date(record.date).toLocaleDateString("id-ID");
        const time = new Date(record.created_at).toLocaleString("id-ID");

        let statusBadge = "";
        switch (record.status) {
          case "present":
            statusBadge = '<span class="badge badge-success">Hadir</span>';
            break;
          case "late":
            statusBadge = '<span class="badge badge-warning">Terlambat</span>';
            break;
          case "absent":
            statusBadge = '<span class="badge badge-danger">Tidak Hadir</span>';
            break;
        }

        content += `
                    <tr>
                        <td>${date}</td>
                        <td>${record.student_name}</td>
                        <td>${record.class || "-"}</td>
                        <td>${statusBadge}</td>
                        <td>${record.notes || "-"}</td>
                        <td>${time}</td>
                    </tr>
                `;
      });

      content += "</tbody></table></div>";
    }

    content += "</div></div>";

    document.getElementById("content").innerHTML = content;
  } catch (error) {
    console.error("Error loading attendance report:", error);
    document.getElementById("content").innerHTML = `
            <h2><i class="fas fa-chart-bar mr-2"></i>Laporan Presensi</h2>
            <div class="alert alert-danger">Gagal memuat laporan presensi.</div>
        `;
  }
}

// New function to load enrollment applications for admin
async function loadEnrollmentApplications() {
  setActiveNav("enrollments");

  let content = `
        <h2><i class="fas fa-user-plus mr-2"></i>Pendaftaran Siswa Baru</h2>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Daftar Aplikasi Pendaftaran</h5>
            </div>
            <div class="card-body" id="enrollmentListContainer">
                <!-- Enrollment list will be loaded here -->
            </div>
        </div>

        <!-- Modal for Enrollment Details / Approval -->
        <div class="modal fade" id="enrollmentDetailModal" tabindex="-1" role="dialog" aria-labelledby="enrollmentDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="enrollmentDetailModalLabel">Detail Pendaftaran</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="enrollmentDetailForm">
                            <input type="hidden" id="detailEnrollmentId">
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Nama Lengkap:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailFullName" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Tempat, Tanggal Lahir:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailDob" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Alamat:</label>
                                <div class="col-sm-8"><textarea class="form-control" id="detailAddress" rows="3" readonly></textarea></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Nama Orang Tua/Wali:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailParentName" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">No. HP Orang Tua:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailParentPhone" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Kelas Tujuan:</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="detailTargetClass" readonly></div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Status:</label>
                                <div class="col-sm-8">
                                    <select class="form-control" id="detailStatus" required>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                             <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Catatan Admin (Opsional):</label>
                                <div class="col-sm-8"><textarea class="form-control" id="detailNotes" rows="3"></textarea></div>
                            </div>
                            
                            <div id="approveSection" class="mt-4 border-top pt-3">
                                <h6>Setel Akun Siswa (untuk status 'Approved')</h6>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label" for="newStudentUsername">Username Siswa:</label>
                                    <div class="col-sm-8"><input type="text" class="form-control" id="newStudentUsername" placeholder="Contoh: siswa_andi" disabled></div>
                                </div>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label" for="newStudentPassword">Password Siswa:</label>
                                    <div class="col-sm-8"><input type="password" class="form-control" id="newStudentPassword" placeholder="Setel password awal" disabled></div>
                                </div>
                                <button type="button" class="btn btn-success" id="approveEnrollmentBtn" disabled><i class="fas fa-user-plus mr-2"></i>Approve & Buat Akun Siswa</button>
                                <small class="form-text text-muted mt-2">Pastikan status "Approved" sebelum membuat akun.</small>
                            </div>

                            <div class="mt-4 text-right">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Tutup</button>
                                <button type="submit" class="btn btn-primary" id="updateEnrollmentBtn">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content").innerHTML = content;
  await fetchEnrollmentList();
}

async function fetchEnrollmentList() {
  const enrollmentListContainer = document.getElementById(
    "enrollmentListContainer"
  );
  enrollmentListContainer.innerHTML =
    '<p class="text-muted">Memuat data pendaftaran...</p>';

  try {
    const response = await fetch(`${API_BASE}/enrollments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const enrollments = await response.json();

    if (enrollments.length === 0) {
      enrollmentListContainer.innerHTML =
        '<p class="text-muted">Belum ada aplikasi pendaftaran baru.</p>';
      return;
    }

    let tableHtml = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Nama Siswa</th>
                            <th>Kelas Tujuan</th>
                            <th>Nama Orang Tua</th>
                            <th>No. HP Orang Tua</th>
                            <th>Status</th>
                            <th>Tanggal Daftar</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    enrollments.forEach((enrollment) => {
      const date = new Date(enrollment.created_at).toLocaleDateString("id-ID");
      let statusBadge = "";
      switch (enrollment.status) {
        case "pending":
          statusBadge = '<span class="badge badge-info">Pending</span>';
          break;
        case "approved":
          statusBadge = '<span class="badge badge-success">Approved</span>';
          break;
        case "rejected":
          statusBadge = '<span class="badge badge-danger">Rejected</span>';
          break;
      }

      tableHtml += `
                <tr>
                    <td>${enrollment.full_name}</td>
                    <td>${enrollment.target_class}</td>
                    <td>${enrollment.parent_name}</td>
                    <td>${enrollment.parent_phone}</td>
                    <td>${statusBadge}</td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewEnrollmentDetail(${enrollment.id})">
                            <i class="fas fa-eye"></i> Detail
                        </button>
                        <button class="btn btn-sm btn-danger ml-1" onclick="deleteEnrollmentApplication(${enrollment.id})">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `;
    });

    tableHtml += `</tbody></table></div>`;
    enrollmentListContainer.innerHTML = tableHtml;
  } catch (error) {
    console.error("Error fetching enrollment applications:", error);
    enrollmentListContainer.innerHTML =
      '<div class="alert alert-danger">Gagal memuat data pendaftaran.</div>';
  }
}

async function viewEnrollmentDetail(id) {
  try {
    const response = await fetch(`${API_BASE}/enrollments/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const enrollment = await response.json();

    if (!response.ok) {
      showCustomAlert(
        enrollment.error || "Gagal memuat detail pendaftaran.",
        "danger"
      );
      return;
    }

    // Populate modal fields
    document.getElementById("detailEnrollmentId").value = enrollment.id;
    document.getElementById("detailFullName").value = enrollment.full_name;
    document.getElementById("detailDob").value = enrollment.dob;
    document.getElementById("detailAddress").value = enrollment.address;
    document.getElementById("detailParentName").value = enrollment.parent_name;
    document.getElementById("detailParentPhone").value =
      enrollment.parent_phone;
    document.getElementById("detailTargetClass").value =
      enrollment.target_class;
    document.getElementById("detailStatus").value = enrollment.status;
    document.getElementById("detailNotes").value = enrollment.notes || "";

    // Handle visibility and enabled state of approval section
    const approveSection = document.getElementById("approveSection");
    const newStudentUsername = document.getElementById("newStudentUsername");
    const newStudentPassword = document.getElementById("newStudentPassword");
    const approveEnrollmentBtn = document.getElementById(
      "approveEnrollmentBtn"
    );

    if (enrollment.status === "pending") {
      approveSection.style.display = "block";
      newStudentUsername.disabled = false;
      newStudentPassword.disabled = false;
      approveEnrollmentBtn.disabled = false;
      // Pre-fill username suggestion (e.g., lowercase first word + enrollment ID)
      const firstName = enrollment.full_name.split(" ")[0].toLowerCase();
      newStudentUsername.value = `${firstName}${enrollment.id}`;
      newStudentPassword.value = ""; // Clear previous password
    } else {
      approveSection.style.display = "none"; // Hide if not pending
      newStudentUsername.disabled = true;
      newStudentPassword.disabled = true;
      approveEnrollmentBtn.disabled = true;
    }

    $("#enrollmentDetailModal").modal("show");

    // Remove previous event listeners to prevent multiple bindings
    $("#enrollmentDetailForm")
      .off("submit")
      .on("submit", updateEnrollmentDetail);
    $("#approveEnrollmentBtn")
      .off("click")
      .on("click", () => approveAndCreateStudent(enrollment.id));
  } catch (error) {
    console.error("Error viewing enrollment detail:", error);
    showCustomAlert(
      "Terjadi kesalahan saat memuat detail pendaftaran.",
      "danger"
    );
  }
}

async function updateEnrollmentDetail(event) {
  event.preventDefault();

  const id = document.getElementById("detailEnrollmentId").value;
  const formData = {
    full_name: document.getElementById("detailFullName").value,
    dob: document.getElementById("detailDob").value,
    address: document.getElementById("detailAddress").value,
    parent_name: document.getElementById("detailParentName").value,
    parent_phone: document.getElementById("detailParentPhone").value,
    target_class: document.getElementById("detailTargetClass").value,
    status: document.getElementById("detailStatus").value,
    notes: document.getElementById("detailNotes").value,
  };

  try {
    const response = await fetch(`${API_BASE}/enrollments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      showCustomAlert("Detail pendaftaran berhasil diperbarui!", "success");
      $("#enrollmentDetailModal").modal("hide"); // Close modal
      await fetchEnrollmentList(); // Refresh list
    } else {
      showCustomAlert(
        result.error || "Gagal memperbarui detail pendaftaran.",
        "danger"
      );
    }
  } catch (error) {
    console.error("Error updating enrollment detail:", error);
    showCustomAlert(
      "Terjadi kesalahan saat memperbarui detail pendaftaran.",
      "danger"
    );
  }
}

async function deleteEnrollmentApplication(id) {
  showCustomAlert(
    "Apakah Anda yakin ingin menghapus aplikasi pendaftaran ini? Tindakan ini tidak dapat dibatalkan.",
    "danger",
    async () => {
      try {
        const response = await fetch(`${API_BASE}/enrollments/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          showCustomAlert("Aplikasi pendaftaran berhasil dihapus!", "success");
          await fetchEnrollmentList(); // Refresh list
        } else {
          showCustomAlert(
            result.error || "Gagal menghapus aplikasi pendaftaran.",
            "danger"
          );
        }
      } catch (error) {
        console.error("Error deleting enrollment application:", error);
        showCustomAlert(
          "Terjadi kesalahan saat menghapus aplikasi pendaftaran.",
          "danger"
        );
      }
    }
  );
}

async function approveAndCreateStudent(enrollmentId) {
  const newStudentUsername =
    document.getElementById("newStudentUsername").value;
  const newStudentPassword =
    document.getElementById("newStudentPassword").value;
  const detailStatus = document.getElementById("detailStatus").value;

  if (detailStatus !== "pending") {
    showCustomAlert(
      'Hanya pendaftaran dengan status "Pending" yang bisa disetujui dan dibuatkan akun.',
      "danger"
    );
    return;
  }

  if (!newStudentUsername || !newStudentPassword) {
    showCustomAlert("Mohon isi Username Siswa dan Password Siswa.", "danger");
    return;
  }

  showCustomAlert(
    "Anda yakin ingin menyetujui pendaftaran ini dan membuat akun siswa baru?",
    "info",
    async () => {
      try {
        const response = await fetch(
          `${API_BASE}/enrollments/${enrollmentId}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              username: newStudentUsername,
              password: newStudentPassword,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          showCustomAlert(result.message, "success");
          $("#enrollmentDetailModal").modal("hide"); // Close modal
          await fetchEnrollmentList(); // Refresh list
          loadStudents(); // Optionally, go to the students list to see the new user
        } else {
          showCustomAlert(
            result.error ||
              "Gagal menyetujui pendaftaran dan membuat akun siswa.",
            "danger"
          );
        }
      } catch (error) {
        console.error("Error approving enrollment:", error);
        showCustomAlert(
          "Terjadi kesalahan saat menyetujui pendaftaran.",
          "danger"
        );
      }
    }
  );
}

function logout() {
  showCustomAlert("Apakah Anda yakin ingin logout?", "info", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
}
