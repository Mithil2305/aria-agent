/**
 * Firebase Configuration
 *
 * Firebase configuration is loaded from backend endpoint `/api/public/firebase-config`.
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

async function getBackendFirebaseConfig() {
	const candidates = [];

	if (typeof window !== "undefined") {
		const { protocol, hostname, host, port } = window.location;
		const originBase = `${protocol}//${host}`;
		const backendBase = `${window.location.protocol}//${window.location.hostname}:8000`;

		// In Vite/dev ports, skip same-origin call to avoid HTML 404 responses.
		if (port && port !== "8000") {
			candidates.push(`${backendBase}/api/public/firebase-config`);
			if (hostname === "localhost") {
				candidates.push(
					`${protocol}//127.0.0.1:8000/api/public/firebase-config`,
				);
			}
		} else {
			candidates.push(`${originBase}/api/public/firebase-config`);
			if (backendBase !== originBase) {
				candidates.push(`${backendBase}/api/public/firebase-config`);
			}
		}
	} else {
		candidates.push("http://localhost:8000/api/public/firebase-config");
	}

	let lastError = null;
	for (const url of candidates) {
		try {
			const response = await fetch(url, {
				method: "GET",
				headers: { Accept: "application/json" },
			});

			if (!response.ok) {
				lastError = new Error(
					`Firebase config request failed (${response.status})`,
				);
				continue;
			}

			const contentType = response.headers.get("content-type") || "";
			if (!contentType.toLowerCase().includes("application/json")) {
				lastError = new Error(
					`Firebase config response from ${url} is not JSON.`,
				);
				continue;
			}

			const payload = await response.json();
			const config = payload?.config || null;

			if (payload?.configured && hasRequiredFirebaseKeys(config)) {
				return config;
			}

			lastError = new Error(
				"Firebase configuration unavailable on backend. Set FIREBASE_API_KEY and FIREBASE_PROJECT_ID (plus other FIREBASE_* values).",
			);
		} catch (err) {
			lastError = err;
		}
	}

	throw new Error(
		lastError?.message ||
			"Unable to fetch Firebase configuration from backend.",
	);
}

/**
 * Initialize Firebase using backend-provided config.
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

	const config = await getBackendFirebaseConfig();

	app = initializeApp(config);
	auth = getAuth(app);
	db = getFirestore(app);

	return app;
}

export default app;
