import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const TOAST_THEME = {
	error: {
		icon: AlertCircle,
		container: "border-red-300/60 bg-red-100/80 text-slate-900",
		title: "text-slate-900",
		body: "text-slate-800",
	},
	success: {
		icon: CheckCircle2,
		container: "border-emerald-300/40 bg-emerald-300/15 text-emerald-100",
		title: "text-emerald-100",
		body: "text-emerald-100/90",
	},
	info: {
		icon: Info,
		container: "border-cyan-300/40 bg-cyan-300/15 text-cyan-100",
		title: "text-cyan-100",
		body: "text-cyan-100/90",
	},
};

export default function ToastStack({ toasts = [], onDismiss }) {
	if (!toasts.length) return null;

	return (
		<div className="fixed top-4 right-4 z-120 w-[min(92vw,24rem)] space-y-2 pointer-events-none">
			{toasts.map((toast) => {
				const theme = TOAST_THEME[toast.type] || TOAST_THEME.info;
				const Icon = theme.icon;
				return (
					<div
						key={toast.id}
						className={`pointer-events-auto rounded-xl border backdrop-blur-xl shadow-xl px-4 py-3 ${theme.container}`}
						role="status"
					>
						<div className="flex gap-3 items-start">
							<Icon size={16} className="mt-0.5 shrink-0" />
							<div className="min-w-0 flex-1">
								<p className={`text-sm font-semibold ${theme.title}`}>
									{toast.title}
								</p>
								{toast.message ? (
									<p className={`text-xs mt-1 leading-relaxed ${theme.body}`}>
										{toast.message}
									</p>
								) : null}
							</div>
							<button
								type="button"
								onClick={() => onDismiss?.(toast.id)}
								className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
								aria-label="Dismiss notification"
							>
								<X size={14} />
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}
