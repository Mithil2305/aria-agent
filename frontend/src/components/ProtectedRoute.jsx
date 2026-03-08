import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";

export default function ProtectedRoute({ children }) {
	const { user, loading, getTrialStatus } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<div className="min-h-screen bg-surface-100 flex items-center justify-center">
				<Loader size={24} className="text-gold-600 animate-spin" />
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;

	// Check if free-tier trial has expired
	const { isFreeTier, isTrialExpired } = getTrialStatus();
	if (isFreeTier && isTrialExpired && location.pathname !== "/trial-expired") {
		return <Navigate to="/trial-expired" replace />;
	}

	return children;
}
