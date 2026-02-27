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
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_PROJECT.firebaseapp.com",
	projectId: "YOUR_PROJECT_ID",
	storageBucket: "YOUR_PROJECT.appspot.com",
	messagingSenderId: "YOUR_SENDER_ID",
	appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
