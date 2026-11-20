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
  - `saveStatus(k, text, title)`: the tool's save state, shown in the shell's top bar.
  - `refresh()`: reloads the app (the tool's `appRefresh` saves first).
  - `menu()`, which returns extra items for the tool's drawer.
- `cad.html`: the drawing tool, a single file. It finds the bridge as `SH` (via `window.parent.panelDesignsBridge`). Opened directly, it saves to localStorage.
  - Parts live in `DEF[type]`.
  - Documents: `state.objs` / `state.alt`, and `state.tab` is 'panel' | 'sld' | 'both'.
  - Library: `LIB`.
  - Templates: `TEMPLATES`.
  - Autosave: `scheduleSave` / `doAutoSave`.
  - Drawer menu: `openDrawer`.
  - Dimensions: part type `mdim` (`mdGeom`, `setMeas`); ends may be pinned to a part (`of`, `u`, `v`; `fx`/`fy` = on a box edge, follows resizing). A shape's own dimensions (`p.sd==='1'`) are turned into pinned `mdim`s on `commit` (`shapeDimsToMd`), so there is one kind of dimension; tapping one opens its panel (length edit `mdSetLen`, delete).
  - Layouts (production sheets): `state.lays` = `[{id,d:'panel'|'sld',name,paper,orient,scale,org}]`; the shown one per document mirrors into `state.layout` / `state.layoutS` (with `lid`) and its corner into `state.origin` / `state.originS` (`laySync`, `layShow`, `layWith`). Bottom tabs: `buildLayTabs`. The PDF prints every sheet as a page.
  - Background pictures: part type `underlay` (`p.src` JPEG data URL ≤ ~420 KB, or `p.svg`+`p.vb` from a DXF; size `iw×ih` × `fs`). Drawn on its own layer `#ulay` (`renderUlay`), only placeholders in `#world`; exports include it only with `exp:'1'`. Import `ulImport` (image / PDF via `vendor/pdfjs` / DXF), calibration `calStart`, manager `ulManager`.
  - Communication racks: `nrack` (19"/10", U count, wall/floor; `nrDim`) and rack equipment `nequip` (`ru:true`, `p.k` kind, `p.u` height); equipment snaps to U slots (`rackU`) and is added into the first free U (`rackFree`).
  - Toolbar order: `tbApply` / `tbStore`, kept per device in localStorage.
  - Outdoor pillars: part type `pillar` (`pillarDraw`, `plDim`; kind `pk` in `PLK`, material `pmat` in `PLM`, `plw`/`plh`/`pld` width/height/depth, `pdn` doors, `plb` concrete base).
  - Harmony double-headed pushbutton `pbdbl` (`pbdblDraw`, `pdDim`, `pdModel`; `hmat` xb5/xb4, `lcol` light colour in `PDL`, `pv` voltage in `PDV`).
  - Pen: free-hand strokes are parts of type `ink` (`p.pts` relative to centre, `icol`, `iw`); pen mode `PEN` / `penSet`, bar `#penBar`, eraser `inkErase`.
  - 3D view (view only): `open3D` / `close3D`, button `b3d`. Built each time from the panel parts: every part is a box whose front is its own 2D picture (`objSVG` → texture), depth per kind `v3Depth` / `V3DEP`; cabinets, enclosures and CI boxes get walls and doors that swing (parts with `front` ride the door). Parts standing on their own are extruded from their picture's outline (`sil` / `solid`, depth `v3Free`; light poles add a round shaft; motors and pumps `emotor` are a real model `motor3D` built from `motG`; flow meters `kflow`, valves `mvalve` / `hvalve` and fittings `hfit` are models on their pipe axis `inline3D`), cables / conduits / pipes are tubes along their route (`tube`), notes and tags lie flat (`V3FLAT`). Everything is centred on the drawing's plane (z=0; boards in a group at -D/2); floors, walls and pits (`V3CIV`) run the room depth `RD`. Tapping a part selects it (`OBJ`, `reg`, `choose`): `p.z3` moves it forward (+) / back (−) in mm, `p.d3` overrides its thickness (rebuilds the scene, keeping the view); both are also fields `f_z3` / `f_d3` in every part's edit dialog. Axes: X right, Y up, Z out of the plate (red/green/blue), big ones at the model corner (`V.axes`, button "צירים") and a corner compass rendered by `draw`. Uses `vendor/three` (three.js r160), loaded on first use.
- `sw.js`: offline cache. Pages are network-first with `cache: 'no-cache'`; other assets are stale-while-revalidate.
- `manifest.webmanifest`, `icons/`, `favicon.ico`: the official OhadCad brand kit (amber "O" ring + crosshair icon, white/amber wordmark for dark backgrounds, amber/dark wordmark for light ones). Colors, fonts (Heebo/Inter/JetBrains Mono) and style are in `icons/wordmark-dark.svg` / `icons/wordmark-light.svg` and documented in the brand kit's own README (not kept in this repo) — the live palette is in both `index.html`'s and `cad.html`'s `:root` CSS variables.
- `vendor/firebase/`: firebase 12.19 compat bundles (app, auth, firestore).
- `vendor/three/`: three.js r160 (three.min.js), loaded only when the 3D view opens.
- `vendor/pdfjs/`: pdf.js 3.11.174 (pdf.min.js + worker), loaded only when a PDF is imported as a background.
- `LICENSE` (proprietary), `THIRD_PARTY_NOTICES.md`, `legal/` (Hebrew drafts of terms, privacy, accessibility — not linked until approved; then list them in `LEGAL` in `cad.html`, shown in the drawer's "אודות" dialog `aboutDialog`), `docs/COMMERCIAL.md` (commercialisation plan).
- The title-block default logo (`DEFAULT_LOGO`, the owner's organisation) is used only for the owner (`defLogo()`, bridge `me().owner`).
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
