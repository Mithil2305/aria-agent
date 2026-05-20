import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";

export default function ProtectedRoute({ children }) {
	const {
		user,
		userProfile,
		loading,
		authInitialized,
		getTrialStatus,
		logout,
		initAuthIfNeeded,
	} = useAuth();
	const location = useLocation();
	const signingOutRef = useRef(false);
	const isAdminEmail =
		String(user?.email || "")
			.trim()
			.toLowerCase() === "admin@yukti.com";
	const isAdmin = userProfile?.role === "admin" || isAdminEmail;
	const isSuspended = !!userProfile?.managed?.suspended;
	const shouldSignOut = !loading && user && !isAdmin && isSuspended;

	useEffect(() => {
		initAuthIfNeeded().catch(() => {
			// Guard handles missing auth state through redirect fallback.
		});
	}, [initAuthIfNeeded]);

	useEffect(() => {
		if (!shouldSignOut || signingOutRef.current) return;
		signingOutRef.current = true;
		logout()
			.catch(() => {
				// Best effort sign-out; route guard will still redirect on auth change.
			})
			.finally(() => {
				signingOutRef.current = false;
			});
	}, [shouldSignOut, logout]);

	if (!authInitialized || loading || shouldSignOut) {
		return (
			<div className="min-h-screen bg-surface-100 flex items-center justify-center">
				<Loader size={24} className="text-gold-600 animate-spin" />
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;

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
