/**
 * Yukti Secrets Worker
 *
 * Cloudflare Worker that serves API keys and Firebase config as secrets.
 * All secrets are stored via `wrangler secret put <NAME>` and are never
 * checked into source control.
 *
 * Endpoints:
 *   GET /keys/backend   → returns AI API keys (requires AUTH_TOKEN)
 *   GET /keys/firebase  → returns Firebase config (public, CORS-gated)
 *   GET /health         → health check
 *
 * Auth: Bearer token in Authorization header must match the AUTH_TOKEN secret.
 *        The /keys/firebase endpoint is open (Firebase config is not secret)
 *         but still CORS-restricted to allowed origins.
 */

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname;

		// ── CORS ──
		const origin = request.headers.get("Origin") || "";
		const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim());
		const corsOrigin = allowed.includes(origin) ? origin : allowed[0] || "*";

		const corsHeaders = {
			"Access-Control-Allow-Origin": corsOrigin,
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Authorization, Content-Type",
			"Access-Control-Max-Age": "86400",
		};

		// Preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// Only GET
		if (request.method !== "GET") {
			return jsonResponse(405, { error: "Method not allowed" }, corsHeaders);
		}

		// ── Routes ──
		if (path === "/health") {
			return jsonResponse(
				200,
				{ status: "ok", worker: "yukti-secrets" },
				corsHeaders,
			);
		}

		if (path === "/keys/firebase") {
			// Firebase config is not truly secret (it's in every client bundle)
			// but we serve it from the worker so it's not hardcoded in source
			return jsonResponse(
				200,
				{
					apiKey: env.FIREBASE_API_KEY || "",
					authDomain: env.FIREBASE_AUTH_DOMAIN || "",
					projectId: env.FIREBASE_PROJECT_ID || "",
					storageBucket: env.FIREBASE_STORAGE_BUCKET || "",
					messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || "",
					appId: env.FIREBASE_APP_ID || "",
				},
				corsHeaders,
			);
		}

		if (path === "/keys/backend") {
			// Backend keys are actually secret — require auth
			const authErr = verifyAuth(request, env);
			if (authErr) return authErr;

			return jsonResponse(
				200,
				{
					GEMINI_API_KEY: env.GEMINI_API_KEY || "",
					GROQ_API_KEY: env.GROQ_API_KEY || "",
					ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY || "",
				},
				corsHeaders,
			);
		}

		return jsonResponse(404, { error: "Not found" }, corsHeaders);
	},
};

/* ── Helpers ── */

function verifyAuth(request, env) {
	const header = request.headers.get("Authorization") || "";
	const token = header.replace(/^Bearer\s+/i, "");

	if (!env.AUTH_TOKEN) {
		return jsonResponse(500, { error: "AUTH_TOKEN not configured on worker" });
	}
	if (!token || token !== env.AUTH_TOKEN) {
		return jsonResponse(401, {
			error: "Unauthorized — invalid or missing Bearer token",
		});
	}
	return null; // auth passed
}

function jsonResponse(status, body, extraHeaders = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			...extraHeaders,
		},
	});
}
