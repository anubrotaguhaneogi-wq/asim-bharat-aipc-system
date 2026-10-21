// ===== Firebase configuration =====
// Only config here. Do NOT declare auth or db in this file.
const firebaseConfig = {
  apiKey: "AIzaSyDqXcxTrI22Ju1Rj9mtbUSCjGkT7B_OxZo",
  authDomain: "kali-life-ecosystem.firebaseapp.com",
  projectId: "kali-life-ecosystem",
  storageBucket: "kali-life-ecosystem.firebasestorage.app",
  messagingSenderId: "734170546737",
  appId: "1:734170546737:web:26f79e1b4b19ebabfe0b10",
  measurementId: "G-LBEY0W7RX3"
};

// Initialize only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Analytics failure must not break the app
try {
  firebase.analytics();
} catch (e) {
  console.warn("Analytics not started:", e.message);
}
