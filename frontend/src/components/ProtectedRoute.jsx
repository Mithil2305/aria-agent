import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "lucide-react";

export default function ProtectedRoute({ children }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-950 flex items-center justify-center">
				<Loader size={24} className="text-brand-400 animate-spin" />
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;

	return children;
}
