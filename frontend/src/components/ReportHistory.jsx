import { useState } from "react";
import {
	Clock,
	FileText,
	ChevronRight,
	Trash2,
	Loader2,
	BarChart3,
	Sparkles,
	Brain,
	AlertCircle,
	History,
} from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

/**
 * ReportHistory — Shows a list of previously generated analysis reports.
 * Each card displays date, filename, AI provider, narrative preview.
 * Clicking loads the full report into the Dashboard.
 */
export default function ReportHistory({
	reports,
	loading,
	onLoadReport,
	onDelete,
}) {
	const { user } = useAuth();
	const [deletingId, setDeletingId] = useState(null);

	const handleDelete = async (e, reportId) => {
		e.stopPropagation();
		if (!user || !reportId) return;

		setDeletingId(reportId);
		try {
			await deleteDoc(doc(db, "users", user.uid, "reports", reportId));
			onDelete?.(reportId);
		} catch {
			// Silently fail
		} finally {
			setDeletingId(null);
		}
	};

	const formatDate = (dateStr) => {
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
		} catch {
			return "Unknown date";
		}
	};

	const formatTime = (dateStr) => {
		try {
			const d = new Date(dateStr);
			return d.toLocaleTimeString("en-IN", {
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return "";
		}
	};

	const getProviderInfo = (provider) => {
		switch (provider) {
			case "gemini":
				return { label: "Gemini", color: "text-blue-600 bg-blue-50" };
			case "groq":
				return { label: "Groq", color: "text-orange-600 bg-orange-50" };
			case "claude":
				return { label: "Claude", color: "text-purple-600 bg-purple-50" };
			case "rule_based":
				return {
					label: "Rule-based",
					color: "text-surface-500 bg-surface-100",
				};
			default:
				return { label: "AI", color: "text-gold-600 bg-gold-50" };
		}
	};

	if (loading) {
		return (
			<div className="card p-8 text-center">
				<Loader2
					size={20}
					className="animate-spin text-surface-400 mx-auto mb-2"
				/>
				<p className="text-xs text-surface-400">Loading past reports...</p>
			</div>
		);
	}

	if (!reports || reports.length === 0) {
		return null; // Don't render anything if no reports
	}

	return (
		<div className="animate-fade-in-up">
			<div className="flex items-center gap-2 mb-4">
				<div className="p-1.5 rounded-md bg-surface-100">
					<History size={14} className="text-surface-500" />
				</div>
				<h2 className="text-sm font-medium text-surface-700">Past Reports</h2>
				<span className="text-[10px] text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
					{reports.length}
				</span>
			</div>

			<div className="space-y-2.5">
				{reports.map((report) => {
					const provider = getProviderInfo(report.ai_provider);
					return (
						<div
							key={report.id}
							role="button"
							tabIndex={0}
							onClick={() => onLoadReport(report)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onLoadReport(report);
								}
							}}
							className="group w-full text-left card-hover p-4 transition-all cursor-pointer"
						>
							<div className="flex items-start justify-between gap-3">
								{/* Left: Info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1.5">
										<FileText size={13} className="text-surface-400 shrink-0" />
										<span className="text-sm font-medium text-surface-800 truncate">
											{report.filename || "Analysis Report"}
										</span>
									</div>

									{/* Date & time */}
									<div className="flex items-center gap-3 mb-2">
										<span className="flex items-center gap-1 text-[11px] text-surface-500">
											<Clock size={10} />
											{formatDate(report.date)}{" "}
											<span className="text-surface-400">
												{formatTime(report.date)}
											</span>
										</span>
										<span
											className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${provider.color}`}
										>
											{provider.label}
										</span>
									</div>

									{/* Stats row */}
									<div className="flex items-center gap-3 text-[11px] text-surface-400">
										<span className="flex items-center gap-1">
											<BarChart3 size={10} />
											{report.rowCount || 0} rows
										</span>
										{report.kpiCount > 0 && (
											<span className="flex items-center gap-1">
												<Sparkles size={10} />
												{report.kpiCount} KPIs
											</span>
										)}
										{report.insightCount > 0 && (
											<span className="flex items-center gap-1">
												<Brain size={10} />
												{report.insightCount} insights
											</span>
										)}
									</div>

									{/* Narrative preview */}
									{report.narrative && (
										<p className="text-[11px] text-surface-400 mt-2 line-clamp-2 leading-relaxed">
											{report.narrative}
										</p>
									)}
								</div>

								{/* Right: Actions */}
								<div className="flex items-center gap-1.5 shrink-0">
									<button
										onClick={(e) => handleDelete(e, report.id)}
										disabled={deletingId === report.id}
										className="p-1.5 rounded-md text-surface-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
										title="Delete report"
									>
										{deletingId === report.id ? (
											<Loader2 size={13} className="animate-spin" />
										) : (
											<Trash2 size={13} />
										)}
									</button>
									<ChevronRight
										size={16}
										className="text-surface-300 group-hover:text-gold-500 transition-colors"
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
