/**
 * Firebase Configuration
 *
 * Firebase configuration is loaded from backend endpoint `/api/public/firebase-config`.
 * Firebase is initialized lazily (on demand), so public pages render immediately
 * even when backend is down.
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
let initPromise = null;
const FIREBASE_CONFIG_TIMEOUT_MS = 8000;

function hasRequiredFirebaseKeys(config) {
	return Boolean(config?.apiKey) && Boolean(config?.projectId);
}

async function getBackendFirebaseConfig() {
	const candidates = [];
	const seen = new Set();

	const addCandidate = (url) => {
		if (!url || seen.has(url)) return;
		seen.add(url);
		candidates.push(url);
	};

	if (typeof window !== "undefined") {
		const { protocol, hostname, host, port } = window.location;
		const originBase = `${protocol}//${host}`;
		const backendBase = `${window.location.protocol}//${window.location.hostname}:8000`;
		const envApiBase = import.meta.env.VITE_API_URL || "";

		if (envApiBase) {
			addCandidate(
				`${envApiBase.replace(/\/$/, "")}/api/public/firebase-config`,
			);
		}

		// In Vite/dev ports, skip same-origin call to avoid HTML 404 responses.
		if (port && port !== "8000") {
			addCandidate(`${backendBase}/api/public/firebase-config`);
			if (hostname === "localhost") {
				addCandidate(`${protocol}//127.0.0.1:8000/api/public/firebase-config`);
			}
		} else {
			addCandidate(`${originBase}/api/public/firebase-config`);
			if (backendBase !== originBase) {
				addCandidate(`${backendBase}/api/public/firebase-config`);
			}
		}
	} else {
		addCandidate("http://localhost:8000/api/public/firebase-config");
	}

	let lastError = null;
	for (const url of candidates) {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			FIREBASE_CONFIG_TIMEOUT_MS,
		);
		try {
			const response = await fetch(url, {
				method: "GET",
				headers: { Accept: "application/json" },
				signal: controller.signal,
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
			if (err?.name === "AbortError") {
				lastError = new Error(
					`Firebase config request timed out after ${Math.round(FIREBASE_CONFIG_TIMEOUT_MS / 1000)}s (${url})`,
				);
			} else {
				lastError = err;
			}
		} finally {
			clearTimeout(timeoutId);
		}
	}

	throw new Error(
		lastError?.message ||
			"Unable to fetch Firebase configuration from backend.",
	);
}

/**
 * Initialize Firebase using backend-provided config (lazy / on-demand).
 */
export async function initFirebase() {
	// Already initialized (e.g. Vite HMR re-run)
	if (getApps().length > 0) {
		app = getApps()[0];
		auth = getAuth(app);
		db = getFirestore(app);
		return app;
	}

	if (initPromise) return initPromise;

	initPromise = (async () => {
		const config = await getBackendFirebaseConfig();
		app = initializeApp(config);
		auth = getAuth(app);
		db = getFirestore(app);
		return app;
	})();

	try {
		return await initPromise;
	} finally {
		initPromise = null;
	}
}

export default app;
