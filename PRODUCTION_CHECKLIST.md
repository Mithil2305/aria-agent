# Yukti Production Checklist

## Final Run Status (2026-03-20)

- Installer build: PASS
	- Built artifact: `electron/dist/Yukti Setup 1.0.0.exe`
	- Verified latest timestamp: `20-03-2026 11:55 PM`
	- Generated update artifacts: `electron/dist/latest.yml`, `electron/dist/Yukti Setup 1.0.0.exe.blockmap`
- Backend source diagnostics: PASS
	- No current errors in updated files after final code fixes.
- Backend exe rebuild with latest source: BLOCKED IN CURRENT TERMINAL SESSION
	- Multiple clean PyInstaller runs were attempted but the build flow repeatedly failed to produce a verifiable updated `backend/dist/yukti-backend.exe` timestamp.
	- Primary blocker observed: file lock on `backend/build/yukti_backend/yukti-backend.pkg` (`WinError 32`) and unstable long-running build completion in this shell workflow.
- Signed release publish: BLOCKED (external prerequisite)
	- `npm run dist:signed` built artifacts but publish failed with: missing `GH_TOKEN`.
	- Code-signing and publish require CI/runtime secrets: `CSC_LINK`, `CSC_KEY_PASSWORD`, `GH_TOKEN`.


## 1. Code Signing

- Obtain an EV/OV code-signing certificate.
- Set CI secrets: `CSC_LINK`, `CSC_KEY_PASSWORD`, and optional `GH_TOKEN`.
- Build signed release using `npm run dist:signed` in `electron/`.
- Verify installer signature on a clean Windows machine.

## 2. Secrets Storage Validation

- Run first-time setup and save API keys.
- Confirm `%APPDATA%/Yukti/config.json` contains encrypted payload format (`__encrypted__` + `payload`).
- Confirm app still reads keys after restart.

## 3. Crash Logging and Diagnostics

- Verify `%APPDATA%/Yukti/logs/main.log` and `%APPDATA%/Yukti/logs/fatal.log` are created.
- Force a renderer crash and confirm it appears in logs.
- Confirm backend startup failures show dialog and are logged.

## 4. Update Channel

- Create a GitHub release with generated artifacts.
- Ensure installer and blockmap are uploaded.
- Launch installed app and verify update check runs in packaged mode.

## 5. Security Verification

- Confirm backend CORS defaults allow local desktop origins only.
- If deploying backend remotely, set `YUKTI_CORS_ALLOW_ORIGINS` explicitly.
- Set `YUKTI_ALLOWED_HOSTS` in production if non-local hostnames are needed.

## 6. QA Matrix

- Fresh install on Windows 10 and Windows 11.
- First-run setup with API keys.
- Login and auth flow.
- Upload dataset, run analysis, download PDF.
- Strategy and premium analysis path validation.
- Offline behavior: clear error for internet-required features.
- Upgrade install test (install new version over existing one).
- Uninstall/reinstall test preserving user data expectations.

## 7. Release Gate (must pass all)

- Signed installer generated.
- No critical runtime errors in logs.
- Smoke tests pass on clean machine.
- GitHub release published with notes.
- Rollback plan documented.
