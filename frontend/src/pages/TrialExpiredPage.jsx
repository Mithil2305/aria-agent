import { useAuth } from "../contexts/AuthContext";
import { Clock, ExternalLink, LogOut, ShieldX } from "lucide-react";

export default function TrialExpiredPage() {
	const { logout, userProfile } = useAuth();

	return (
		<div className="min-h-screen bg-surface-100 flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-md text-center">
				{/* Brand */}
				<div className="mb-8 animate-fade-in-up">
					<h1 className="text-2xl font-semibold text-surface-900 tracking-tight">
						Yukti
					</h1>
					<p className="text-xs text-surface-400 mt-1 tracking-wide uppercase">
						Business Intelligence
					</p>
				</div>

				{/* Card */}
				<div
					className="card-elevated p-8 animate-fade-in-up"
					style={{ animationDelay: "80ms" }}
				>
					<div className="flex justify-center mb-5">
						<div className="p-4 rounded-full bg-red-50">
							<ShieldX size={32} className="text-red-500" />
						</div>
					</div>

					<h2 className="text-lg font-semibold text-surface-900 mb-2">
						Free Trial Expired
					</h2>

					<p className="text-sm text-surface-500 mb-1">
						Hi{userProfile?.ownerName ? `, ${userProfile.ownerName}` : ""}! Your
						7-day free trial has ended.
					</p>
					<p className="text-sm text-surface-500 mb-6">
						To continue using Yukti's analytics and AI features, please upgrade
						to a paid plan.
					</p>

					{/* Trial info */}
					<div className="flex items-center justify-center gap-2 text-xs text-surface-400 mb-6">
						<Clock size={12} />
						<span>
							Trial started{" "}
							{userProfile?.trialStartDate?.toDate
								? userProfile.trialStartDate.toDate().toLocaleDateString()
								: "—"}
						</span>
					</div>

					{/* CTA */}
					<a
						href="https://mudmedia.vercel.app/book"
						target="_blank"
						rel="noopener noreferrer"
						className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
					>
						Upgrade Now
						<ExternalLink size={14} />
					</a>

					<button
						onClick={logout}
						className="w-full flex items-center justify-center gap-2 text-sm text-surface-400 hover:text-surface-600 transition-colors py-2"
					>
						<LogOut size={14} />
						Sign out
					</button>
				</div>

				<p className="text-xs text-surface-400 mt-6">
					Already upgraded?{" "}
					<button
						onClick={() => window.location.reload()}
						className="text-gold-600 hover:text-gold-700 font-medium"
					>
						Refresh to check
					</button>
				</p>
			</div>
		</div>
	);
}
