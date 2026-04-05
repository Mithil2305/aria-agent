import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";

export default function ProtectedRoute({ children }) {
	const { user, userProfile, loading, getTrialStatus, logout } = useAuth();
	const location = useLocation();
	const [signingOut, setSigningOut] = useState(false);
	const isAdminEmail =
		String(user?.email || "")
			.trim()
			.toLowerCase() === "admin@yukti.com";
	const isAdmin = userProfile?.role === "admin" || isAdminEmail;
	const isSuspended = !!userProfile?.managed?.suspended;

	useEffect(() => {
		let cancelled = false;
		if (!loading && user && !isAdmin && isSuspended) {
			setSigningOut(true);
			logout()
				.catch(() => {
					// Best effort sign-out; route guard will still redirect on auth change.
				})
				.finally(() => {
					if (!cancelled) setSigningOut(false);
				});
		}
		return () => {
			cancelled = true;
		};
	}, [loading, user, isAdmin, isSuspended, logout]);

	if (loading || signingOut) {
		return (
			<div className="min-h-screen bg-surface-100 flex items-center justify-center">
				<Loader size={24} className="text-gold-600 animate-spin" />
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;
	if (!user.emailVerified && !isAdminEmail) {
		return (
			<Navigate to="/login" replace state={{ unverifiedAccessBlocked: true }} />
		);
	}

	// Check if free-tier trial has expired
	const { isFreeTier, isTrialExpired } = getTrialStatus();
	if (
		!isAdminEmail &&
		isFreeTier &&
		isTrialExpired &&
		location.pathname !== "/trial-expired"
	) {
		return <Navigate to="/trial-expired" replace />;
	}

	if (!isAdmin && isSuspended) {
		return (
			<Navigate to="/login" replace state={{ suspendedAccessBlocked: true }} />
		);
	}

	return children;
}
