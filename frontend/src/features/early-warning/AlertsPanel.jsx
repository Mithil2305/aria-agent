import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	AlertTriangle,
	Bell,
	CheckCircle,
	Info,
} from "lucide-react";

import {
	dismissAlert,
	evaluateWarnings,
	fetchActiveAlerts,
} from "../../api/alertsApi";

const SEVERITY_CONFIG = {
	critical: {
		icon: AlertCircle,
		color: "text-red-600",
		bg: "bg-red-50",
		border: "border-red-300",
		label: "Critical",
	},
	high: {
		icon: AlertTriangle,
		color: "text-orange-600",
		bg: "bg-orange-50",
		border: "border-orange-300",
		label: "High",
	},
	medium: {
		icon: Bell,
		color: "text-yellow-600",
		bg: "bg-yellow-50",
		border: "border-yellow-300",
		label: "Medium",
	},
	low: {
		icon: Info,
		color: "text-blue-600",
		bg: "bg-blue-50",
		border: "border-blue-300",
		label: "Low",
	},
};

export default function AlertsPanel({ refreshKey = "analysis" }) {
	const queryClient = useQueryClient();

	const evaluateMutation = useMutation({
		mutationFn: () => evaluateWarnings(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["activeAlerts", refreshKey] });
		},
	});

	const dismissMutation = useMutation({
		mutationFn: dismissAlert,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["activeAlerts", refreshKey] });
		},
	});

	const { data, isLoading } = useQuery({
		queryKey: ["activeAlerts", refreshKey],
		queryFn: fetchActiveAlerts,
		refetchInterval: 1000 * 60 * 5,
	});

	useEffect(() => {
		evaluateMutation.mutate();
		// evaluate whenever a new analysis refreshes this panel
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshKey]);

	const alerts = data?.alerts || [];
	const sortOrder = { critical: 0, high: 1, medium: 2, low: 3 };
	const sorted = [...alerts].sort(
		(a, b) => (sortOrder[a.severity] ?? 9) - (sortOrder[b.severity] ?? 9),
	);

	if (isLoading) {
		return <div className="animate-pulse h-24 rounded-lg bg-surface-100" />;
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-lg flex items-center gap-2">
					<Bell className="w-5 h-5" /> Early Warnings
				</h2>
				<span className="text-sm text-surface-500">{sorted.length} active</span>
			</div>

			{sorted.length === 0 && (
				<div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
					<CheckCircle className="w-5 h-5" />
					<span>All metrics look healthy. No active warnings.</span>
				</div>
			)}

			{sorted.map((alert) => (
				<AlertCard
					key={alert.id}
					alert={alert}
					onDismiss={() => dismissMutation.mutate(alert.id)}
				/>
			))}
		</div>
	);
}

function AlertCard({ alert, onDismiss }) {
	const {
		icon: Icon,
		color,
		bg,
		border,
		label,
	} = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;

	return (
		<div className={`rounded-lg border ${border} ${bg} p-4 space-y-3`}>
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					<Icon className={`w-5 h-5 ${color} shrink-0`} />
					<div>
						<span className={`text-xs font-semibold uppercase ${color}`}>
							{label}
						</span>
						<p className="font-semibold text-surface-800 text-sm">
							{alert.title}
						</p>
					</div>
				</div>
				<button
					onClick={onDismiss}
					className="text-surface-400 hover:text-surface-600 text-xs"
				>
					Dismiss
				</button>
			</div>
			<p className="text-sm text-surface-600">{alert.detail}</p>
			<div>
				<p className="text-xs font-semibold text-surface-500 mb-1">
					Suggested Actions:
				</p>
				<ul className="space-y-1">
					{(alert.suggested_actions || []).map((action, index) => (
						<li
							key={`${alert.id}-action-${index}`}
							className="text-xs text-surface-700 flex items-start gap-2"
						>
							<span className="mt-0.5 text-surface-400">→</span> {action}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
