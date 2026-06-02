import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA8t5iKcOgMRLI542zEnBcwjBXM6TDBR38",
  authDomain: "restaurant-management-sy-80cee.firebaseapp.com",
  projectId: "restaurant-management-sy-80cee",
  storageBucket: "restaurant-management-sy-80cee.firebasestorage.app",
  messagingSenderId: "333067576570",
  appId: "1:333067576570:web:91f5741db7f5d45619ba43",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;