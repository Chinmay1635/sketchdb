# SketchDB Desktop (Electron)

This package creates a Windows desktop app for SketchDB while keeping the web deployment unchanged.

## Env Strategy For Public Release

Electron uses frontend env values at build time from client mode=desktop.

- Source file: ../client/.env.desktop
- Optional local override: ../client/.env.desktop.local

Current desktop defaults are already set to your Render backend.

## Prerequisites

- Node.js 18+
- Existing backend hosted at https://sketchdb.onrender.com

## Install

```powershell
cd electron
npm install
```

## Run desktop app (development-like local run)

```powershell
npm start
```

This command builds frontend assets from ../client and opens Electron.

## Build Windows installer

```powershell
npm run dist
```

Artifacts are generated in electron/release.

## Desktop Icon

- Source icon image: ../client/public/logo.png
- Generated Windows icon: ./build/icon.ico
- Icon generation runs automatically before `npm start` and `npm run dist`.

## Windows 10/11 Installer Output

After `npm run dist`, look in `electron/release` for:
- `SketchDB Setup <version>.exe` (NSIS installer)
- `SketchDB <version>.exe` (portable executable)

## Public Release Checklist

1. Backend (Render) env must include:
	- ALLOW_DESKTOP_CLIENT=true
	- ALLOW_DESKTOP_AUTH_WITHOUT_TURNSTILE=true
	- CLIENT_URL=<your Vercel production URL>
	- CLIENT_URLS=<comma-separated allowed web origins>
2. Redeploy Render after env changes.
3. Desktop frontend env:
	- Verify ../client/.env.desktop values are correct for production.
4. Build installer:
	- npm run dist
5. Distribute only files from electron/release.

## Notes On Secrets

- Do not place server secrets in client VITE_ envs.
- VITE_ envs are embedded into frontend bundle and visible to users.

## Notes

- Frontend web deployment on Vercel is unaffected.
- Desktop uses local file-based UI loading and still calls your Render backend.
- Routing in desktop uses HashRouter to avoid file:// navigation issues.

## Troubleshooting

- Black screen on launch:
	- Cause: desktop loaded absolute asset URLs like /assets/... from file://, so JS/CSS failed to load.
	- Fix already applied: desktop build now uses Vite base=./ through the electron build script.
	- Run again:
		- npm run build:client
		- npm start
