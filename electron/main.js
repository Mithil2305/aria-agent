const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");
const os = require("os");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let backendProcess;
const PORT = 8765;

function writeFatalLog(scope, error) {
	try {
		const dir = path.join(app.getPath("userData"), "logs");
		fs.mkdirSync(dir, { recursive: true });
		const stamp = new Date().toISOString();
		const message = `${stamp} [${scope}] ${error?.stack || error || "unknown error"}${os.EOL}`;
		fs.appendFileSync(path.join(dir, "fatal.log"), message);
	} catch {
		// Logging must never crash the app.
	}
}

log.transports.file.level = "info";
autoUpdater.logger = log;

function startBackend() {
	const packagedCandidates = [
		path.join(process.resourcesPath, "backend", "yukti-backend.exe"),
		path.join(
			process.resourcesPath,
			"backend",
			"Yukti-Backend",
			"Yukti-Backend.exe",
		),
	];
	const devCandidates = [
		path.join(__dirname, "../backend/dist/Yukti-Backend/Yukti-Backend.exe"),
		path.join(__dirname, "../backend/dist/yukti-backend.exe"),
	];

	const candidates = app.isPackaged ? packagedCandidates : devCandidates;
	const exePath = candidates.find((candidate) => fs.existsSync(candidate));

	if (!exePath) {
		const err = new Error(
			`Backend executable not found. Checked: ${candidates.join(", ")}`,
		);
		writeFatalLog("backend-path", err);
		dialog.showErrorBox("Backend Error", err.message);
		return;
	}

	const cwd = app.isPackaged
		? path.dirname(exePath)
		: exePath.toLowerCase().includes("yukti-backend\\yukti-backend.exe")
			? path.dirname(exePath)
			: path.join(__dirname, "../backend");

	backendProcess = spawn(exePath, ["--port", String(PORT)], {
		stdio: ["ignore", "pipe", "pipe"],
		detached: false,
		cwd,
		env: {
			...process.env,
			PYTHONIOENCODING: "utf-8",
			PYTHONUTF8: "1",
		},
	});

	backendProcess.stdout?.on("data", (chunk) => {
		log.info(`[backend] ${chunk.toString().trim()}`);
	});

	backendProcess.stderr?.on("data", (chunk) => {
		log.error(`[backend] ${chunk.toString().trim()}`);
	});

	backendProcess.on("exit", (code, signal) => {
		log.warn(`Backend process exited with code=${code} signal=${signal}`);
	});

	backendProcess.on("error", (err) => {
		writeFatalLog("backend-spawn", err);
		dialog.showErrorBox(
			"Backend Error",
			`Failed to start backend:\n${err.message}`,
		);
	});
}

function waitForBackend(retries = 180, delay = 500) {
	return new Promise((resolve, reject) => {
		const attempt = () => {
			http
				.get(`http://127.0.0.1:${PORT}/health`, (res) => {
					if (res.statusCode === 200) return resolve();
					retry();
				})
				.on("error", retry);
		};

		const retry = () => {
			if (retries-- <= 0)
				return reject(new Error("Backend did not start in time."));
			setTimeout(attempt, delay);
		};

		attempt();
	});
}

app.whenReady().then(async () => {
	process.on("uncaughtException", (err) => {
		writeFatalLog("uncaughtException", err);
		log.error(err);
	});

	process.on("unhandledRejection", (reason) => {
		writeFatalLog("unhandledRejection", reason);
		log.error(reason);
	});

	startBackend();

	try {
		await waitForBackend();
	} catch (err) {
		dialog.showErrorBox("Startup Error", err.message);
		app.quit();
		return;
	}

	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 1024,
		minHeight: 600,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
		},
		icon: path.join(__dirname, "assets", "icon.ico"),
		titleBarStyle: "default",
	});

	win.loadURL(`http://127.0.0.1:${PORT}`);
	win.setMenuBarVisibility(false);

	win.webContents.on("render-process-gone", (_event, details) => {
		writeFatalLog("render-process-gone", JSON.stringify(details));
	});

	if (app.isPackaged) {
		autoUpdater.checkForUpdatesAndNotify().catch((err) => {
			log.error(`Auto-update check failed: ${err.message}`);
		});
	}
});

app.on("window-all-closed", () => {
	if (backendProcess) backendProcess.kill();
	app.quit();
});
