import { useState, useCallback } from "react";
import UploadZone from "../components/UploadZone";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { uploadFile, loadDemo } from "../services/api";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAnalysisJob } from "../contexts/useAnalysisJob";

export default function UploadPage() {
	const [error, setError] = useState(null);
	const { user, userProfile, getIdToken } = useAuth();
	const {
		startAnalysisJob,
		startActivity,
		updateActivityProgress,
		completeActivity,
	} = useAnalysisJob();
	const navigate = useNavigate();
	const role = userProfile?.role || "paid-user";

	const handleFileSelect = useCallback(
		async (file) => {
			let uploadActivityId = null;
			try {
				setError(null);
				uploadActivityId = startActivity({
					type: "upload",
					label: "Upload",
					message: "Uploading file and preparing prediction",
					fileName: file?.name || "Dataset",
					durationMs: 35000,
					progressCap: 90,
				});
				const token = await getIdToken();
				const result = await uploadFile(file, token, user?.uid, role);
				updateActivityProgress(
					uploadActivityId,
					100,
					"Upload complete. Starting prediction pipeline",
				);
				completeActivity(uploadActivityId, {
					status: "success",
					message: "Upload complete. Prediction started in background",
					forceProgress: 100,
				});

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
				if (uploadActivityId) {
					completeActivity(uploadActivityId, {
						status: "error",
						message: "Upload failed",
						error:
							err.response?.data?.detail ||
							err.message ||
							"Upload failed. Is the backend running?",
						forceProgress: 100,
					});
				}
				setError(
					err.response?.data?.detail ||
						"Upload failed. Is the backend running?",
				);
			}
		},
		[
			getIdToken,
			user,
			role,
			startAnalysisJob,
			navigate,
			startActivity,
			updateActivityProgress,
			completeActivity,
		],
	);

	const handleDemoLoad = useCallback(async () => {
		let uploadActivityId = null;
		try {
			setError(null);
			uploadActivityId = startActivity({
				type: "upload",
				label: "Upload",
				message: "Loading demo dataset",
				fileName: "Demo dataset",
				durationMs: 15000,
				progressCap: 90,
			});
			const token = await getIdToken();
			const result = await loadDemo(token);
			updateActivityProgress(
				uploadActivityId,
				100,
				"Demo loaded. Starting prediction pipeline",
			);
			completeActivity(uploadActivityId, {
				status: "success",
				message: "Demo loaded. Prediction started in background",
				forceProgress: 100,
			});

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
			if (uploadActivityId) {
				completeActivity(uploadActivityId, {
					status: "error",
					message: "Upload failed",
					error:
						err.response?.data?.detail ||
						err.message ||
						"Failed to load demo. Is the backend running?",
					forceProgress: 100,
				});
			}
			setError(
				err.response?.data?.detail ||
					"Failed to load demo. Is the backend running?",
			);
		}
	}, [
		getIdToken,
		startAnalysisJob,
		user,
		role,
		navigate,
		startActivity,
		updateActivityProgress,
		completeActivity,
	]);

	return (
		<div className="app-page">
			<div className="app-page-inner max-w-5xl mx-auto">
				{error && (
					<div className="max-w-2xl mx-auto mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
						{error}
					</div>
				)}
				<UploadZone
					onFileSelect={handleFileSelect}
					onDemoLoad={handleDemoLoad}
				/>
			</div>
		</div>
	);
}
