import { useContext } from "react";
import { AnalysisJobContext } from "./analysisJobContextBase";

export function useAnalysisJob() {
	const ctx = useContext(AnalysisJobContext);
	if (!ctx) {
		throw new Error("useAnalysisJob must be used inside AnalysisJobProvider");
	}
	return ctx;
}
