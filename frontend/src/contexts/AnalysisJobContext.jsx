import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { runAnalysis } from "../services/api";

const STORAGE_KEY = "yukti_analysis_job";

const DEFAULT_JOB = {
	status: "idle", // idle | running | success | error
	fileName: "",
	rowCount: 0,
	startedAt: null,
	completedAt: null,
	error: null,
};

const AnalysisJobContext = createContext(null);

function loadStoredJob() {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_JOB;
		const parsed = JSON.parse(raw);
		return { ...DEFAULT_JOB, ...parsed };
	} catch {
		return DEFAULT_JOB;
	}
}

export function AnalysisJobProvider({ children }) {
	const [job, setJob] = useState(loadStoredJob);
	const runningRef = useRef(false);

	useEffect(() => {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
	}, [job]);

	const startAnalysisJob = useCallback(
		async ({ getToken, uid, role, fileName = "", rowCount = 0, onSuccess }) => {
			if (runningRef.current) return false;
			runningRef.current = true;

			setJob({
				status: "running",
				fileName,
				rowCount,
				startedAt: Date.now(),
				completedAt: null,
				error: null,
			});

			try {
				const token = await getToken();
				const result = await runAnalysis(token, uid, role);

				sessionStorage.setItem("yukti_analysis", JSON.stringify(result));
				sessionStorage.setItem(
					"yukti_rowCount",
					String(result?.row_count || rowCount || 0),
				);

				if (typeof onSuccess === "function") {
					await onSuccess(result);
				}

				setJob((prev) => ({
					...prev,
					status: "success",
					completedAt: Date.now(),
					error: null,
				}));
			} catch (error) {
				setJob((prev) => ({
					...prev,
					status: "error",
					completedAt: Date.now(),
					error:
						error?.response?.data?.detail ||
						error?.message ||
						"Analysis failed",
				}));
			} finally {
				runningRef.current = false;
			}

			return true;
		},
		[],
	);

	const resetAnalysisJob = useCallback(() => {
		runningRef.current = false;
		setJob(DEFAULT_JOB);
		sessionStorage.removeItem(STORAGE_KEY);
	}, []);

	const value = useMemo(
		() => ({
			job,
			startAnalysisJob,
			resetAnalysisJob,
			isRunning: job.status === "running",
		}),
		[job, startAnalysisJob, resetAnalysisJob],
	);

	return (
		<AnalysisJobContext.Provider value={value}>
			{children}
		</AnalysisJobContext.Provider>
	);
}

export function useAnalysisJob() {
	const ctx = useContext(AnalysisJobContext);
	if (!ctx) {
		throw new Error("useAnalysisJob must be used inside AnalysisJobProvider");
	}
	return ctx;
}
