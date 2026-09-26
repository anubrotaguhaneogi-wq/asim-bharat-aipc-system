// =========================================
// ASIM BHARAT AIPC SYSTEM
// Premium Authentication System
// =========================================

// ---------- Register ----------
function register(){

const name=document.getElementById("name")?.value.trim();
const mobile=document.getElementById("mobile")?.value.trim();
const email=document.getElementById("email")?.value.trim();
const password=document.getElementById("password")?.value;
const confirm=document.getElementById("confirmPassword")?.value;
const role=document.getElementById("role")?.value;

if(!name||!mobile||!email||!password){
alert("সব তথ্য পূরণ করুন");
return;
}

if(password!==confirm){
alert("পাসওয়ার্ড মিলছে না");
return;
}

const user={
name,
mobile,
email,
password,
role,
status:"Active",
created:new Date().toISOString()
};

localStorage.setItem("AIPC_USER_"+mobile,JSON.stringify(user));

alert("Registration Successful");

window.location.href="login.html";

}

// ---------- Login ----------
function login(){

const mobile=document.getElementById("mobile")?.value.trim();
const password=document.getElementById("password")?.value;

const user=localStorage.getItem("AIPC_USER_"+mobile);

if(!user){
alert("User পাওয়া যায়নি");
return;
}

const data=JSON.parse(user);

if(data.password!==password){
alert("ভুল পাসওয়ার্ড");
return;
}

localStorage.setItem("AIPC_SESSION",mobile);

window.location.href="dashboard.html";

}

// ---------- Forgot Password ----------
function resetPassword(){

const mobile=document.getElementById("mobile")?.value.trim();

const user=localStorage.getItem("AIPC_USER_"+mobile);

const status=document.getElementById("status");

if(!user){

status.innerHTML="User পাওয়া যায়নি";
status.style.color="red";

return;

}

status.innerHTML="Reset request সফল হয়েছে (Firebase যুক্ত হলে Email/SMS যাবে)";
status.style.color="#00FF9D";

}

// ---------- Session ----------
function currentUser(){

const mobile=localStorage.getItem("AIPC_SESSION");

if(!mobile)return null;

return JSON.parse(localStorage.getItem("AIPC_USER_"+mobile));

}

// ---------- Logout ----------
function logout(){

localStorage.removeItem("AIPC_SESSION");

window.location.href="login.html";

}

// ---------- Protect Page ----------
function requireLogin(){

if(!localStorage.getItem("AIPC_SESSION")){

window.location.href="login.html";

}

  }
