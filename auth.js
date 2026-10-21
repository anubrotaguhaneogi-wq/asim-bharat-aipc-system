// ===== ASIM BHARAT - Login / Register =====
const auth = firebase.auth();
const db = firebase.firestore();

const MIN_PASSWORD = 6;
const ADMIN_ROLES = ["core_admin", "super_admin", "admin"];

// Show message in element id="status", else alert
function showMessage(message, type) {
  const el = document.getElementById("status");
  if (!el) return alert(message);
  el.textContent = message;
  el.style.color = type === "success" ? "#00FF9D" : "#ff4d4d";
}

// Read input value without extra spaces
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

// ===== Register =====
async function register() {
  const name = val("name");
  const mobile = val("mobile");
  const email = val("email");
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;
  let requestedRole = document.getElementById("role").value;

  // If custom post selected, use the typed name
  if (requestedRole === "other_custom_post") {
    requestedRole = val("customPostName");
  }

  if (!name || !mobile || !email || !password || !confirm || !requestedRole) {
    return showMessage("Please fill all fields and select a post.");
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return showMessage("Mobile number must be 10 digits.");
  }
  if (password.length < MIN_PASSWORD) {
    return showMessage("Password must be at least " + MIN_PASSWORD + " characters.");
  }
  if (password !== confirm) {
    return showMessage("Passwords do not match.");
  }

  // Prevent double click
  const btn = document.querySelector(".register-box button");
  if (btn) btn.disabled = true;

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;

    // Role is always "user". Requested post is saved separately.
    // Admin approves later and changes role/status.
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      name: name,
      mobile: mobile,
      email: email,
      role: "user",
      requestedRole: requestedRole,
      status: "Pending",
      created: new Date().toISOString()
    });

    await auth.signOut();
    showMessage("Registration successful! You can login after admin approval.", "success");
    setTimeout(function () { window.location.href = "login.html"; }, 2000);
  } catch (error) {
    console.error("Register Error:", error);
    if (error.code === "auth/email-already-in-use") {
      showMessage("An account with this email already exists.");
    } else {
      showMessage("Registration failed: " + error.message);
    }
    if (btn) btn.disabled = false;
  }
}

// ===== Login =====
async function login() {
  const email = val("email");
  const password = document.getElementById("password").value;

  if (!email || !password) {
    return showMessage("Enter email and password.");
  }

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const doc = await db.collection("users").doc(cred.user.uid).get();

    if (!doc.exists) {
      await auth.signOut();
      return showMessage("User not found in database.");
    }

    const data = doc.data();
    if (data.status !== "Active") {
      await auth.signOut();
      return showMessage("Your account is not approved yet. Contact admin.");
    }

    showMessage("Login successful! Redirecting...", "success");
    setTimeout(function () {
      if (ADMIN_ROLES.includes(data.role)) {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }, 800);
  } catch (error) {
    console.error("Login Error:", error);
    showMessage("Wrong email or password.");
  }
}

// ===== Logout =====
function logout() {
  auth.signOut().then(function () {
    window.location.href = "login.html";
  });
}

// ===== Page protection (use in dashboard pages) =====
// Example: requireLogin(["super_admin", "admin"]);
function requireLogin(allowedRoles) {
  allowedRoles = allowedRoles || [];
  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    try {
      const doc = await db.collection("users").doc(user.uid).get();
      const data = doc.exists ? doc.data() : null;

      if (!data || data.status !== "Active") {
        await auth.signOut();
        window.location.href = "login.html";
        return;
      }
      if (allowedRoles.length && !allowedRoles.includes(data.role)) {
        alert("You do not have access to this page.");
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      console.error("Role check error:", error);
    }
  });
  }
