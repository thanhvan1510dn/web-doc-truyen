import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2TNziXnZbyYa9l4WUozdTpfFo1wKy8K0",
  authDomain: "web-truyen-6bac3.firebaseapp.com",
  projectId: "web-truyen-6bac3",
  storageBucket: "web-truyen-6bac3.firebasestorage.app",
  messagingSenderId: "886164625336",
  appId: "1:886164625336:web:809cd3858a385ec4fbe14d",
  measurementId: "G-MSPSRZ0BH9"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);