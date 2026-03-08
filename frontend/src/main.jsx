import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initFirebase } from "./firebase";

const root = createRoot(document.getElementById("root"));

// Show a minimal loader while Firebase config is fetched from the worker
root.render(
	<div
		style={{
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			height: "100vh",
			fontFamily: "Inter, system-ui, sans-serif",
			color: "#6b7280",
		}}
	>
		<p>Loading…</p>
	</div>,
);

initFirebase()
	.then(() => {
		root.render(
			<StrictMode>
				<App />
			</StrictMode>,
		);
	})
	.catch((err) => {
		console.error("Firebase init failed:", err);
		root.render(
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
					fontFamily: "Inter, system-ui, sans-serif",
					color: "#dc2626",
					padding: "2rem",
					textAlign: "center",
				}}
			>
				<p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
					Failed to load configuration
				</p>
				<p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{err.message}</p>
			</div>,
		);
	});
