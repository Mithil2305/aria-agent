import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TrialExpiredPage from "./pages/TrialExpiredPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import DailyLogPage from "./pages/DailyLogPage";
import ProfilePage from "./pages/ProfilePage";
import AnalysePage from "./pages/AnalysePage";
import StockManagementPage from "./pages/StockManagementPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import StrategyAdvisorPage from "./pages/StrategyAdvisorPage";
import PremiumAnalysisPage from "./pages/PremiumAnalysisPage";
import LimitsPage from "./pages/LimitsPage";

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					{/* Public routes */}
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />

					{/* Trial expired — protected but outside AppLayout */}
					<Route
						path="/trial-expired"
						element={
							<ProtectedRoute>
								<TrialExpiredPage />
							</ProtectedRoute>
						}
					/>

					{/* Protected routes — wrapped in SaaS sidebar layout */}
					<Route
						element={
							<ProtectedRoute>
								<AppLayout />
							</ProtectedRoute>
						}
					>
						<Route path="/" element={<DashboardPage />} />
						<Route path="/upload" element={<UploadPage />} />
						<Route path="/daily-log" element={<DailyLogPage />} />
						<Route path="/profile" element={<ProfilePage />} />
						<Route path="/analyse" element={<AnalysePage />} />
						<Route path="/stock" element={<StockManagementPage />} />
						<Route path="/integrations" element={<IntegrationsPage />} />
						<Route path="/strategy" element={<StrategyAdvisorPage />} />
						<Route path="/premium" element={<PremiumAnalysisPage />} />
						<Route path="/limits" element={<LimitsPage />} />
					</Route>

					{/* Catch-all */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
