/**
 * Firebase Configuration
 *
 * All secrets are fetched from the Cloudflare Secrets Worker at startup.
 * `initFirebase()` is called from main.jsx BEFORE the React tree renders,
 * so every component that imports `auth` / `db` gets working instances.
 *
 * SETUP: Set VITE_SECRETS_WORKER_URL in .env or Vercel env vars, e.g.:
 *   VITE_SECRETS_WORKER_URL=https://yukti-secrets.<you>.workers.dev
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These are populated by initFirebase() before the app renders
export let auth = /** @type {import("firebase/auth").Auth} */ (null);
export let db = /** @type {import("firebase/firestore").Firestore} */ (null);
let app = null;

/**
 * Fetch Firebase config from the Cloudflare Worker and initialize Firebase.
 * Must be called (and awaited) once at app startup before rendering.
 */
export async function initFirebase() {
	const workerUrl = import.meta.env.VITE_SECRETS_WORKER_URL;

	if (!workerUrl) {
		throw new Error(
			"VITE_SECRETS_WORKER_URL is not set. " +
				"Add it to your .env or Vercel environment variables.",
		);
	}

	const resp = await fetch(`${workerUrl}/keys/firebase`, {
		signal: AbortSignal.timeout(8000),
	});

	if (!resp.ok) {
		throw new Error(
			`Secrets worker returned ${resp.status}: ${await resp.text()}`,
		);
	}

	const config = await resp.json();

	if (!config.apiKey || !config.projectId) {
		throw new Error(
			"Firebase secrets missing from worker. " +
				"Run: npx wrangler secret put FIREBASE_API_KEY (and others).",
		);
	}

	app = initializeApp(config);
	auth = getAuth(app);
	db = getFirestore(app);

	return app;
}

export default app;
