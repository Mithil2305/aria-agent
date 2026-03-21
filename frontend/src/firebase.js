/**
 * Firebase Configuration
 *
 * Firebase configuration is loaded from VITE_FIREBASE_* variables.
 * `initFirebase()` is called from main.jsx BEFORE the React tree renders,
 * so every component that imports `auth` / `db` gets working instances.
 *
 * We use a plain object (`firebase`) as the export container so that
 * all importers always get the same live references — even across
 * Vite HMR cycles.
 *
 * Usage in other files:
 *   import { auth, db } from "../firebase";
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/** @type {import("firebase/auth").Auth} */
export let auth = null;
/** @type {import("firebase/firestore").Firestore} */
export let db = null;
let app = null;

function hasRequiredFirebaseKeys(config) {
	return Boolean(config?.apiKey) && Boolean(config?.projectId);
}

function getEnvFirebaseConfig() {
	const env = import.meta.env;
	return {
		apiKey: env.VITE_FIREBASE_API_KEY || "",
		authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
		projectId: env.VITE_FIREBASE_PROJECT_ID || "",
		storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
		messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
		appId: env.VITE_FIREBASE_APP_ID || "",
	};
}

/**
 * Initialize Firebase using VITE_FIREBASE_* variables.
 * Must be called (and awaited) once at app startup before rendering.
 */
export async function initFirebase() {
	// Already initialised (e.g. Vite HMR re-run)
	if (getApps().length > 0) {
		app = getApps()[0];
		auth = getAuth(app);
		db = getFirestore(app);
		return app;
	}

	const config = getEnvFirebaseConfig();

	if (!hasRequiredFirebaseKeys(config)) {
		throw new Error(
			"Firebase configuration unavailable. Define VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID (plus other VITE_FIREBASE_* values).",
		);
	}

	app = initializeApp(config);
	auth = getAuth(app);
	db = getFirestore(app);

	return app;
}

export default app;
