import { getAuth } from "firebase/auth";

const BASE_URL =
	import.meta.env.VITE_API_URL ||
	`${window.location.protocol}//${window.location.hostname}:8000`;

async function getAuthHeaders() {
	const user = getAuth().currentUser;
	if (!user) {
		throw new Error("Not authenticated");
	}
	const token = await user.getIdToken();
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};
}

export async function evaluateWarnings(payload) {
	const headers = await getAuthHeaders();
	const hasPayload = payload && typeof payload === "object";
	const response = await fetch(`${BASE_URL}/api/alerts/evaluate`, {
		method: "POST",
		headers,
		body: hasPayload ? JSON.stringify(payload) : undefined,
	});
	if (!response.ok) {
		throw new Error(`Alerts evaluate failed: ${response.status}`);
	}
	return response.json();
}

export async function fetchActiveAlerts() {
	const headers = await getAuthHeaders();
	const response = await fetch(`${BASE_URL}/api/alerts/active`, { headers });
	if (!response.ok) {
		throw new Error(`Alerts fetch failed: ${response.status}`);
	}
	return response.json();
}

export async function dismissAlert(alertId) {
	const headers = await getAuthHeaders();
	const response = await fetch(`${BASE_URL}/api/alerts/dismiss/${alertId}`, {
		method: "POST",
		headers,
	});
	if (!response.ok) {
		throw new Error(`Alert dismiss failed: ${response.status}`);
	}
	return response.json();
}
