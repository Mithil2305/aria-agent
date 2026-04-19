import { getAuth } from "firebase/auth";

const DEFAULT_API_BASE =
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

export async function fetchNewsFeed(keywords) {
	const headers = await getAuthHeaders();
	const params = new URLSearchParams({ keywords: keywords.join(",") });
	const response = await fetch(`${DEFAULT_API_BASE}/api/news/feed?${params}`, {
		headers,
	});
	if (!response.ok) {
		throw new Error(`News API error: ${response.status}`);
	}
	return response.json();
}

export async function fetchNewsCategories() {
	const headers = await getAuthHeaders();
	const response = await fetch(`${DEFAULT_API_BASE}/api/news/categories`, {
		headers,
	});
	if (!response.ok) {
		throw new Error(`Categories API error: ${response.status}`);
	}
	return response.json();
}
