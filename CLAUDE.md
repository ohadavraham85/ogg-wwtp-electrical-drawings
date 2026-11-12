# OhadCad

Panel-layout and single-line diagram drawing tool, a standalone PWA.
Live at https://ohadavraham85.github.io/ogg-wwtp-electrical-drawings/ (GitHub Pages from `main`, no build step).

## Working with the owner
- Reply in Hebrew only, including progress messages, in plain simple language.
- Never ask for or accept passwords or Google-account access. When pointing to the Firebase console, say "אל תשלח לי סיסמאות או גישה לחשבון" and give click-by-click steps.
- The owner's email is private: never write it into this (public) repo.

## Layout
- `index.html`: the shell. It handles Google sign-in (Firebase Auth compat), the owner/approval gate, user management and bulk import. It hosts the drawing tool in an iframe and exposes `window.panelDesignsBridge`, which provides:
  - `me`, `list`, `info`, `load`, `save`, `remove`, `onChange`
  - `menu()`, which returns extra items for the tool's drawer.
- `cad.html`: the drawing tool, a single file. It finds the bridge as `SH` (via `window.parent.panelDesignsBridge`). Opened directly, it saves to localStorage.
  - Parts live in `DEF[type]`.
  - Documents: `state.objs` / `state.alt`, and `state.tab` is 'panel' | 'sld' | 'both'.
  - Library: `LIB`.
  - Templates: `TEMPLATES`.
  - Autosave: `scheduleSave` / `doAutoSave`.
  - Drawer menu: `openDrawer`.
- `sw.js`: offline cache. Pages are network-first with `cache: 'no-cache'`; other assets are stale-while-revalidate.
- `manifest.webmanifest`, `icons/`, `favicon.ico`: the official OhadCad brand kit (amber "O" ring + crosshair icon, white/amber wordmark for dark backgrounds, amber/dark wordmark for light ones). Colors, fonts (Heebo/Inter/JetBrains Mono) and style are in `icons/wordmark-dark.svg` / `icons/wordmark-light.svg` and documented in the brand kit's own README (not kept in this repo) — the live palette is in both `index.html`'s and `cad.html`'s `:root` CSS variables.
- `vendor/firebase/`: firebase 12.19 compat bundles (app, auth, firestore).
- `firestore.rules`: the source of truth for the rules. There is no CLI access. After changing it, the owner must paste it into Firebase Console → Firestore Database → Rules → Publish.
- `archive/`: the old "אינדקס תוכניות חשמל G-WWTP" app. It is read-only and still points at its old Firebase project.

## Firebase (project `ohadcad`)
Firestore collections:
- `ohadcad_meta/owner`: `{uid, email, label}`. Claimed once by the first sign-in.
- `ohadcad_users/{email}`: `{approved, label}`. Managed by the owner.
- `ohadcad_requests/{email}`: access requests.
- `ohadcad_designs/{id}`: `{name, data (JSON string of the tool state), parts, createdBy, createdByEmail, createdAt, updatedBy, updatedByEmail, updatedAt, deleted}`.
  - Deletion is soft (`deleted: true`), and only the creator or the owner may do it.

## Releasing
1. Bump `VERSION` and `WHATS_NEW` in `index.html` (a one-line Hebrew summary of this release, shown at the bottom of the sign-in screen), and `CACHE` in `sw.js`.
2. Commit, push the working branch, then push it to `main`.
3. Check the "pages build and deployment" run via the GitHub MCP actions tools. github.io itself is not reachable from the sandbox.

## Testing
Serve the folder (`python3 -m http.server`). Load `cad.html` inside a harness page that defines a fake `panelDesignsBridge` (in-memory store plus `menu`), then drive it with Playwright.

## Related
The department app (repo electric-assets-map-OG) used to host this tool. Its "תכנון לוחות" screen now links here (`OHADCAD_URL` in `src/views/panelDesigner.ts`) and exports old drawings to a JSON file `{designs:[...]}`. OhadCad imports that file via the menu item "ייבוא לוחות מהאפליקציה הקודמת".
