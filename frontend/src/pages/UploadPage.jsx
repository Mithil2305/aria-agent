import { useState, useCallback } from "react";
import UploadZone from "../components/UploadZone";
import ProcessingView from "../components/ProcessingView";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { uploadFile, loadDemo, runAnalysis } from "../services/api";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function UploadPage() {
	const [stage, setStage] = useState("upload");
	const [fileName, setFileName] = useState("");
	const [rowCount, setRowCount] = useState(0);
	const [error, setError] = useState(null);
	const { user, userProfile, getIdToken } = useAuth();
	const navigate = useNavigate();
	const role = userProfile?.role || "paid-user";

	const handleFileSelect = useCallback(
		async (file) => {
			try {
				setError(null);
				const token = await getIdToken();
				const result = await uploadFile(file, token, user?.uid, role);
				setFileName(result.filename);
				setRowCount(result.row_count);
				setStage("processing");
			} catch (err) {
				setError(
					err.response?.data?.detail ||
						"Upload failed. Is the backend running?",
				);
			}
		},
		[getIdToken, user, role],
	);

	const handleDemoLoad = useCallback(async () => {
		try {
			setError(null);
			const token = await getIdToken();
			const result = await loadDemo(token);
			setFileName(result.filename);
			setRowCount(result.row_count);
			setStage("processing");
		} catch (err) {
			setError(
				err.response?.data?.detail ||
					"Failed to load demo. Is the backend running?",
			);
		}
	}, [getIdToken]);

	const handleProcessingComplete = useCallback(async () => {
		try {
			setError(null);
			const token = await getIdToken();
			const result = await runAnalysis(token, user?.uid, role);

			// Save analysis to Firestore under user
			if (user) {
				try {
					await setDoc(doc(db, "users", user.uid, "analyses", "latest"), {
						filename: result.filename,
						rowCount: result.rowCount,
						analysisData: JSON.stringify(result),
						createdAt: serverTimestamp(),
					});
				} catch {
					// Silently fail Firestore save — analysis still works locally
				}
			}

			// Store in sessionStorage for the dashboard
			sessionStorage.setItem("yukti_analysis", JSON.stringify(result));
			sessionStorage.setItem("yukti_rowCount", rowCount.toString());
			navigate("/");
		} catch (err) {
			setError(err.response?.data?.detail || "Analysis failed.");
			setStage("upload");
		}
	}, [getIdToken, user, role, rowCount, navigate]);

	return (
		<div className="min-h-screen">
			{error && (
				<div className="max-w-2xl mx-auto mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
					{error}
				</div>
			)}
			{stage === "upload" && (
				<UploadZone
					onFileSelect={handleFileSelect}
					onDemoLoad={handleDemoLoad}
				/>
			)}
			{stage === "processing" && (
				<ProcessingView
					onComplete={handleProcessingComplete}
					fileName={fileName}
					rowCount={rowCount}
				/>
			)}
		</div>
	);
}
