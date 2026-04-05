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

const SERVICE_KEYS = Object.keys(RATE_LIMITS);

export const ADMIN_LIMITS = Object.fromEntries(
	SERVICE_KEYS.map((key) => [key, Number.POSITIVE_INFINITY]),
);

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
	if (role === "admin") return ADMIN_LIMITS;
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

/** Read admin-managed service controls from user profile doc. */
export async function getUserServiceControls(uid) {
	if (!uid) {
		return {
			suspended: false,
			disabledServices: [],
			serviceLimits: {},
		};
	}

	try {
		const snap = await getDoc(doc(db, "users", uid));
		if (!snap.exists()) {
			return {
				suspended: false,
				disabledServices: [],
				serviceLimits: {},
			};
		}

		const managed = snap.data()?.managed || {};
		return {
			suspended: !!managed.suspended,
			disabledServices: Array.isArray(managed.disabledServices)
				? managed.disabledServices
				: [],
			serviceLimits:
				typeof managed.serviceLimits === "object" && managed.serviceLimits
					? managed.serviceLimits
					: {},
		};
	} catch {
		return {
			suspended: false,
			disabledServices: [],
			serviceLimits: {},
		};
	}
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
	const controls = await getUserServiceControls(uid);
	const limits = getLimitsForRole(role);

	const result = {};
	for (const [action, limit] of Object.entries(limits)) {
		const overrideLimit = controls.serviceLimits?.[action];
		const effectiveLimit =
			role === "admin"
				? Number.POSITIVE_INFINITY
				: Number.isFinite(Number(overrideLimit))
					? Number(overrideLimit)
					: limit;
		const used = counts[action] ?? 0;
		const isDisabled = controls.disabledServices.includes(action);
		const isSuspended = controls.suspended;
		const remaining = Number.isFinite(effectiveLimit)
			? Math.max(0, effectiveLimit - used)
			: Number.POSITIVE_INFINITY;
		const percentage =
			Number.isFinite(effectiveLimit) && effectiveLimit > 0
				? Math.round((used / effectiveLimit) * 100 * 10) / 10
				: 0;

		result[action] = {
			used,
			limit: effectiveLimit,
			remaining,
			percentage,
			disabled: isDisabled,
			suspended: isSuspended,
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
	const controls = await getUserServiceControls(uid);
	if (controls.suspended) {
		return {
			allowed: false,
			used: 0,
			limit: 0,
			remaining: 0,
			reason: "suspended",
		};
	}

	if (controls.disabledServices.includes(action)) {
		return {
			allowed: false,
			used: 0,
			limit: 0,
			remaining: 0,
			reason: "disabled",
		};
	}

	const limits = getLimitsForRole(role);
	const defaultLimit = limits[action];
	const overrideLimit = controls.serviceLimits?.[action];
	const limit =
		role === "admin"
			? Number.POSITIVE_INFINITY
			: Number.isFinite(Number(overrideLimit))
				? Number(overrideLimit)
				: defaultLimit;
	if (limit === undefined)
		return { allowed: true, used: 0, limit: 0, remaining: 0 };
	if (!Number.isFinite(limit)) {
		return {
			allowed: true,
			used: 0,
			limit,
			remaining: Number.POSITIVE_INFINITY,
			reason: null,
		};
	}

	const snap = await getDoc(usageRef(uid));
	const used = snap.exists() ? (snap.data()[action] ?? 0) : 0;

	return {
		allowed: used < limit,
		used,
		limit,
		remaining: Math.max(0, limit - used),
		reason: used < limit ? null : "quota",
	};
}

/**
 * Increment usage counter for `action` in Firestore.
 * Call this AFTER a successful backend response.
 */
export async function recordUsage(uid, action) {
	if (!uid) return;
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
		if (status.reason === "suspended") {
			throw new Error(
				"Your account is temporarily suspended by admin. Contact support for reactivation.",
			);
		}
		if (status.reason === "disabled") {
			throw new Error(
				`${label} is currently disabled for your account by admin.`,
			);
		}
		const msg =
			role === "free-tier"
				? `Free trial limit reached for ${label} (${status.limit} use). Upgrade to continue.`
				: `Monthly limit reached for ${label} (${status.limit}/month). Resets on the 1st of next month.`;
		throw new Error(msg);
	}
	if (!Number.isFinite(status.limit)) {
		return {
			used: status.used,
			limit: status.limit,
			remaining: Number.POSITIVE_INFINITY,
		};
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
