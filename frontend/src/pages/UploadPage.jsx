import { useState, useCallback } from "react";
import UploadZone from "../components/UploadZone";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { uploadFile, loadDemo } from "../services/api";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAnalysisJob } from "../contexts/AnalysisJobContext";

export default function UploadPage() {
	const [error, setError] = useState(null);
	const { user, userProfile, getIdToken } = useAuth();
	const { startAnalysisJob, isRunning } = useAnalysisJob();
	const navigate = useNavigate();
	const role = userProfile?.role || "paid-user";

	const handleFileSelect = useCallback(
		async (file) => {
			try {
				setError(null);
				const token = await getIdToken();
				const result = await uploadFile(file, token, user?.uid, role);

				await startAnalysisJob({
					getToken: getIdToken,
					uid: user?.uid,
					role,
					fileName: result.filename,
					rowCount: result.row_count,
					onSuccess: async (analysisResult) => {
						if (!user) return;
						try {
							await setDoc(doc(db, "users", user.uid, "analyses", "latest"), {
								filename: analysisResult.filename,
								rowCount: analysisResult.row_count || result.row_count || 0,
								analysisData: JSON.stringify(analysisResult),
								createdAt: serverTimestamp(),
							});
						} catch {
							// Ignore Firestore save failures
						}
					},
				});

				navigate("/dashboard");
			} catch (err) {
				setError(
					err.response?.data?.detail ||
						"Upload failed. Is the backend running?",
				);
			}
		},
		[getIdToken, user, role, startAnalysisJob, navigate],
	);

	const handleDemoLoad = useCallback(async () => {
		try {
			setError(null);
			const token = await getIdToken();
			const result = await loadDemo(token);

			await startAnalysisJob({
				getToken: getIdToken,
				uid: user?.uid,
				role,
				fileName: result.filename,
				rowCount: result.row_count,
				onSuccess: async (analysisResult) => {
					if (!user) return;
					try {
						await setDoc(doc(db, "users", user.uid, "analyses", "latest"), {
							filename: analysisResult.filename,
							rowCount: analysisResult.row_count || result.row_count || 0,
							analysisData: JSON.stringify(analysisResult),
							createdAt: serverTimestamp(),
						});
					} catch {
						// Ignore Firestore save failures
					}
				},
			});

			navigate("/dashboard");
		} catch (err) {
			setError(
				err.response?.data?.detail ||
					"Failed to load demo. Is the backend running?",
			);
		}
	}, [getIdToken, startAnalysisJob, user, role, navigate]);

	return (
		<div className="min-h-screen">
			{isRunning && (
				<div className="max-w-2xl mx-auto mt-4 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm text-center">
					Analysis is running in the background. Feel free to explore other
					pages while we process your data.
				</div>
			)}
			{error && (
				<div className="max-w-2xl mx-auto mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
					{error}
				</div>
			)}
			<UploadZone onFileSelect={handleFileSelect} onDemoLoad={handleDemoLoad} />
		</div>
	);
}
