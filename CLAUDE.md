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
  - Documents: `state.objs` / `state.alt`, and `state.tab` is 'panel' | 'sld' | 'both' | 'top'. The top view (plan) is a third document: while shown, `state.objs` = plan, `state.alt` = single-line, `state.pstash` = panel; otherwise the plan waits in `state.top`. Move with `splitAll` / `joinAll` (used by `switchDoc` and `withDoc`); `topObjs()`, `panelObjs()`, `sldObjs()` read any document. Sheets: `LAYDOC` has 'top' (`layoutT` / `originT`); the PDF prints the plan between front and single-line. Library tabs with `top:true` show only in the plan (`inDoc`); plan parts `troom` (box, carries its contents), `tdoor`, `twin`, `tcol`, `tstair`, `tcab`, `tequip`, `ttray`, `tsym`, `tnorth` (+ the existing `wall`, `label`, `callout`). Doors / windows dragged onto a room wall or a `wall` take its thickness, line and direction (`wallFit`, segments from `wallSegs`); a door's `p.sw` 'in' / 'out' picks the side on a room wall and changing it refits the door in the same wall (`wallFit(o,1)` from the edit dialog; `p.wn` / `p.swl` remember the side on a free wall). Dragging in the plan snaps a part's box onto a room's inner wall faces / corners and walls' faces, with guides (`roomSnap`, `roomInner`). Equipment (`tcab`, `tequip`, `tstair`) draws its width / depth (`p.dm`, `bxDims`, `eqDimG`, `eqExt`). A room draws its own inner dimensions (`p.dm`, `roomDims` / `roomDimG`). DEF hooks: `fromBox(o,w,h)` turns a dragged box size back into the part's params (room walls, cabinet door swing); `ext(o)` pads the bounds for fit / export (`boundsX`). DEF entries may give `sel` (key → [[value,label]]), `lbl` (key → label) and `num` (numeric keys) for the generic edit dialog.
  - Library: `LIB`.
  - Templates: `TEMPLATES`.
  - Autosave: `scheduleSave` / `doAutoSave`.
  - Drawer menu: `openDrawer` — collapsible groups (`.dsec`, open state in localStorage `ohadcad.dsec`) of icon tiles (`.dt`, icons from `IC` via `ico`) with short names; the full explanation is the tile's tooltip; toggles get `.on`. Shell items come from the bridge `menu()` as `[label, fn, icon?]` under "חשבון".
  - Dimensions: part type `mdim` (`mdGeom`, `setMeas`); ends may be pinned to a part (`of`, `u`, `v`; `fx`/`fy` = on a box edge, follows resizing). A shape's own dimensions (`p.sd==='1'`) are turned into pinned `mdim`s on `commit` (`shapeDimsToMd`), so there is one kind of dimension; tapping one opens its panel (length edit `mdSetLen`, delete).
  - Layouts (production sheets): `state.lays` = `[{id,d:'panel'|'sld',name,paper,orient,scale,org}]`; the shown one per document mirrors into `state.layout` / `state.layoutS` (with `lid`) and its corner into `state.origin` / `state.originS` (`laySync`, `layShow`, `layWith`). Bottom tabs: `buildLayTabs`. The PDF prints every sheet as a page.
  - Background pictures: part type `underlay` (`p.src` JPEG data URL ≤ ~420 KB, or `p.svg`+`p.vb` from a DXF; size `iw×ih` × `fs`). Drawn on its own layer `#ulay` (`renderUlay`), only placeholders in `#world`; exports include it only with `exp:'1'`. Import `ulImport` (image / PDF via `vendor/pdfjs` / DXF), calibration `calStart`, manager `ulManager`.
  - Communication racks: `nrack` (19"/10", U count, wall/floor; `nrDim`) and rack equipment `nequip` (`ru:true`, `p.k` kind, `p.u` height); equipment snaps to U slots (`rackU`) and is added into the first free U (`rackFree`).
  - Look: `body.pro` (default; `uiPro` / `togglePro`, localStorage `ohadcad.look` = 'classic' turns it off) is a CSS layer over the classic orange/black theme — graphite tokens, 1px neutral lines, flat controls, amber tint for `.on`, toast at the bottom; on wide screens the recent-parts bar `#favBar` sits in the file/export row (`--toph3:0`, width from `dtwSync` → `--dtw`). `body.pro.uil` is its light variant.
  - Language: localStorage `ohadcad.lang` 'en' loads `i18n/en.js` (`OHAD_EN` Hebrew → English, keys without a leading icon; `OHAD_EN_RX` patterns) and `I18N` swaps text nodes / titles / placeholders / options outside `#stage` (MutationObserver); drawer tile "English" (`toggleLang`, reloads). Add new UI strings to `i18n/en.js`.
  - Shapes from the library (`shrect` / `shellipse` via `addItem`) are drawn with two clicks (`SHP`, `shpStart`, `shpBox`, preview `shpSVG`, a pre-handler on `svg` pointerdown; Esc cancels; 'עיגול' keeps equal sides).
  - Ctrl+P / ⌘P: `ohadPrint` (capture-phase keydown; preview open → prints the chosen pages, else `printPreview`); the shell forwards the key to `window.ohadPrint`.
  - Phone portrait (max-width 600, min-height 501; `PHONE_MQ`): one 52 px top row (menu, name, save state, undo / redo), recent parts strip only when not empty, the tool rail `#rail` fixed along the bottom, no rulers, `#docTabs` hidden (its user-placed buttons move into the rail and the save state into the top row via `phoneLayout`, also called from `tbApply`); the shell hides its own top bar there.
  - Toolbar order: `tbApply` / `tbStore`, kept per device in localStorage.
  - QR code part `qr` (`qrDialog`, `qrText`, `qrMat` via `vendor/qrcode`): `qk` 'doc' = `APP_URL?d=<cloud id>` (index.html passes `?d=` to the iframe, `DEEP` → `openCloudDoc`), 'info' = name / number / rev, 'url' = `qt`; `qs` size mm, `ql` caption.
  - Enclosure brands: `p.brand` '' / 'rittal' (RAL 7035, red badge) / 'prisma' (white, Schneider badge, door vents) on `cabinet` (dialog `cabDialog`, also depth `p.d`) and `enclosure` (field `brand`); `BRANDS`, `brFill`, `brBadge`, `brVents`. Library groups Rittal VX25 / AE and PrismaSeT P / G.
  - Outdoor pillars: part type `pillar` (`pillarDraw`, `plDim`; kind `pk` in `PLK`, material `pmat` in `PLM`, `plw`/`plh`/`pld` width/height/depth, `pdn` doors, `plb` concrete base).
  - Harmony double-headed pushbutton `pbdbl` (`pbdblDraw`, `pdDim`, `pdModel`; `hmat` xb5/xb4, `lcol` light colour in `PDL`, `pv` voltage in `PDV`, `leg` io / ud arrows / udk black arrows). TeSys K mini contactors `lc1k` and reversing `lc2k` (`lc2kOne`). CI boxes: `p.lid` '1' lid / 'c' clear lid / '0' none.
  - Telemecanique limit switches `xck` (`xckDraw`, `xckGeo`; series `xs` in `XCS`, head `xh` in `XCH`, model codes `XCM`; lever angle `xa` in screen degrees, turned into the part's frame by `xckLA`).
  - Cable glands `gland`: the side view is drawn as installed in a box bottom (thread up, dome down); `glandAuto` (on `commit` and `renderNow`) turns a gland on a board edge so its dome faces out, seats it with the hex against the wall when within ~30 mm, and lists seated glands in `GLIN` (their thread, inside the board, is not drawn).
  - Align / distribute the selection: button `bAlign` with menu `mAlign` (`alignDo`; fixed distance dialog `distDialog`, centre-to-centre or gap, first part stays; it previews live and reverts on cancel via `MODAL_CLOSE`). `modalFloat()` makes the open dialog float without a backdrop, dragged by its title.
  - Single-line motor-circuit blocks: `MBLK` (kinds dol / mpcb / vfd / full / ss), library item type `mblk` (thumbnail only); `addItem` calls `insertMotorBlock(kind, lines)`, which adds ordinary symbols (3-pole forms when lines = 3) wired per phase, top to bottom.
  - Terminal blocks: single `tb` (colour `kind` in `TBCOL`, size `tsz` in `TBSZ`) and double-level `tbd` (heights `TBDH`, markers `tag` / `tag2`), fuse terminal `tbf` (`lv` 1/2 levels, `fz` 5x20 / 6x32, `fa` amps, `led`). Motor breaker `gv2`: `gh` 'me' push buttons / 'p' rotary handle (GV2P).
  - LAN cable `lan` (routed like a pipe — `isPipe`; category `cat` in `LANC` gives Ø, sheath `lc` in `LANCOL`, plugs `plg` in `LANPLG`, `lanSVG`), keystone jack `keyst` and wall plate `kplate` (`ksJack`, colours `KSCOL`).
  - Drywall flush accessories `gbx` (55 series: `gn` places on 71 mm centres, `gdir` h/v, device per place `g1`..`g4` from `GDV`, `gview` 'box' = the drywall boxes only; `gbxDraw`, `gbxDev`) — removed from the library, kept only so older drawings still show.
  - GEWISS modular wiring devices `gwx` (`gmt` flush / surf / ip55 / box, `m` 3/4/7 modules, devices `d1`..`d7` from `GWD` with module widths, `gwSlots`, `gwDraw`).
  - Altivar control terminals (single-line) `svfdc`: model `mdl` in `VFDC` (atv630 / atv320 / atv340), group filter `grp` in `VFDCG`; `vfdcT` lays the terminals out on the bottom edge.
  - Altistart ATS480 soft starter: panel part `ats480` (`ATSR` ratings → frames `ATSF`, `ats480Draw`), single-line `sats480` (L1-L3 / T1-T3 + bypass A2 B2 C2), control strip `svfdc` model 'ats480'; wiring-diagram block `insertATSBlock` (Q1, KM1 line, KM3 bypass, U1, X1, M1, control terminals) from the `mblk` item with `ats:1`; ATV630 block `insertVFDBlock` (`vfd630:1`).
  - SATEC meters: door part `satec` (`sm` in `SATM`, `satecDraw`), single-line `ssatec` (V1-V3 VN, I1±..I3±, L N); window CTs `ctr` (`cw` in `CTW`, `cls`, `va`) and single-line CT with secondary `sct2`; metering block `insertMeterBlock` (`mblk` with `meter`).
  - 22 mm pilot light with a digital V / A meter: door part `pl22m` (`mm` v / a / va in `PLMM`, `dc` digit colour), its mini ring CT `ctmini` (k / l leads), single-line `spl22m` (X1 X2, k / l when it measures current).
  - Analogue panel meters `anm` (door; `anv` v / a, `anz` 72 / 96, scale from the rating, `anmDraw`).
  - Single-line draft from the panel: `genSld` (panel part → symbol by `SLD_MAP`; source, meter, main `iso`, busbar, feeders with loads / motors, frame), reached from the library hint button `sldGen` and the drawer tile via `sldFromPanel` (switches to the single-line first).
  - Panel ↔ single-line cross-check `xcheckDialog` (`xcData` by tag, `XC_SKIP`, rating compare `xcAmp`; `xcPanelFor` maps a symbol to a panel part, `xcAdd` places it on the front).
  - Single-line ↔ panel links by tag (`xrOk`, `XR_NO`, `xrOther`): the edit panel shows the counterpart (`xrBlock`, jump via `xcGo`, `xrBind` renames its tag on change); `state.xrShow` (`toggleXR`) adds a purple "⇄ <doc> · <sheet>" reference under each linked part (`xrIndex` → `XRI` per render, `xrSheet` finds the sheet in `state.lays`, `xrLabel` appended in `objSVG`, so it prints).
  - As-Built: `state.ab` = `{on, base:{id:[hash,label,doc]}, t}` (`abStart`, `abHash` shift-free in the combined view, `abAll` both documents); `abIndex` → `ABI` per render marks new / changed parts with a red cloud + Δ rev (`abMark`, `abCloud`, in `objSVG` and `drawWire`, so it prints); `abList` lists added / changed / removed with jumps, `abAccept` raises `state.rev` and clears, `abCancel` clears.
  - Wire numbers: `wireNets` (nets through wires, terminal blocks, busbars), `numberWires` sets `p.wn` (named L1/L2/L3/N/PE/+/− when a net touches such a busbar or terminal), shown by `wnLabel` when `state.wnShow`; tables `wireTables` (`wireRows`, `termRows`, `cableRows`, CSV `csvOf`), labels `printLabels`. Drawer section "בדיקה וחיווט".
  - Pen: free-hand strokes are parts of type `ink` (`p.pts` relative to centre, `icol`, `iw`); pen mode `PEN` / `penSet`, bar `#penBar`, eraser `inkErase`.
  - 3D view (view only): `open3D` / `close3D`, button `b3d`. Built each time from the panel parts: every part is a box whose front is its own 2D picture (`objSVG` → texture), depth per kind `v3Depth` / `V3DEP`; cabinets, enclosures and CI boxes get walls and doors that swing (parts with `front` ride the door). Parts standing on their own are extruded from their picture's outline (`sil` / `solid`, depth `v3Free`; light poles add a round shaft; motors and pumps `emotor` are a real model `motor3D` built from `motG`; flow meters `kflow`, valves `mvalve` / `hvalve` and fittings `hfit` are models on their pipe axis `inline3D`), cables / conduits / pipes are tubes along their route (`tube`), notes and tags lie flat (`V3FLAT`). Everything is centred on the drawing's plane (z=0; boards in a group at -D/2); floors, walls and pits (`V3CIV`) run the room depth `RD`. Tapping a part selects it (`OBJ`, `reg`, `choose`): `p.z3` moves it forward (+) / back (−) in mm, `p.d3` overrides its thickness (rebuilds the scene, keeping the view); both are also fields `f_z3` / `f_d3` in every part's edit dialog. Axes: X right, Y up, Z out of the plate (red/green/blue), big ones at the model corner (`V.axes`, button "צירים") and a corner compass rendered by `draw`. Uses `vendor/three` (three.js r160), loaded on first use.
- `sw.js`: offline cache. Pages are network-first with `cache: 'no-cache'`; other assets are stale-while-revalidate.
- `manifest.webmanifest`, `icons/`, `favicon.ico`: the official OhadCad brand kit (amber "O" ring + crosshair icon, white/amber wordmark for dark backgrounds, amber/dark wordmark for light ones). Colors, fonts (Heebo/Inter/JetBrains Mono) and style are in `icons/wordmark-dark.svg` / `icons/wordmark-light.svg` and documented in the brand kit's own README (not kept in this repo) — the live palette is in both `index.html`'s and `cad.html`'s `:root` CSS variables.
- `vendor/firebase/`: firebase 12.19 compat bundles (app, auth, firestore).
- `vendor/three/`: three.js r160 (three.min.js), loaded only when the 3D view opens.
- `vendor/qrcode/`: qrcode-generator 1.4.4 (MIT), loaded with cad.html for the QR part.
- `i18n/en.js`: the English dictionary for the app's frame.
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
