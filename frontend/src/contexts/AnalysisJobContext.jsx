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
const ACTIVITY_STORAGE_KEY = "yukti_background_activity";
const COMPLETION_VISIBILITY_MS = 60 * 1000;
const RUNNING_STALE_GRACE_MS = 20 * 1000;

const DEFAULT_JOB = {
	status: "idle", // idle | running | success | error
	fileName: "",
	rowCount: 0,
	startedAt: null,
	completedAt: null,
	error: null,
};

const DEFAULT_ACTIVITY = {
	id: null,
	type: "", // upload | prediction | processing
	label: "",
	message: "",
	status: "idle", // idle | running | success | error
	progress: 0,
	progressCap: 92,
	durationMs: 60000,
	fileName: "",
	rowCount: 0,
	startedAt: null,
	completedAt: null,
	hideAt: null,
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

function loadStoredActivity() {
	try {
		const raw = sessionStorage.getItem(ACTIVITY_STORAGE_KEY);
		if (!raw) return DEFAULT_ACTIVITY;
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return DEFAULT_ACTIVITY;
		const hydrated = { ...DEFAULT_ACTIVITY, ...parsed };

		if (hydrated.status === "running") {
			const startedAt = Number(hydrated.startedAt || 0);
			const durationMs = Math.max(Number(hydrated.durationMs || 60000), 1000);
			const staleAfter = durationMs + RUNNING_STALE_GRACE_MS;
			if (!startedAt || Date.now() - startedAt > staleAfter) {
				const completedAt = Date.now();
				return {
					...hydrated,
					status: "error",
					progress: 100,
					completedAt,
					hideAt: completedAt + COMPLETION_VISIBILITY_MS,
					message:
						hydrated.message ||
						"Task status timed out after reload. Please retry if needed.",
					error:
						hydrated.error ||
						"Task status timed out after reload. Please retry if needed.",
				};
			}
		}

		return hydrated;
	} catch {
		return DEFAULT_ACTIVITY;
	}
}

export function AnalysisJobProvider({ children }) {
	const [job, setJob] = useState(loadStoredJob);
	const [activity, setActivity] = useState(loadStoredActivity);
	const runningRef = useRef(false);
	const activityIntervalRef = useRef(null);
	const activityHideTimeoutRef = useRef(null);

	useEffect(() => {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
	}, [job]);

	useEffect(() => {
		sessionStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity));
	}, [activity]);

	const clearActivityInterval = useCallback(() => {
		if (activityIntervalRef.current) {
			clearInterval(activityIntervalRef.current);
			activityIntervalRef.current = null;
		}
	}, []);

	const clearActivityHideTimeout = useCallback(() => {
		if (activityHideTimeoutRef.current) {
			clearTimeout(activityHideTimeoutRef.current);
			activityHideTimeoutRef.current = null;
		}
	}, []);

	const startActivityProgressLoop = useCallback(
		({ id, startedAt, durationMs = 60000, progressCap = 92 }) => {
			clearActivityInterval();
			activityIntervalRef.current = setInterval(() => {
				setActivity((prev) => {
					if (prev.id !== id || prev.status !== "running") {
						return prev;
					}

					const elapsed = Math.max(
						0,
						Date.now() - Number(startedAt || Date.now()),
					);
					const ratio = Math.min(elapsed / Math.max(durationMs, 1000), 1);
					const nextProgress = Math.min(
						progressCap,
						Math.max(prev.progress, ratio * progressCap),
					);

					if (nextProgress === prev.progress) return prev;
					return { ...prev, progress: nextProgress };
				});
			}, 120);
		},
		[clearActivityInterval],
	);

	const startActivity = useCallback(
		({
			type = "processing",
			label = "Background task",
			message = "Working in the background",
			fileName = "",
			rowCount = 0,
			durationMs = 60000,
			progressCap = 92,
		} = {}) => {
			clearActivityHideTimeout();
			const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const startedAt = Date.now();

			setActivity({
				...DEFAULT_ACTIVITY,
				id,
				type,
				label,
				message,
				status: "running",
				fileName,
				rowCount,
				startedAt,
				durationMs,
				progressCap,
			});

			startActivityProgressLoop({ id, startedAt, durationMs, progressCap });
			return id;
		},
		[clearActivityHideTimeout, startActivityProgressLoop],
	);

	const updateActivityProgress = useCallback((id, progress, message = null) => {
		setActivity((prev) => {
			if (prev.id !== id || prev.status !== "running") return prev;
			const nextProgress = Math.min(
				99,
				Math.max(prev.progress, progress ?? prev.progress),
			);
			return {
				...prev,
				progress: Number.isFinite(nextProgress) ? nextProgress : prev.progress,
				message: message ?? prev.message,
			};
		});
	}, []);

	const completeActivity = useCallback(
		(
			id,
			{
				status = "success",
				message = "Done",
				error = null,
				forceProgress = 100,
			} = {},
		) => {
			clearActivityInterval();
			clearActivityHideTimeout();

			const completedAt = Date.now();
			const hideAt = completedAt + COMPLETION_VISIBILITY_MS;

			setActivity((prev) => {
				if (prev.id !== id) return prev;
				return {
					...prev,
					status,
					message: message ?? prev.message,
					error,
					progress: forceProgress,
					completedAt,
					hideAt,
				};
			});

			activityHideTimeoutRef.current = setTimeout(() => {
				setActivity((prev) => {
					if (prev.id !== id || prev.hideAt !== hideAt) return prev;
					return DEFAULT_ACTIVITY;
				});
			}, COMPLETION_VISIBILITY_MS);
		},
		[clearActivityHideTimeout, clearActivityInterval],
	);

	const clearActivity = useCallback(() => {
		clearActivityInterval();
		clearActivityHideTimeout();
		setActivity(DEFAULT_ACTIVITY);
		sessionStorage.removeItem(ACTIVITY_STORAGE_KEY);
	}, [clearActivityHideTimeout, clearActivityInterval]);

	useEffect(() => {
		if (!activity?.id) return;

		if (activity.status === "running") {
			startActivityProgressLoop({
				id: activity.id,
				startedAt: activity.startedAt || Date.now(),
				durationMs: activity.durationMs || 60000,
				progressCap: activity.progressCap || 92,
			});
			return;
		}

		clearActivityInterval();

		if (activity.hideAt) {
			const remaining = Number(activity.hideAt) - Date.now();
			if (remaining <= 0) {
				setActivity(DEFAULT_ACTIVITY);
				return;
			}
			clearActivityHideTimeout();
			activityHideTimeoutRef.current = setTimeout(() => {
				setActivity((prev) =>
					prev.id === activity.id ? DEFAULT_ACTIVITY : prev,
				);
			}, remaining);
		}
	}, [
		activity.id,
		activity.status,
		activity.startedAt,
		activity.durationMs,
		activity.progressCap,
		activity.hideAt,
		startActivityProgressLoop,
		clearActivityHideTimeout,
		clearActivityInterval,
	]);

	useEffect(() => {
		return () => {
			clearActivityInterval();
			clearActivityHideTimeout();
		};
	}, [clearActivityHideTimeout, clearActivityInterval]);

	const startAnalysisJob = useCallback(
		async ({ getToken, uid, role, fileName = "", rowCount = 0, onSuccess }) => {
			if (runningRef.current) return false;
			runningRef.current = true;
			const analysisActivityId = startActivity({
				type: "prediction",
				label: "Prediction",
				message: "Generating predictions in the background",
				fileName,
				rowCount,
				durationMs: 90000,
				progressCap: 95,
			});

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
				completeActivity(analysisActivityId, {
					status: "success",
					message: "Prediction completed successfully",
					forceProgress: 100,
				});
			} catch (error) {
				const failureMessage =
					error?.response?.data?.detail || error?.message || "Analysis failed";
				setJob((prev) => ({
					...prev,
					status: "error",
					completedAt: Date.now(),
					error: failureMessage,
				}));
				completeActivity(analysisActivityId, {
					status: "error",
					message: "Prediction failed",
					error: failureMessage,
					forceProgress: 100,
				});
			} finally {
				runningRef.current = false;
			}

			return true;
		},
		[completeActivity, startActivity],
	);

	const resetAnalysisJob = useCallback(() => {
		runningRef.current = false;
		setJob(DEFAULT_JOB);
		sessionStorage.removeItem(STORAGE_KEY);
	}, []);

	const value = useMemo(
		() => ({
			job,
			activity,
			startAnalysisJob,
			resetAnalysisJob,
			startActivity,
			updateActivityProgress,
			completeActivity,
			clearActivity,
			isRunning: job.status === "running" || activity.status === "running",
		}),
		[
			job,
			activity,
			startAnalysisJob,
			resetAnalysisJob,
			startActivity,
			updateActivityProgress,
			completeActivity,
			clearActivity,
		],
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
