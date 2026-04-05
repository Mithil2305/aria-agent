import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	Outlet,
	useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
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
import AdminPage from "./pages/AdminPage";
import SetupPage from "./pages/SetupPage";
import DocumentationPage from "./pages/DocumentationPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import ApiReferencePage from "./pages/ApiReferencePage";
import AboutMudMediaPage from "./pages/AboutMudMediaPage";
import CareersPage from "./pages/CareersPage";
import ContactUsPage from "./pages/ContactUsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PricingPage from "./pages/PricingPage";
import { AnalysisJobProvider } from "./contexts/AnalysisJobContext";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	}, [pathname]);

	return null;
}

function PublicLayout() {
	return (
		<>
			<Navbar />
			<Outlet />
		</>
	);
}

function App() {
	return (
		<BrowserRouter>
			<ScrollToTop />
			<AuthProvider>
				<AnalysisJobProvider>
					<Routes>
						{/* Public routes */}
						<Route element={<PublicLayout />}>
							<Route path="/" element={<HomePage />} />
							<Route path="/setup" element={<SetupPage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/register" element={<RegisterPage />} />
							<Route path="/documentation" element={<DocumentationPage />} />
							<Route path="/case-studies" element={<CaseStudiesPage />} />
							<Route path="/help-center" element={<HelpCenterPage />} />
							<Route path="/api-reference" element={<ApiReferencePage />} />
							<Route path="/about" element={<AboutMudMediaPage />} />
							<Route path="/careers" element={<CareersPage />} />
							<Route path="/contact-us" element={<ContactUsPage />} />
							<Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
							<Route path="/pricing" element={<PricingPage />} />
							<Route
								path="/terms-of-service"
								element={<TermsOfServicePage />}
							/>
						</Route>

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
							<Route path="/dashboard" element={<DashboardPage />} />
							<Route path="/upload" element={<UploadPage />} />
							<Route path="/daily-log" element={<DailyLogPage />} />
							<Route path="/profile" element={<ProfilePage />} />
							<Route path="/analyse" element={<AnalysePage />} />
							<Route path="/stock" element={<StockManagementPage />} />
							<Route path="/integrations" element={<IntegrationsPage />} />
							<Route path="/strategy" element={<StrategyAdvisorPage />} />
							<Route path="/premium" element={<PremiumAnalysisPage />} />
							<Route path="/limits" element={<LimitsPage />} />
							<Route path="/admin" element={<AdminPage />} />
						</Route>

						{/* Catch-all */}
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</AnalysisJobProvider>
			</AuthProvider>
			<Footer />
		</BrowserRouter>
	);
}

export default App;
