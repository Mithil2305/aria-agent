/**
 * Firebase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication → Email/Password sign-in method
 * 4. Create a Firestore Database (start in test mode)
 * 5. Go to Project Settings → General → Your apps → Add web app
 * 6. Copy the firebaseConfig object and paste below
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
	// TODO: Replace with your Firebase project config
	apiKey: "AIzaSyD51bOYTkWqehZMaz1NDqjSZtb2roHMZOs",
	authDomain: "aria-agent-5df34.firebaseapp.com",
	projectId: "aria-agent-5df34",
	storageBucket: "aria-agent-5df34.firebasestorage.app",
	messagingSenderId: "532315178894",
	appId: "1:532315178894:web:0e344ce66840702af0c6df",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
