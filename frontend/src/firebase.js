/**
 * Firebase Configuration
 *
 * All secrets are fetched from the Cloudflare Secrets Worker at startup.
 * `initFirebase()` is called from main.jsx BEFORE the React tree renders,
 * so every component that imports `auth` / `db` gets working instances.
 *
 * We use a plain object (`firebase`) as the export container so that
 * all importers always get the same live references — even across
 * Vite HMR cycles.
 *
 * Usage in other files:
 *   import { auth, db } from "../firebase";
 *
 * SETUP: Set VITE_SECRETS_WORKER_URL in .env or Vercel env vars, e.g.:
 *   VITE_SECRETS_WORKER_URL=https://yukti-secrets.<you>.workers.dev
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/** @type {import("firebase/auth").Auth} */
export let auth = null;
/** @type {import("firebase/firestore").Firestore} */
export let db = null;
let app = null;

function normalizeBaseUrl(url) {
	return String(url || "").replace(/\/+$/, "");
}

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

async function fetchFirebaseConfigFromWorker(workerUrl) {
	const base = normalizeBaseUrl(workerUrl);
	const candidates = [
		`${base}/keys/firebase`,
		`${base}/api/keys/firebase`,
		`${base}/firebase`,
		`${base}/firebase-config`,
	];

	const errors = [];

	for (const url of candidates) {
		try {
			const resp = await fetch(url, {
				signal: AbortSignal.timeout(8000),
			});

			if (!resp.ok) {
				errors.push(`${url} -> ${resp.status}`);
				continue;
			}

			const config = await resp.json();
			if (!hasRequiredFirebaseKeys(config)) {
				errors.push(`${url} -> missing apiKey/projectId`);
				continue;
			}

			return { config, source: url, errors };
		} catch (err) {
			errors.push(`${url} -> ${err?.message || "request failed"}`);
		}
	}

	return { config: null, source: null, errors };
}

function getWorkerUrlCandidates() {
	const env = import.meta.env;
	const primary = env.VITE_SECRETS_WORKER_URL || "";
	const fallbacks = String(env.VITE_SECRETS_WORKER_FALLBACK_URLS || "")
		.split(",")
		.map((u) => u.trim())
		.filter(Boolean);

	return [primary, ...fallbacks].filter(Boolean);
}

function shouldPreferEnvConfig() {
	const env = import.meta.env;
	const forceWorker =
		String(env.VITE_FIREBASE_PREFER_WORKER || "").toLowerCase() === "true";
	if (forceWorker) return false;

	const hasDirectConfig = hasRequiredFirebaseKeys(getEnvFirebaseConfig());
	return Boolean(env.DEV) && hasDirectConfig;
}

/**
 * Fetch Firebase config from the Cloudflare Worker and initialize Firebase.
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

	let config = null;
	const debugErrors = [];
	const envConfig = getEnvFirebaseConfig();

	if (shouldPreferEnvConfig()) {
		config = envConfig;
		console.info(
			"[firebase] DEV mode detected: using VITE_FIREBASE_* config before worker fetch",
		);
	}

	const workerUrls = getWorkerUrlCandidates();

	if (!config) {
		for (const workerUrl of workerUrls) {
			const workerResult = await fetchFirebaseConfigFromWorker(workerUrl);
			if (workerResult.config) {
				config = workerResult.config;
				if (workerResult.source) {
					console.info(
						`[firebase] Loaded config from worker: ${workerResult.source}`,
					);
				}
				break;
			}

			if (workerResult.errors.length) {
				debugErrors.push(...workerResult.errors);
			}
		}
	}

	if (!config) {
		if (hasRequiredFirebaseKeys(envConfig)) {
			config = envConfig;
			console.info(
				"[firebase] Loaded config from VITE_FIREBASE_* environment variables",
			);
		}
	}

	if (!hasRequiredFirebaseKeys(config)) {
		const detail = debugErrors.length
			? ` Attempted worker routes: ${debugErrors.join(" | ")}.`
			: "";
		throw new Error(
			"Firebase configuration unavailable. Set VITE_SECRETS_WORKER_URL to a valid worker, " +
				"or define VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID (plus other VITE_FIREBASE_* values)." +
				detail,
		);
	}

	app = initializeApp(config);
	auth = getAuth(app);
	db = getFirestore(app);

	return app;
}

export default app;
