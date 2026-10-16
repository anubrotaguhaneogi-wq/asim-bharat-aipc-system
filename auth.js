// =========================================
// ASIM BHARAT AIPC SYSTEM - FIREBASE AUTH & DB
// Dynamic Premium Authentication System v2.0
// =========================================

// ফায়ারবেস অলরেডি ইনিশিয়ালাইজ করা আছে ধরে নিয়ে Auth ও Firestore ডিক্লেয়ার করা হলো:
const auth = firebase.auth();
const db = firebase.firestore();

const CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MIN_PASSWORD_LENGTH: 6
};

// ---------- Utility Functions ----------
function showMessage(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) {
    alert(message);
    return;
  }
  el.innerHTML = message;
  el.style.color = type === "success" ? "#00FF9D" : "#ff4d4d";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return password.length >= CONFIG.MIN_PASSWORD_LENGTH;
}

// ---------- Register (Firebase Auth + Firestore) ----------
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

  if (!isValidEmail(email)) {
    return showMessage("status", "সঠিক ইমেইল অ্যাড্রেস দিন", "error");
  }

  if (!isStrongPassword(password)) {
    return showMessage("status", `পাসওয়ার্ড কমপক্ষে ${CONFIG.MIN_PASSWORD_LENGTH} অক্ষরের হতে হবে`, "error");
  }

  if (password !== confirm) {
    return showMessage("status", "পাসওয়ার্ড মিলছে না", "error");
  }

  // Firebase Auth দিয়ে ইউজার তৈরি
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      
      // Firestore-এ এক্সট্রা ডেটা (নাম, মোবাইল, রোল ইত্যাদি) সেভ করা
      return db.collection("users").doc(user.uid).set({
        uid: user.uid,
        name: name,
        mobile: mobile,
        email: email,
        role: role, // 'super_admin', 'manager', 'user' ইত্যাদি
        status: "Active",
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
    })
    .then(() => {
      showMessage("status", "রেজিস্ট্রেশন সফল হয়েছে! লগইন পেজে যাচ্ছেন...", "success");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    })
    .catch((error) => {
      console.error("Registration Error:", error);
      showMessage("status", "রেজিস্ট্রেশন ব্যর্থ: " + error.message, "error");
    });
}

// ---------- Login (Firebase Auth) ----------
function login() {
  const email = document.getElementById("email")?.value.trim(); // ইমেইল বা ইউজার আইডি দিয়ে লগইন
  const password = document.getElementById("password")?.value;

  if (!email || !password) {
    return showMessage("status", "ইমেইল ও পাসওয়ার্ড দিন", "error");
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      
      // Firestore থেকে ইউজারের রোল চেক করা
      return db.collection("users").doc(user.uid).get();
    })
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        
        if (userData.status !== "Active") {
          auth.signOut();
          return showMessage("status", "আপনার অ্যাকাউন্ট অ্যাকটিভ নয়। এডমিনের সাথে যোগাযোগ করুন।", "error");
        }

        showMessage("status", "লগইন সফল! রিডাইরেক্ট হচ্ছে...", "success");

        // Role অনুসারে রিডাইরেক্ট
        setTimeout(() => {
          if (userData.role === "admin" || userData.role === "super_admin") {
            window.location.href = "admin-dashboard.html";
          } else if (userData.role === "manager") {
            window.location.href = "teacher-dashboard.html"; // বা ম্যানেজার ড্যাশবোর্ড
          } else {
            window.location.href = "dashboard.html";
          }
        }, 800);
      } else {
        showMessage("status", "ইউজার ডাটাবেজে পাওয়া যায়নি", "error");
      }
    })
    .catch((error) => {
      console.error("Login Error:", error);
      showMessage("status", "ভুল ইমেইল বা পাসওয়ার্ড", "error");
    });
}

// ---------- Logout ----------
function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
}

// ---------- Protect Page & Check Current User ----------
function requireLogin(allowedRoles = []) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // রোল চেক
    try {
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const userData = doc.data();
        if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
          alert("আপনার এই পেজে অ্যাক্সেস নেই");
          window.location.href = "dashboard.html";
        }
      }
    } catch (error) {
      console.error("Role check error:", error);
    }
  });
}
