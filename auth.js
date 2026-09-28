// =========================================
// ASIM BHARAT AIPC SYSTEM
// Dynamic Premium Authentication System v2.0
// =========================================

const CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  STORAGE_PREFIX: "AIPC_",
  MIN_PASSWORD_LENGTH: 6
};

// ---------- Utility Functions ----------
function hashPassword(password) {
  // Simple but better than plain text (for demo)
  // Production এ backend + bcrypt ব্যবহার করবেন
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "aipc_" + Math.abs(hash).toString(16) + "_" + password.length;
}

function showMessage(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) {
    alert(message);
    return;
  }
  el.innerHTML = message;
  el.style.color = type === "success" ? "#00FF9D" : "#ff4d4d";
}

function logActivity(action, mobile) {
  const logs = JSON.parse(localStorage.getItem(CONFIG.STORAGE_PREFIX + "LOGS") || "[]");
  logs.unshift({
    action,
    mobile,
    time: new Date().toLocaleString("bn-BD")
  });
  // শুধু শেষ ৫০টা রাখবে
  if (logs.length > 50) logs.length = 50;
  localStorage.setItem(CONFIG.STORAGE_PREFIX + "LOGS", JSON.stringify(logs));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidMobile(mobile) {
  return /^01[3-9]\d{8}$/.test(mobile); // বাংলাদেশি মোবাইল
}

function isStrongPassword(password) {
  return password.length >= CONFIG.MIN_PASSWORD_LENGTH;
}

// ---------- Register ----------
function register() {
  const name = document.getElementById("name")?.value.trim();
  const mobile = document.getElementById("mobile")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirm = document.getElementById("confirmPassword")?.value;
  const role = document.getElementById("role")?.value || "user";

  if (!name || !mobile || !email || !password || !confirm) {
    return showMessage("status", "সব তথ্য পূরণ করুন", "error");
  }

  if (!isValidMobile(mobile)) {
    return showMessage("status", "সঠিক বাংলাদেশি মোবাইল নাম্বার দিন (01XXXXXXXXX)", "error");
  }

  if (!isValidEmail(email)) {
    return showMessage("status", "সঠিক ইমেইল অ্যাড্রেস দিন", "error");
  }

  if (!isStrongPassword(password)) {
    return showMessage("status", `পাসওয়ার্ড কমপক্ষে ${CONFIG.MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে`, "error");
  }

  if (password !== confirm) {
    return showMessage("status", "পাসওয়ার্ড মিলছে না", "error");
  }

  if (localStorage.getItem(CONFIG.STORAGE_PREFIX + "USER_" + mobile)) {
    return showMessage("status", "এই মোবাইল নাম্বার দিয়ে আগে থেকেই অ্যাকাউন্ট আছে", "error");
  }

  const user = {
    name,
    mobile,
    email,
    password: hashPassword(password),
    role,
    status: "Active",
    created: new Date().toISOString(),
    lastLogin: null
  };

  localStorage.setItem(CONFIG.STORAGE_PREFIX + "USER_" + mobile, JSON.stringify(user));
  logActivity("Register", mobile);

  showMessage("status", "রেজিস্ট্রেশন সফল হয়েছে! লগইন পেজে যাচ্ছেন...", "success");
  
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1200);
}

