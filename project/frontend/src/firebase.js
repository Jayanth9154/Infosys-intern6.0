// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9ZTuL4k17xpkDSA8m7T8LFLSi5vsan5E",
  authDomain: "neurofleetx-project.firebaseapp.com",
  databaseURL: "https://neurofleetx-project-default-rtdb.firebaseio.com",
  projectId: "neurofleetx-project",
  storageBucket: "neurofleetx-project.firebasestorage.app",
  messagingSenderId: "45978453815",
  appId: "1:45978453815:web:66eb2d22126bbbf0677cb2",
  measurementId: "G-86MPTDQ57M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };