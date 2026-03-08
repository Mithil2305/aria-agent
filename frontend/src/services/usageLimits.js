/**
 * Firestore Usage & Rate Limits Service
 *
 * All usage tracking is stored in Firestore:
 *   usage/{uid}/months/{YYYY-MM}  →  { ai_strategy: 3, bill_scan: 5, … }
 *
 * The frontend checks + increments counters directly — the backend is
 * responsible only for analysis / reasoning / predictions.
 */

import { db } from "../firebase";
import {
	doc,
	getDoc,
	setDoc,
	increment,
	serverTimestamp,
} from "firebase/firestore";

// ── Monthly quotas for PAID users ──
export const RATE_LIMITS = {
	ai_strategy: 15,
	ai_premium: 2,
	bill_scan: 20,
	data_upload: 30,
	analysis: 30,
	report_download: 15,
};

// ── Free-tier trial limits (one-time, not monthly) ──
export const FREE_TIER_LIMITS = {
	ai_strategy: 1,
	ai_premium: 1,
	bill_scan: 1,
	data_upload: 2,
	analysis: 2,
	report_download: 1,
};

/**
 * Get the correct limits object based on user role.
 * @param {"free-tier"|"paid-user"|string} role
 */
export function getLimitsForRole(role) {
	return role === "free-tier" ? FREE_TIER_LIMITS : RATE_LIMITS;
}

// ── Category metadata (labels, icons, descriptions) ──
export const CATEGORIES = {
	ai_strategy: {
		label: "Strategy Advisor",
		icon: "lightbulb",
		description: "AI-powered strategy generation",
	},
	ai_premium: {
		label: "Premium Analysis",
		icon: "crown",
		description: "Monthly deep-dive analysis",
	},
	bill_scan: {
		label: "Bill Scanner",
		icon: "scan",
		description: "OCR bill image scanning",
	},
	data_upload: {
		label: "Data Uploads",
		icon: "upload",
		description: "CSV/Excel file uploads",
	},
	analysis: {
		label: "Analysis Runs",
		icon: "bar-chart",
		description: "Full analytics pipeline",
	},
	report_download: {
		label: "PDF Reports",
		icon: "file-text",
		description: "Intelligence report downloads",
	},
};

// ── Helpers ──

/** Current month key, e.g. "2025-07" */
function getMonthKey() {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

/** Firestore doc ref: usage/{uid}/months/{YYYY-MM} */
function usageRef(uid) {
	return doc(db, "usage", uid, "months", getMonthKey());
}

// ── Public API ──

/**
 * Read current month's usage for a user.
 * @param {string} uid
 * @param {"free-tier"|"paid-user"|string} [role="paid-user"]
 * Returns an object like:
 *   { ai_strategy: { used, limit, remaining, percentage }, … }
 */
export async function getUserUsage(uid, role = "paid-user") {
	const snap = await getDoc(usageRef(uid));
	const counts = snap.exists() ? snap.data() : {};
	const limits = getLimitsForRole(role);

	const result = {};
	for (const [action, limit] of Object.entries(limits)) {
		const used = counts[action] ?? 0;
		result[action] = {
			used,
			limit,
			remaining: Math.max(0, limit - used),
			percentage: limit > 0 ? Math.round((used / limit) * 100 * 10) / 10 : 0,
		};
	}
	return result;
}

/**
 * Check whether the user still has quota for `action`.
 * @param {string} uid
 * @param {string} action
 * @param {"free-tier"|"paid-user"|string} [role="paid-user"]
 * Returns { allowed: true/false, used, limit, remaining }.
 */
export async function checkUsage(uid, action, role = "paid-user") {
	const limits = getLimitsForRole(role);
	const limit = limits[action];
	if (limit === undefined)
		return { allowed: true, used: 0, limit: 0, remaining: 0 };

	const snap = await getDoc(usageRef(uid));
	const used = snap.exists() ? (snap.data()[action] ?? 0) : 0;

	return {
		allowed: used < limit,
		used,
		limit,
		remaining: Math.max(0, limit - used),
	};
}

/**
 * Increment usage counter for `action` in Firestore.
 * Call this AFTER a successful backend response.
 */
export async function recordUsage(uid, action) {
	const ref = usageRef(uid);
	await setDoc(
		ref,
		{
			[action]: increment(1),
			_lastUpdated: serverTimestamp(),
		},
		{ merge: true },
	);
}

/**
 * Combined check + record in one flow.
 * Throws an Error (message includes limit info) if quota is exhausted.
 * Otherwise increments the counter and returns the new counts.
 */
export async function checkAndRecordUsage(uid, action, role = "paid-user") {
	const status = await checkUsage(uid, action, role);
	if (!status.allowed) {
		const label = CATEGORIES[action]?.label ?? action;
		const msg =
			role === "free-tier"
				? `Free trial limit reached for ${label} (${status.limit} use). Upgrade to continue.`
				: `Monthly limit reached for ${label} (${status.limit}/month). Resets on the 1st of next month.`;
		throw new Error(msg);
	}
	await recordUsage(uid, action);
	return {
		used: status.used + 1,
		limit: status.limit,
		remaining: status.remaining - 1,
	};
}

/**
 * Get full limits dashboard data (mirrors old /api/limits shape).
 */
export async function getLimitsDashboard(uid, role = "paid-user") {
	const usage = await getUserUsage(uid, role);

	const now = new Date();
	const month = getMonthKey();

	// Days remaining in the month
	const nextMonth =
		now.getMonth() === 11
			? new Date(now.getFullYear() + 1, 0, 1)
			: new Date(now.getFullYear(), now.getMonth() + 1, 1);

	const daysRemaining = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));

	const resetDate = nextMonth.toISOString().slice(0, 10);

	return {
		month,
		daysRemaining,
		resetDate,
		usage,
		categories: CATEGORIES,
	};
}