// ---------- Login ----------
function login() {
  const mobile = document.getElementById("mobile")?.value.trim();
  const password = document.getElementById("password")?.value;
  const remember = document.getElementById("remember")?.checked;

  if (!mobile || !password) {
    return showMessage("status", "মোবাইল ও পাসওয়ার্ড দিন", "error");
  }

  const raw = localStorage.getItem(CONFIG.STORAGE_PREFIX + "USER_" + mobile);
  if (!raw) {
    return showMessage("status", "ইউজার পাওয়া যায়নি", "error");
  }

  const data = JSON.parse(raw);

  if (data.password !== hashPassword(password)) {
    return showMessage("status", "ভুল পাসওয়ার্ড", "error");
  }

  if (data.status !== "Active") {
    return showMessage("status", "আপনার অ্যাকাউন্ট অ্যাকটিভ নয়। এডমিনের সাথে যোগাযোগ করুন।", "error");
  }

  // Session তৈরি
  const session = {
    mobile,
    loginTime: Date.now(),
    remember: !!remember
  };

  localStorage.setItem(CONFIG.STORAGE_PREFIX + "SESSION", JSON.stringify(session));

  // lastLogin আপডেট
  data.lastLogin = new Date().toISOString();
  localStorage.setItem(CONFIG.STORAGE_PREFIX + "USER_" + mobile, JSON.stringify(data));

  logActivity("Login", mobile);

  showMessage("status", "লগইন সফল! রিডাইরেক্ট হচ্ছে...", "success");

  // Role অনুসারে রিডাইরেক্ট
  setTimeout(() => {
    if (data.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else if (data.role === "teacher") {
      window.location.href = "teacher-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  }, 800);
}

// ---------- Forgot / Reset Password (Demo) ----------
function resetPassword() {
  const mobile = document.getElementById("mobile")?.value.trim();
  const status = document.getElementById("status");

  if (!mobile) {
    return showMessage("status", "মোবাইল নাম্বার দিন", "error");
  }

  if (!localStorage.getItem(CONFIG.STORAGE_PREFIX + "USER_" + mobile)) {
    return showMessage("status", "ইউজার পাওয়া যায়নি", "error");
  }

  // আসল সিস্টেমে এখানে OTP / Email পাঠানো হবে
  showMessage("status", "রিসেট রিকোয়েস্ট সফল। (Firebase/Backend যুক্ত হলে SMS/Email যাবে)", "success");
  logActivity("Password Reset Request", mobile);
}

// ---------- Change Password ----------
function changePassword() {
  const oldPass = document.getElementById("oldPassword")?.value;
  const newPass = document.getElementById("newPassword")?.value;
  const confirmPass = document.getElementById("confirmNewPassword")?.value;

  const user = currentUser();
  if (!user) return;

  if (!oldPass || !newPass || !confirmPass) {
    return showMessage("status", "সব ফিল্ড পূরণ করুন", "error");
  }

  if (user.password !== hashPassword(oldPass)) {
    return showMessage("status", "পুরনো পাসওয়ার্ড ভুল", "error");
  }

  if (!isStrongPassword(newPass)) {
    return showMessage("status", `নতুন পাসওয়ার্ড কমপক্ষে ${CONFIG.MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে`, "error");
  }

  if (newPass !== confirmPass) {
    return showMessage("status", "নতুন পাসওয়ার্ড মিলছে না", "error");
  }

  user.password = hashPassword(newPass);
  localStorage.setItem(CONFIG.STORAGE_PREFIX + "USER_" + user.mobile, JSON.stringify(user));
  logActivity("Password Changed", user.mobile);

  showMessage("status", "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে", "success");
}

// ---------- Update Profile ----------
function updateProfile() {
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();

  const user = currentUser();
  if (!user) return;

  if (!name || !email) {
    return showMessage("status", "নাম ও ইমেইল দিন", "error");
  }

  if (!isValidEmail(email)) {
    return showMessage("status", "সঠিক ইমেইল দিন", "error");
  }

  user.name = name;
  user.email = email;

  localStorage.setItem(CONFIG.STORAGE_PREFIX + "USER_" + user.mobile, JSON.stringify(user));
  logActivity("Profile Updated", user.mobile);

  showMessage("status", "প্রোফাইল আপডেট সফল হয়েছে", "success");
}

// ---------- Current User + Session Check ----------
function currentUser() {
  const sessionRaw = localStorage.getItem(CONFIG.STORAGE_PREFIX + "SESSION");
  if (!sessionRaw) return null;

  const session = JSON.parse(sessionRaw);

  // Session Timeout চেক
  if (!session.remember && (Date.now() - session.loginTime > CONFIG.SESSION_TIMEOUT)) {
    logout(true); // silent logout
    return null;
  }

  const userRaw = localStorage.getItem(CONFIG.STORAGE_PREFIX + "USER_" + session.mobile);
  if (!userRaw) {
    logout(true);
    return null;
  }

  return JSON.parse(userRaw);
}

// ---------- Logout ----------
function logout(silent = false) {
  const session = localStorage.getItem(CONFIG.STORAGE_PREFIX + "SESSION");
  if (session) {
    const mobile = JSON.parse(session).mobile;
    logActivity("Logout", mobile);
  }

  localStorage.removeItem(CONFIG.STORAGE_PREFIX + "SESSION");

  if (!silent) {
    window.location.href = "login.html";
  }
}

// ---------- Protect Page ----------
function requireLogin(allowedRoles = []) {
  const user = currentUser();

  if (!user) {
    window.location.href = "login.html";
    return null;
  }

  // Role based protection
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert("আপনার এই পেজে অ্যাক্সেস নেই");
    window.location.href = "dashboard.html";
    return null;
  }

  return user;
}

// ---------- Admin: Get All Users ----------
function getAllUsers() {
  const user = currentUser();
  if (!user || user.role !== "admin") {
    alert("শুধুমাত্র এডমিন দেখতে পারবেন");
    return [];
  }

  const users = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CONFIG.STORAGE_PREFIX + "USER_")) {
      users.push(JSON.parse(localStorage.getItem(key)));
    }
  }
  return users;
}

// ---------- Admin: Change User Status ----------
function changeUserStatus(mobile, newStatus) {
  const admin = currentUser();
  if (!admin || admin.role !== "admin") return;

  const raw = localStorage.getItem(CONFIG.STORAGE_PREFIX + "USER_" + mobile);
  if (!raw) return;

  const user = JSON.parse(raw);
  user.status = newStatus;
  localStorage.setItem(CONFIG.STORAGE_PREFIX + "USER_" + mobile, JSON.stringify(user));
  logActivity(`Status changed to ${newStatus}`, mobile);
                       }
