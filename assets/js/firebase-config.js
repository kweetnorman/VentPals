// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAugk1ty2eZSpCUWjinqB3ovgqYDzw1Asc",
  authDomain: "ventpals-e333b.firebaseapp.com",
  projectId: "ventpals-e333b",
  storageBucket: "ventpals-e333b.appspot.com",
  messagingSenderId: "1063757294983",
  appId: "1:1063757294983:web:cbd20472655dbd82ff3722",
  measurementId: "G-6HBJD15S2F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);          // Realtime Database (legacy; not used by accounts)
const firestore = getFirestore(app);  // Firestore: parents, child profiles, Nests

export { app, auth, db, firestore, onAuthStateChanged };
