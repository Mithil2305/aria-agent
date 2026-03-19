import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Save generated advisor/report outputs so future analysis can use user memory.
 */
export async function saveSectionReport(user, section, payload) {
	if (!user?.uid || !section) return;

	const docPayload = {
		section,
		date: new Date().toISOString(),
		createdAt: serverTimestamp(),
		summary: payload?.summary || null,
		top_issue: payload?.top_issue || null,
		action: payload?.action || null,
		trend: payload?.trend || null,
		payload: payload || {},
	};

	await addDoc(
		collection(db, "users", user.uid, "generatedReports"),
		docPayload,
	);
}
