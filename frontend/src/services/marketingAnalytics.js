const STORAGE_KEY = "yukti_marketing_events";
const SESSION_KEY = "yukti_marketing_session_id";
const MAX_BUFFERED_EVENTS = 200;

function getSessionId() {
	let sessionId = sessionStorage.getItem(SESSION_KEY);
	if (!sessionId) {
		sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
		sessionStorage.setItem(SESSION_KEY, sessionId);
	}
	return sessionId;
}

function readEvents() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function writeEvents(events) {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify(events.slice(-MAX_BUFFERED_EVENTS)),
		);
	} catch {
		// Best effort only.
	}
}

export function trackMarketingEvent(eventName, payload = {}) {
	if (!eventName) return;

	const event = {
		eventName,
		timestamp: new Date().toISOString(),
		sessionId: getSessionId(),
		path: window.location.pathname,
		...payload,
	};

	const events = readEvents();
	events.push(event);
	writeEvents(events);

	try {
		if (typeof window.gtag === "function") {
			window.gtag("event", eventName, payload);
		}
	} catch {
		// Ignore analytics provider failures.
	}

	try {
		if (window.plausible) {
			window.plausible(eventName, { props: payload });
		}
	} catch {
		// Ignore analytics provider failures.
	}

	if (import.meta.env.DEV) {
		// Keep this only in dev to avoid noisy production logs.
		console.debug("[marketing-event]", event);
	}
}

export function trackLandingCtaClick({ variant, target, location, label }) {
	trackMarketingEvent("landing_cta_click", {
		variant,
		target,
		location,
		label,
	});
}

export function getBufferedMarketingEvents() {
	return readEvents();
}
