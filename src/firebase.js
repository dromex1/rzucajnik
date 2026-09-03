import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzXMgZexSjf6NEN7ii8gQJ0sySc8p-oFU",
  authDomain: "rzucajnik.firebaseapp.com",
  projectId: "rzucajnik",
  storageBucket: "rzucajnik.firebasestorage.app",
  messagingSenderId: "596791913393",
  appId: "1:596791913393:web:464e3167528f12c7e3ab90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
