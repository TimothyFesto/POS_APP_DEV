# G2 Guest House POS — Desktop App

A desktop build of the restaurant + accommodation POS, packaged with
Electron, with a real relational SQLite database — not just a settings
blob — backing everything: sales history, staff accounts, an audit
trail, and backups you can actually restore from.

## What's in the desktop build (vs. the browser preview)

The browser/artifact preview is great for trying the interface, but a
browser sandbox can't touch the filesystem — so it can't store real
files, do real backups, or keep real user accounts. The desktop app can,
and adds:

- **Calendar** — advance reservations (room, guest, date range) ahead of an
  actual check-in, a month view of who's arriving/staying, and a one-click
  "Check in now" that converts a reservation straight into a real stay in
  Accommodation. Rejects overlapping reservations for the same room at the
  database level — see "Running two terminals" below for why that matters.
- **Conference Facility** — separate from guest rooms: define meeting/event
  spaces with hourly or daily rates, book them for clients, and settle the
  booking (cash/card) when the event's done. One booking per facility per
  day, enforced at the database level, so two terminals can't double-book
  the same hall.
- **Running Costs** — log utility bills and other operating expenses
  (electricity, water, internet, rent, etc.) with category, vendor, and a
  recurring flag, with a monthly/yearly total broken down by category.
- **Maintenance & Repairs** — track renovations, maintenance, and repairs
  by location, with cost, vendor/contractor, and a planned → in-progress →
  completed status.
- **Contacts** — a guest/supplier/staff directory, with one-click import of
  guest names/phone numbers from past stays and supplier names from the
  purchase log, so it doesn't have to be built from scratch.
- **To-do** — a shared staff task list: title, assignee, due date, priority,
  open/done filtering.
- **Human Resources** — an employee directory separate from POS login
  accounts (not everyone on staff needs to log into the till), with role,
  contact info, hire date, and pay rate/type.
- **Restaurant Store (Inventory)** — track raw stock (ingredients/supplies),
  record purchases, and link each menu item to a recipe: which ingredients
  and how much of each one serving uses (e.g. Tea = water + milk + sugar +
  tea leaves, each with a quantity). Once ingredient costs are recorded,
  the recipe editor shows the estimated cost to make one serving and the
  margin against the menu price. Every paid restaurant sale automatically
  deducts stock based on the recipe; correcting/voiding a paid transaction
  automatically adds it back. Items at or below their reorder level surface
  in a "Needs restocking" list.
- **Persistent document references** — every finalized restaurant bill or
  accommodation folio gets a permanent receipt number (`R001`, `R002`...)
  the moment it's finalized, and an invoice number (`INV001`...) the first
  time it's printed as an invoice. Numbers are never reused, including
  after a void or correction, and reprints always show the same number.
- **Documents** — upload company letterheads, receipt/invoice/delivery-note
  templates. The active letterhead's logo is automatically placed on every
  printed receipt, invoice, and delivery note.
- **Reports & Accounting** — daily and monthly sales, cash vs. card totals,
  restaurant vs. room revenue, outstanding (unpaid) room charges, and a
  receipt/transaction lookup by ID, table, room, or guest name.
- **Staff accounts** — PIN-based login. The first launch asks you to set up
  an admin account; every transaction and audit entry is stamped with who
  did it.
- **Audit trail** — logins, payments, voids/corrections, document uploads,
  user changes, and backups/restores are all logged with who, what, and when.
- **Transaction corrections** — a paid transaction can be voided with a
  required reason from Reports & Accounting; nothing is silently edited,
  the original stays on record and the correction is audit-logged.
- **Backups & recovery** — a one-click "Back up now," an automatic daily
  backup (last 14 kept), and a "Restore from a backup file" option that
  safely swaps in a previous database and restarts the app.
- **Application updates** — user-initiated updates via GitHub Releases:
  the app can check, download, and install new versions from Settings, but
  never does so without you clicking through it. The database, documents,
  and backups are stored completely outside the app's install folder, so
  updating the program never touches your business data. See "Application
  updates" below for how releases get published.
- **Multiple terminals (foundation)** — every transaction and audit entry is
  stamped with a terminal ID generated on first launch, so if you later add
  more machines, the ledger already distinguishes where each sale came from.
  Real-time syncing *between* terminals isn't implemented yet — each
  installation's SQLite file is local to that machine. To have several
  terminals share one live database, the next step would be moving the
  ledger to a central server (e.g. Postgres) that each terminal talks to
  over the network, rather than each terminal keeping its own file. Happy
  to help design that when you're ready to add a second terminal.

## What you need first

- [Node.js](https://nodejs.org) 20 or newer (includes npm) installed on
  the machine you're building from.
- An internet connection for the one-time `npm install` (downloads
  Electron, the build tools, and Node modules).
- **To build the macOS `.dmg`, you need to run these commands on a Mac.**
  Apple only allows Mac app builds to be produced on macOS — this is an
  Apple restriction, not something any tool can work around. The Windows
  `.exe` can be built on Windows, macOS, or Linux.

## 1. Install dependencies

Open a terminal in this folder and run:

```
npm install
```

This also rebuilds the SQLite native module for Electron automatically
(via the `postinstall` script).

## 2. Try it in development mode (optional)

```
npm run dev
```

This opens the app in a live-reloading window so you can check everything
works before packaging an installer. On first launch it'll ask you to
create the first admin account (name + PIN).

## 3. Build the installer

**Windows (.exe):**
```
npm run dist:win
```

**macOS (.dmg — must be run on a Mac):**
```
npm run dist:mac
```

Either command builds the React app, then packages it. Finished
installers land in the `release/` folder:

- Windows → `release/G2 Guest House POS Setup <version>.exe`
- macOS → `release/G2 Guest House POS-<version>.dmg`

Double-click the installer on the target machine to install it like any
normal desktop app, with your logo as the icon.

## Application updates

The app checks GitHub Releases for new versions and lets the user decide
when to actually update — nothing downloads or installs itself silently.

**How it works in the app** (Settings → Application updates):
1. The app quietly checks for a new version a few seconds after it starts
   (packaged builds only — this is disabled while running `npm run dev`).
   You can also check manually any time with "Check for updates."
2. If a new version exists, the user clicks **Download update**.
3. Once downloaded, the user clicks **Restart & install now** — or, if
   they don't, it installs automatically the next time the app is closed
   normally, so nothing is lost mid-shift.

**Your database is never part of this.** Updates only ever replace the
installed application files (via electron-builder/electron-updater). The
SQLite database, uploaded documents, and backups all live in the OS's
app-data folder (see below), which electron-updater has no access to and
never touches. Updating the app cannot delete, overwrite, or migrate your
business data — a version update and a database change are two completely
separate things.

### Configuring where updates come from

Update checks are configured in `package.json` under `build.publish`, and
duplicated in `electron/main.js` as `UPDATE_OWNER` / `UPDATE_REPO`:

```json
"publish": { "provider": "github", "owner": "TimothyFesto", "repo": "POS_APP_DEV" }
```

**Double check this is the right repository before relying on it** — this
was carried over from your reference project as the most likely intended
target. If releases should actually publish somewhere else, update both
`package.json` and the two constants near the top of `electron/main.js`
to match, then rebuild.

### Releasing a new version

The included `.github/workflows/release.yml` builds both platforms and
publishes a GitHub Release automatically whenever a version tag is pushed:

1. Bump `"version"` in `package.json` (e.g. `1.0.0` → `1.1.0`).
2. Commit, then tag and push: `git tag v1.1.0 && git push origin v1.1.0`.
3. GitHub Actions builds the Windows `.exe` (on a Windows runner) and the
   macOS Universal `.dmg`/`.zip` (on a Mac runner — required, since Apple
   only allows Mac builds to be produced on macOS), then publishes them
   together as a GitHub Release with the update metadata
   (`latest.yml`, `latest-mac.yml`) electron-updater needs.
4. Installed apps will pick up the new version on their next update check.

The macOS build intentionally produces **both** a `.dmg` (what people
install) and a `.zip` (what electron-updater actually downloads in the
background for Mac auto-updates — this is a Squirrel.Mac requirement, not
optional). Don't remove the zip target from `package.json`.

To publish a release from your own machine instead of CI, run
`npm run release:win` or `npm run release:mac` with a `GH_TOKEN`
environment variable set to a GitHub personal access token with `repo`
scope for the target repository.

### Database schema migrations

App versions and database structure are handled completely separately.
`electron/main.js` tracks a `CURRENT_SCHEMA_VERSION` and a `MIGRATIONS`
array; on launch it records which migrations have already run in a
`schema_migrations` table and applies only the ones a given database
hasn't seen yet. A brand-new install and someone updating from an older
version both end up correct, without ever dropping or rebuilding
anything.

**When a future release needs a database change**, add a new entry to
`MIGRATIONS` in `electron/main.js` — never edit one that's already
shipped:

```js
const MIGRATIONS = [
  {
    version: 2,
    name: "add_customer_table",
    up: (db) => { db.exec(`CREATE TABLE IF NOT EXISTS customers (...)`); },
  },
];
```

Bump `CURRENT_SCHEMA_VERSION` to match. Existing installs apply just that
one migration the next time they launch the new version; their business
data is never touched beyond what the migration itself does.

## Running two terminals

**Be clear-eyed about what this build does and doesn't do today.** Each
installed copy of this app has its own local SQLite file — there is no
live sync between two terminals right now. If you install this exact
build on two machines, they will keep two separate, disconnected
histories: sales on Terminal A won't show up in Terminal B's reports,
and — critically — a room or conference facility could be double-booked
if both terminals are used to book it around the same time.

### What's already in place to reduce the risk

- Every transaction, reservation, and audit entry is stamped with a
  `terminal_id` generated on first launch, so the data model already
  distinguishes where each record came from — this is groundwork for
  real sync, not sync itself.
- **Reservations and conference bookings reject overlaps at the database
  level.** If Terminal A books Room 4 for the 12th–14th, Terminal B
  physically cannot create a second reservation for Room 4 that overlaps
  those dates — the database rejects it with a clear error, not a race
  condition. This doesn't require any networking; it's just correct by
  construction on the data that reservations already track.
- What this **doesn't** cover: a room or facility that's occupied via an
  actual in-progress stay/booking rather than a reservation record won't
  be caught by that check today, since active stays live in local app
  state rather than a shared table. In practice this means: use
  Reservations for anything booked ahead of time (which is the normal
  case for a second terminal to be involved in), and the overlap check
  protects you there.

### The real fix: a shared backend

Given you're planning both a second terminal *and* a website for online
reservations, the right architecture is a small central server that both
terminals and the website talk to, instead of each terminal keeping its
own file. Concretely, I'd recommend:

1. **Move the database from local SQLite to a hosted database** (Postgres
   is the natural choice; the schema here would port over almost
   unchanged, since it's already relational with proper foreign keys and
   migrations).
2. **Stand up a small API server** (Node/Express or similar) that exposes
   the same operations this app's `electron/main.js` currently performs
   directly against SQLite — this is a fairly mechanical translation,
   since every IPC handler here is already a clean, single-purpose
   function (`ledger:recordTransaction`, `reservations:create`, etc.) that
   maps naturally to one API endpoint each.
3. **Point both terminals' renderer at that API** instead of local IPC —
   the renderer code (`src/App.jsx`) barely changes, since it already
   goes through a single `window.api.*` abstraction; that abstraction
   would call `fetch()` against the server instead of `ipcRenderer.invoke`.
4. **The future website calls the same API** for online reservations —
   e.g. a public `POST /reservations` endpoint reusing the exact same
   overlap-checking logic already written here, so a web booking and an
   in-person booking can never conflict either.
5. Terminals would need to handle being briefly offline (queue writes,
   retry) — a real but well-understood problem, not a blocker.

This is a genuine project, not a small tweak — but it reuses almost
everything already built here rather than starting over. I'd suggest
scoping it as its own piece of work once you're closer to actually
having the second terminal and the website ready, rather than guessing
at the server's shape today. Happy to help design and build that server
when you're ready to start it.

## Phase 1: costing integrity & access control

An additive upgrade (schema migration v5 — nothing about the running app
had to be rebuilt) closing the gaps identified in the recipe-tracking
proposal review:

- **Cost-of-goods-sold is now frozen at the moment of sale.** Every sold
  item stores what its recipe actually cost to make *at that moment*,
  plus which recipe version was used. Editing a recipe or an ingredient's
  cost afterwards no longer silently changes what past sales appear to
  have cost.
- **Recipes are versioned, not overwritten.** Saving a recipe creates a
  new version and marks it current; old versions stay in the database
  exactly as they were, permanently linked to whatever sales used them.
  Existing recipes were automatically backfilled into "version 1" — no
  data was touched or lost.
- **True weighted-average ingredient costing.** Previously, the newest
  purchase price simply overwrote the running cost. Now it's blended
  with what's already on hand: `(old qty × old cost + new qty × new
  cost) ÷ total qty`. Every purchase's own price is still kept forever
  in the purchase log regardless.
- **Controlled stock adjustments.** A new admin-only tool (Store → Stock
  → the rotate icon on any item) for correcting a count after a physical
  check — always requires a reason, always shows the before/after
  quantity, always audit-logged. Previously the only ways stock moved
  were purchases and sale consumption; there was no sanctioned way to
  fix a miscount.
- **Permissions are now actually enforced**, not just displayed. Editing
  recipes, ingredient costs, stock items, stock adjustments, staff
  accounts, and restoring a backup all require an admin role — re-checked
  server-side against the database on every call, not trusted from
  whatever the app's in-memory state happens to say. Staff can still
  process sales, record purchases, and view everything.
- **Admin-initiated PIN reset.** No email/SMS involved — an admin resets
  a staff member's PIN from Settings → Staff & Security. This was a
  deliberate choice over a self-service "forgot password" flow: this app
  can run fully offline, so anything depending on email/SMS delivery at
  the exact moment someone's locked out is the wrong fit. A recovery path
  for "every admin PIN is forgotten" wasn't built in this pass — flagged
  as a reasonable future addition if it's ever needed, not required now.

## Phase 2: wastage & physical stock counts

Additive on top of Phase 1 (migration v7):

- **Wastage tracking**, separate from sale consumption. Any logged-in
  user can log it (Store → Stock → "Wastage" on any item): quantity,
  reason (spoilage, expired, prep error, spillage, damaged, other), an
  optional note. Deducts stock immediately and records the cost impact at
  the ingredient's current cost. Removing a wrongly-logged entry is
  admin-only and puts the stock back.
- **Physical stock counts** (Store → Stock counts). Start a count — it
  snapshots the current theoretical quantity of every stock item — then
  enter what's actually on the shelf per item. Each item shows its
  variance and cost impact live as counts are entered. **Finalizing is
  admin-only** and reconciles stock to the counted quantities using the
  same `stock_adjustments` mechanism from Phase 1, tagged "Stock count on
  [date]" — so a count leaves exactly the same audit trail a manual
  correction would, not a separate parallel record.

## Fixed: packaged .exe/.app could show a blank window with zero explanation

**Reported symptom**: `npm run dev` opens the app correctly; the built
`.exe` shows a blank page.

**Root cause, confirmed by reading the actual code path**: dev mode and
the packaged build load the app two completely different ways —
`win.loadURL("http://localhost:5173")` in dev, `win.loadFile(...dist/
index.html)` when packaged. The packaged path had **zero error
handling of any kind** — if `dist/index.html` didn't exist (most likely
cause: the app was packaged before `vite build` actually completed
successfully — plausible here, given the Windows session right before
this involved a broken `npm install`/network errors that could easily
have caused a build step to silently not finish), or if the page failed
to load for any other reason, Electron would just... do nothing
visible. Blank window, no dialog, no log, nothing — this is a different
root cause from the schema-version issue fixed last round, but the
identical *symptom class* (something fails silently instead of telling
anyone what happened).

**The fix**: `createWindow()` now checks that `dist/index.html` actually
exists before attempting to load it, and shows a clear
`dialog.showErrorBox` — "packaged incorrectly, rebuild with npm run
build completing successfully first" — instead of silently proceeding.
Also added a `did-fail-load` handler as a catch-all for any *other* way
the page could fail to render, so this specific "blank window, no
explanation" failure mode shouldn't be able to recur for a different
underlying reason later. Verified directly: simulated a packaged build
with no `dist/index.html` present and confirmed the correct dialog
fires and the app exits cleanly; separately confirmed a normal packaged
startup with `dist/index.html` present is completely unaffected — loads
exactly as before, no new dialogs.

**What to actually do**: on the Windows machine, once `npm install`
completes successfully, run `npm run build` on its own first and
confirm it finishes without error and actually produces a non-trivial
`dist/index.html` — only then package (`npm run dist:win`, which also
runs the build step itself via `predist`, so this is really a sanity
check rather than a required extra step). If the exe is rebuilt from
this codebase and still shows the new error dialog, the dialog's exact
wording will now say precisely what's missing, which turns "blank page,
no idea why" into something concrete and fixable.

## Fixed: scary/silent crash on version-mismatched installs (Mac "Uncaught Exception", Windows blank screen)

**Root cause, confirmed by actually reproducing it**: the database
schema versioning check was working correctly — it refuses to run an
older copy of the app against data a newer copy already upgraded, which
is the right call, since silently running old code against a
newer-than-it-understands database risks misreading or corrupting it.
The problem was entirely in how that refusal was presented: it `throw`s
a raw JS error before any window exists, which falls through to
Electron's own default "Uncaught Exception" handling — a scary stack
trace dialog on macOS, and apparently no visible dialog at all on
Windows (default crash presentation isn't guaranteed consistent across
platforms this early in startup, which explains why the same underlying
problem looked like two different symptoms).

**What was actually happening on your machine**: at some point a newer
build of the app was run here, which upgraded the database to schema
version 24. Then an older, previously-downloaded build (schema version
19, per the Mac error) was run against that same, already-upgraded
database — hence "Database schema version 24 does not match required
version 19." The Windows blank screen very likely has the same root
cause with a different visual symptom.

**The fix**: replaced the raw `throw` with an explicit
`dialog.showErrorBox` call (safe to use before the app is "ready," and
behaves identically across macOS/Windows/Linux, unlike relying on each
platform's own default crash presentation) plus a clean `app.exit(1)`.
A version mismatch now always shows the same clear, specific message —
"G2 POS needs to be updated... your data is untouched" — regardless of
platform. Restructured deliberately so the exit path can never be
caught by the surrounding error handler and show a confusing second
dialog on top of the first (verified directly: simulated the exact
failure by running a schema-19 build against an already-migrated
schema-24 database — confirmed exactly one clear dialog and a clean
exit; separately confirmed normal startup with matching versions still
completes silently with no dialogs, so this only changes the failure
path).

**What to actually do about it**: install the latest zip below on both
machines — it's built at schema version 24, matching what's already on
the Mac, so it should start cleanly without touching any existing data.
If the Windows blank screen persists after installing this build,
that's a different, currently undiagnosed issue — please open DevTools
(Ctrl+Shift+I) or share whatever appears in a terminal if launched from
one, since there's now nothing left in the code that would fail silently
without at least attempting to show a dialog.

## Drag-to-arrange layout removed; Main Dining set up per floor plan schematic

- **Removed the drag-to-arrange table layout** from last round entirely
  — the Layout tab, drag-and-drop position swapping, orientation
  toggle, and the underlying `layoutRow`/`layoutCol`/`wide` fields are
  all gone. Manage Tables and the Floor View are back to the simple
  list/auto-flowing grid from before that feature existed.

- **Found and fixed a real gap while doing this**: there was actually
  no way to set a table's shape anywhere in the interface — new tables
  always silently defaulted to round regardless of what was intended,
  and existing tables couldn't have their shape changed at all after
  creation. Added a Shape field (Round/Square) to both the New Table
  form and the editable table list, since matching a real floor to a
  reference layout requires being able to actually set this.

- **Main Dining set up to match the floor plan schematic supplied**:
  adopted the table count, shape, and left-to-right/top-to-bottom order
  from the image — T1–T4 as square tables, T5–T8 as round tables.
  Seat counts weren't taken literally from the diagram's seat markers
  (as instructed) — set to 4 per table as a sensible, easy-to-adjust
  default; change any of them under Manage Tables. Bar and Patio
  sections are untouched.
  - **Scope note**: since the position-tracking system was just removed
    per this same request, "arrangement" is reflected as table order
    (T1 through T8, grouped by shape) rather than a persisted two-column
    pixel layout — the simple auto-flowing grid will lay them out based
    on available screen width, not necessarily as two strict visual
    columns like the reference image.
  - This only affects `DEFAULT_TABLES`, the fallback used when no floor
    data exists yet (a fresh install) — an already-running venue's
    actual saved tables aren't touched by this change and would need
    updating by hand via Manage Tables if the same setup is wanted.

## Table format for Manage Tables/Rooms, drag-to-arrange table layout, take-away orders, running cost categories

- **Manage Tables and Manage Rooms are now real `<table>` layouts**,
  matching the pattern already used elsewhere (Purchase Log, History,
  Conference).

- **Drag-to-arrange table layout**, inside Manage Tables → Layout tab.
  Drag one table onto another to swap their positions; a rotate button
  switches a table between horizontal and vertical orientation. Built
  as a fixed 4-column grid rather than freeform pixel placement — the
  app had no floor-plan/coordinate concept at all before this, so a
  grid-based rearrange (the same drag-and-drop approach already proven
  for Home tile reordering, extended to two dimensions) was the
  appropriately-scoped way to build "arrange tables to match your
  setup" without a much bigger, riskier freeform-canvas undertaking.
  Stored as a shared, venue-wide layout (unlike Home tile order or
  Appearance, which are per-user) since it represents the physical
  room, not a personal preference. The live Floor View reads the same
  saved positions, so what's arranged in Manage Tables is what actually
  shows up on the working floor screen.

- **Take-away orders.** New "New take-away order" button on the Floor
  View, alongside the existing room-service option. Take-away orders
  get their own section on the floor screen — both take-away and
  room-service orders have no table attached, so without a fix they'd
  have been silently lumped together under "Room service orders";
  caught and separated them. Correctly labeled throughout: the order
  screen, billing screen, printed receipts, History, and the
  charge-to-room description if a take-away order is settled onto a
  guest's room bill.

- **Running cost categories**: removed Insurance and Rent, added TV
  Subscription, Fuel, and Security. Category is a plain text field with
  no database-level constraint, so this only changes what's offered
  going forward — any existing entries already recorded under Insurance
  or Rent keep showing exactly as they were, untouched.

## Staff ID reformatted to a plain padded number; Settings notes trimmed

- **Staff ID changed from STAFF001 to 001** — dropped the prefix,
  kept the zero-padding. New accounts get the new format automatically;
  existing accounts (including any already reformatted to STAFF-style
  last round) are migrated again, preserving each person's underlying
  number. The login screen's input is back to numeric-only, matching
  the format. Verified end-to-end against a real database again: new
  account allocation, login with the new format, and the
  prefix-stripping migration logic all confirmed correct.
  As before: **existing staff need to be told their login ID's format
  changed again** — this doesn't update automatically for someone who
  already has a number memorized.

- **Settings screens decluttered.** Trimmed or removed the explanatory
  paragraph text under Role Permissions, Temporary Access, Appearance,
  Venue, Backups, and Application & Updates, per direct feedback that
  it read as cluttered. Kept short functional messages (access-denied
  notices, empty states, status lines) since those aren't explanatory
  filler — removing them would just make the interface harder to use,
  not more professional.

## Explicit purchase-vs-consumed units, stock purchases as an expense line, STAFF-prefixed IDs, interface cleanup

- **Purchase-unit vs. consumed-unit is now an explicit choice, not a
  silent default.** The conversion capability itself already existed
  (from an earlier round) but was framed as an easy-to-skip "optional"
  field, defaulting quietly to "purchase unit = base unit" whenever
  left blank. Restructured into an unmissable Yes/No question —
  "Purchased in the same unit it's used in?" — with both the purchase
  unit name and the conversion factor required when the answer is No.
  Nothing about the underlying conversion math changed (still the same
  validated weighted-average logic from before), only how the choice
  gets made at entry time.

- **Stock purchases now show as an expense line in the Dashboard**,
  alongside — not folded into — Operating Expenses and Net Profit. A
  new backend query (`dashboard:stockPurchaseRows`) surfaces money
  actually spent on stock in a period. Deliberately kept separate from
  the existing Cost of Goods Sold figure: COGS recognizes cost at the
  moment stock is *sold or wasted* (proper accrual matching), while
  this new card shows cash *spent* regardless of whether that stock's
  been used yet. Folding the two together would double-count the same
  spend twice in the profit math — both are legitimate, different
  questions, so both are visible without either one corrupting the
  other.

- **Staff IDs now read STAFF001** instead of a bare number. New
  accounts get the new format automatically; existing accounts are
  reformatted in a migration, preserving each person's underlying
  number (`7` → `STAFF007`) rather than reshuffling anyone. Two real
  bugs were caught and fixed by actually testing this against a real
  database rather than just reading the code:
  1. An off-by-one in the migration's sequence seeding that would have
     made the very first new account `STAFF000`.
  2. **A critical one** — the login screen was still stripping every
     non-digit character as you typed, a leftover from the old
     numbers-only format. Left as-is, nobody would have been able to
     log in with a letter-containing ID at all. Fixed and re-verified
     end-to-end (create → reformat → log in, all against a live
     database) before this shipped.
  - **Practical note, not just a technical one**: existing staff need
    to be told their login ID's format changed (e.g. "7" is now
    "STAFF007") — this doesn't happen automatically for a person who
    already has it memorized.

- **Interface cleanup — removed "e.g." style illustrative examples**
  throughout forms and descriptions (placeholders, help text, error
  messages), keeping the core instruction but dropping the example
  filler, per direct feedback that it read as cluttered rather than
  professional. Left in place: the document-number preview under Venue
  settings, which shows a live-computed value from the current setting
  rather than a static illustrative example, so it stays functionally
  useful without the "e.g." framing.

## Dash-numbering rolled out to all departments; Default/Light/Dark appearance

- **Accommodation and Conference now use the same dash convention as
  Restaurant**: `ACC-RCT-00001`/`ACC-INV-00001` and
  `CNF-RCT-00001`/`CNF-INV-00001`. Same guarantees as the restaurant
  rollout, verified against a real database again for both departments:
  sequence continues uninterrupted across the prefix change, nothing
  already issued is touched. All three departments now share the one
  digit-padding setting (Venue → Document number digits).

- **Default / Light / Dark appearance**, under Settings → Appearance.
  This is a per-user preference (like tile order), not a venue-wide
  setting — what looks right depends on the room lighting around
  someone's terminal, not on the business, so each person signed in on
  a shared terminal can pick their own without affecting anyone else.
  Defaults to Dark (today's unchanged look) for anyone who's never
  touched it — nobody's appearance changes on its own. "Default" follows
  the OS's own light/dark setting live (listens for OS-level changes
  while the app is open, not just read once at startup); the login
  screen itself always renders Dark, since there's no per-user
  preference to read before anyone's signed in.
  - The app already had a single, centralized CSS variable palette used
    throughout — that made this a genuinely moderate task rather than
    a big one, matching the effort estimate given before starting.
    Found exactly 5 hardcoded colors outside the print stylesheet, all
    the same pattern (dark text sitting on an accent/gold-colored
    badge or button) — pulled into a proper `--on-accent` variable
    rather than left as magic hex values.
  - Light isn't a mechanical inversion of Dark — a few colors (accent,
    the gold "billc" tone, the green/red status colors) are deepened
    from their dark-mode values, since a tone that pops against
    near-black can read as washed out against a light background.
  - Receipt printing is deliberately untouched by this — printed output
    stays plain black-on-white regardless of which appearance is
    selected on screen, exactly as before.
  - **As flagged before starting**: this is a solid first pass, not a
    guaranteed-perfect one — I can verify the CSS is internally
    consistent and the build is clean, but not the actual visual
    contrast of every single screen without seeing it rendered. Worth
    clicking through both Light and Dark once installed and flagging
    anything that reads poorly.

## Dash-separated numbering (restaurant), conference tables, POS receipt sizing

- **New document numbering convention, adopted for Restaurant first.**
  Receipts now read `RES-RCT-00001`, invoices `RES-INV-00001` — the
  padding width (the "00001" part) is a Venue setting
  (`documentNumberDigits`, default 5), not hardcoded, editable by admin.
  Verified end-to-end against a real database: sequence continues
  uninterrupted across the prefix-format change (no restart at 1, no
  reused numbers), changing the digit setting takes effect on the very
  next document without touching anything already issued, and numbers
  already printed are provably unaffected by a later setting change —
  matching the same "never renumber anything already issued" rule the
  rest of the numbering system already follows. Accommodation and
  Conference deliberately left on their existing prefixes for now,
  pending confirmation this convention is right before rolling it out
  to them too.

- **Table format applied inside Conference Facility**, scoped exactly
  as asked — Facilities, Upcoming bookings, and Past bookings are now
  real `<table>` layouts matching the same style as Purchase Log and
  History, rather than card/row lists. No other tile was touched.

- **Receipts now print at actual POS thermal-roll sizes**, not a full
  A4/Letter page. A new Venue setting (receipt paper width: 80mm
  standard or 58mm compact) drives both the on-screen/PDF content width
  and a real `@page { size: ... auto; margin: 0 }` rule injected at
  print time — the standard CSS mechanism thermal printer drivers
  recognize for continuous-roll printing. Tabular report printing
  (Purchase Log, History exports, etc.) is untouched and still prints
  at A4, since a wide table squeezed onto an 80mm strip would be
  illegible — the two print paths are kept independent via the same
  mutually-exclusive state that already existed for receipt vs. report
  printing, so nothing needed restructuring to separate them safely.

## Conference hourly-rate bug, department-specific document numbering, letterhead refresh bug

- **Real bug found and fixed: hourly conference bookings could silently
  bill at the daily rate.** Root cause: the New Booking form picks a
  facility before choosing Daily/Hourly, and if that facility only has
  a daily rate configured (no hourly rate set), switching to "Hourly"
  did nothing to the Amount field — it silently kept whatever the Daily
  calculation had put there, with zero indication anything was wrong.
  Fixed two ways: (1) the amount now clears instead of silently keeping
  the other rate type's stale value when the selected rate isn't
  configured for that facility, and (2) a clear warning now shows —
  "*Facility* has no hourly rate set — add one under Manage Facilities,
  or enter this booking's amount manually" — instead of staying silent.

- **Department-specific receipt/invoice numbering.** Restaurant,
  Accommodation, and Conference receipts previously all drew from one
  shared sequence (prefix "R"), and all invoices from another shared
  one ("INV") — there was no way to tell which department a document
  belonged to from its number alone. Each department now has its own
  sequence: Restaurant `RESR`/`RESI`, Accommodation `ACCR`/`ACCI`,
  Conference `CNFR`/`CNFI` for receipts/invoices respectively — each
  starting at 001 and incrementing independently. Verified end-to-end
  against a real database: two restaurant sales in a row correctly
  produced `RESR001`/`RESR002` while an accommodation sale in between
  got `ACCR001`, unaffected by the restaurant sequence.
  Deliberately **not retroactive** — every receipt and invoice already
  printed keeps the exact number it was already given (a reference
  number is never reassigned once issued); the new scheme only applies
  going forward from this update. See the message accompanying this
  round for the reasoning behind the specific prefixes chosen — they're
  easy to change if a different convention is preferred.

- **Real bug found and fixed: an uploaded letterhead/logo didn't show
  up on receipts.** The active letterhead was only ever looked up once,
  when the app first starts — uploading a logo and marking it active
  mid-session (the only way anyone would ever actually do it) had no
  effect until a full app restart. Fixed by re-checking for the active
  letterhead immediately after it's set active or an active one is
  removed, so it takes effect on the very next receipt without needing
  to restart. Also clarified the Documents screen's instructions, since
  activating is a separate, easy-to-miss second step after uploading —
  and added a confirmation toast when a letterhead is successfully
  activated.

## History rewritten as a table with a Conference tab; Home tiles reorderable per user

- **History (sidebar) is now a genuine `<table>`**, not a list of
  button-styled grid rows — Date, Reference, Type, Description, Status,
  Total columns, matching the same `.hp-data-table` styling already
  used elsewhere (e.g. the Purchase Log). Clicking a row still expands
  an itemized detail panel underneath it (line items, payment method,
  print receipt/invoice) — that behavior is unchanged, just re-homed
  into proper table markup with a `colSpan` detail row.
- **Added a Conference tab to History**, alongside the existing All /
  Restaurant / Accommodation — matching the tab wording the Accounting
  view already used for the same three-way split. Settled and
  cancelled conference bookings now show up in History the same way
  restaurant and accommodation bills do.
  - New backend handler `conference:bookings:historyList` joins
    `conference_bookings` with `transactions` on id to pick up the
    receipt reference generated at settle time — `conference_bookings`
    itself never stored one (the facility-booking record and the
    financial record are deliberately kept in separate tables). Verified
    against a real database end-to-end: booked a room, settled it,
    confirmed the join returns the correct receipt reference.
  - Existing Restaurant/Accommodation behavior is completely untouched;
    Conference is purely additive.

- **Home tiles can now be dragged into whatever order a person
  prefers**, saved just for them — a "Rearrange" toggle on Home enables
  native drag-and-drop reordering of the tiles; "Done" saves it,
  "Reset order" clears it back to default. The layout is stored under a
  per-user key (`pos:tile-order:{userId}`) in the same generic settings
  store already used for things like role permissions — no new backend
  table or migration needed.
  - If a tile becomes newly visible after a layout was saved — a role
    change, a fresh temporary grant — it's appended in its normal
    default position rather than silently disappearing just because an
    older saved layout predates it.

## Fixed: Manager couldn't edit recipes; Phase 4 — purchase-unit conversion

- **Real bug, root-caused and fixed.** Manager (and any temporary grant
  covering Inventory) was correctly allowed by the *backend* to edit
  recipes and manage stock — but the *frontend* button visibility for
  those actions was still checking `role === "admin"` specifically, a
  leftover from before the Manager role and the grant system existed.
  Same class of bug as the login screen fix a few rounds back: the
  backend was right, a stale frontend gate silently overrode it. Fixed
  by making the check recognize Admin, Manager, and an active grant
  covering the Inventory tile — matching the real backend permission
  exactly. `StockCountsPanel`'s finalize button was checked and left
  admin-only, correctly — that one specific action really is
  admin-only on the backend too.

- **Phase 4 — purchase-unit vs. recipe-unit conversion**, built and
  validated end-to-end against a real database before shipping, not
  just checked for syntax. A stock item can now optionally have a
  purchase unit distinct from its base/recipe unit (e.g. bought as a 5L
  jerrycan, consumed by the ml; bought by the carton of 24, consumed by
  the piece), with an explicit conversion factor.
  - **A real precision bug caught and fixed before it could reach
    production**: converting a purchase-unit cost down to its per-base-
    unit equivalent can legitimately produce a small fraction of a cent
    (e.g. $0.003/ml). The existing money-rounding helper (2 decimal
    places) would have silently floored that to zero — quietly
    corrupting the weighted-average cost for exactly the items this
    feature exists to help with. Added a separate, higher-precision
    rounder for per-unit costs specifically; actual currency totals
    (what's shown on a receipt) still round to 2dp exactly as before.
  - **The existing weighted-average formula is completely unchanged.**
    Conversion happens once, at the top of `stock:purchase`, before
    the formula ever runs — it has no awareness a conversion happened,
    identical to a purchase entered directly in the base unit.
  - **Verified with real numbers, not just reasoning about it**: ran
    the actual handler against a live SQLite database — bought 2
    jerrycans then 1 more at a different price, confirmed the weighted
    average matched a hand-calculated expected value exactly, confirmed
    total money spent reconciles perfectly whether purchases were
    entered in the purchase unit or the base unit, and confirmed
    invalid input (zero/negative conversion factor, purchase-unit entry
    on an item with none configured) is rejected with clear errors.
  - **Fully backward compatible**: existing stock items have no
    purchase unit set, so behave exactly as before — nothing about
    existing purchases, recipes, or costs changes unless a purchase
    unit is explicitly configured.
  - Purchase Log now shows an "As Purchased" column (e.g. "2 5L
    Jerrycan") alongside the base-unit Qty/Unit, which remain the
    actual accounting figures.
  - Deliberately not touched: recipe-line costing, sale-time COGS
    snapshots, and every other cost calculation elsewhere in the app —
    those were already correct for their own precision needs and
    weren't part of this request; changing them wasn't necessary and
    would have been exactly the kind of unrelated risk to accounting
    output this task asked to avoid.

## Grants refined to specific tiles, Venue locked to admin, editable room/table names

- **Temporary access grants are now tile-scoped, not role-scoped.** The
  original design (previous round) granted a whole role (e.g. every
  Manager permission at once). This refines it to match the actual ask —
  an admin now picks specific tiles (e.g. just Inventory), and the
  server computes which underlying role(s) actually satisfy those tiles'
  existing backend checks via a canonical `TILE_REQUIRED_ROLES` map,
  computed server-side and never trusted from the client. Tiles with no
  backend gate today (Calendar, Contacts, To-do, Documents, Menu, etc.)
  show "No extra permission needed" in the picker — granting those is
  purely visual, since there was nothing gated to unlock.
  - `requireRole` — the one shared function every permission check in
    the app already calls — was updated once, centrally, to read the
    new tile-derived role set. No individual permission check anywhere
    else changed.
  - Migration v18 added the new columns; migration v17 (already
    shipped) was left untouched rather than edited in place, consistent
    with treating migrations as immutable once applied.
- **Venue settings locked to admin-only.** Name, currency, decimal
  places, and tax/service rates affect every receipt and report
  system-wide — non-admins now see an explanatory message instead of
  the form. Like the rest of Settings' internal role checks, this is a
  frontend gate (kv-store writes aren't backend-permission-gated by
  design, since the same mechanism holds tables/menu/rooms data every
  role needs during normal operation) — proportionate for low-risk
  display config, unlike the real backend gates protecting financial
  and HR data.
- **Room numbers and table names are now editable** in their respective
  management panels, alongside the seat count / nightly rate fields that
  were already editable there.

## Temporary access grants, and Restaurant/Accommodation moved out of Settings

**Best-practice recommendation, implemented**: rather than editing the
backend's permission rules directly (risky, since it would mean
reasoning through every one of 40+ individual checks each time), this
follows the same pattern used by AWS IAM/STS AssumeRole and Azure AD
Privileged Identity Management — "just-in-time" access. A specific
person is granted a specific role's permissions for a bounded time
window, auto-expiring, without changing their actual role or touching
any existing permission check.

- **How it stays true to "the backend remains untouched"**: `requireRole`
  — the one shared function every permission check in the app already
  calls — was extended once, centrally, to also recognize an active
  grant when the base role check fails. None of the 40+ individual
  `requireRole(actingUser, [...])` call sites changed at all; they're
  unaware grants exist. A grant for "manager" satisfies exactly the same
  checks a real Manager login would, nothing more, nothing less.
- **Settings → Temporary Access** (admin-only): pick a person, a role to
  grant (Manager, HR, Cashier, Receptionist, Staff — deliberately not
  Admin, since full system access is too broad a thing to hand out
  temporarily), a duration (1 hour to 7 days), and an optional reason.
  Shows active grants with a one-click "Revoke now," plus history of
  past grants (expired or revoked).
- **Visible to the person it affects**: while a grant is active, Home
  shows a clear banner ("Temporary Manager access active — until 4:30
  PM") and the relevant tiles appear alongside their normal ones for the
  duration — matching your recipe-population example directly.
- **Every use is logged**: the audit trail records both the grant itself
  (who granted what, to whom, until when) and every time it's actually
  exercised (which action, under which granted role) — a real answer to
  "why did a cashier edit a recipe that day," not just "it happened."
- Expiry needs no cleanup job — every check compares against the current
  time at query time, so a grant simply stops applying the moment it
  expires.

**Restaurant and Accommodation settings relocated**, as requested: table
management now lives in Restaurant Floor itself ("Manage tables"), room
management in Accommodation itself ("Manage rooms") — both exactly the
same functionality, just reachable from where the work actually happens
rather than a separate Settings hub. All the related state and dead
code was fully removed from Settings rather than left as an unused
duplicate.

## Login footer update, and admin-configurable Role Permissions

- **Login footer**: Restaurant/Accommodation quick links replaced with
  developer credit ("Developed by Tim"); background image updated to
  the latest provided photo.
- **Settings → Role Permissions** (admin-only): a toggle matrix — every
  Home tile × every configurable role (Manager, HR, Cashier,
  Receptionist, Staff) — controlling which tiles each role sees on Home.
  Persisted the same way as venue settings, with a "Reset to defaults"
  button to restore the built-in mapping. Admin isn't shown in the
  matrix since it always has full access, non-negotiably.
- **Important, and stated plainly in the UI itself**: this is a
  convenience filter over what appears on Home, not the underlying
  security boundary. The sensitive modules (HR, Payroll, Backups, user
  account management) are protected by the backend's own permission
  checks regardless of what's toggled here — switching a tile on for a
  role that isn't otherwise permitted means they'll see it and get
  blocked when they try to use it, not that it grants real access. This
  was a deliberate scope decision: making the *visibility* configurable
  is safe and useful on its own; rewiring every backend permission check
  to read from a dynamic admin-editable config is a much larger,
  higher-risk change that wasn't part of this request.
- Changes take effect on next login — the running app doesn't hot-swap
  its own Home tiles mid-session.

## Redesigned login: Staff ID + PIN, branded screen

- **Login now uses Staff ID + PIN** instead of PIN alone. This isn't just
  visual — it fixes a real correctness gap in the old design: PIN-only
  login worked by checking every active account's PIN hash in turn,
  which meant two staff accidentally choosing the same PIN would resolve
  ambiguously (whichever the database happened to return first). Staff
  ID now identifies the account first; PIN is verified against that one
  specific record.
- **Staff ID is sequential, starting from 1**, assigned automatically to
  every account (same pattern as Employee Number) — shown once right
  after an account is created (both the first-time admin setup and
  Settings → Staff & Security → Add staff account), and visible
  afterward in the Staff & Security list for admins to reference.
- **Visual redesign** matches the requested layout: branded card over a
  full-bleed background photo, Staff ID field, Password/PIN field with
  show/hide toggle, Sign In, Forgot Password (an informational message
  pointing to admin-initiated reset, not a self-service flow — this app
  runs fully offline, so there's no email/SMS channel to recover
  through), and a footer with venue name, quick shortcuts, and the real
  app version. The background photo is the user-provided asset,
  bundled as `src/assets/login-bg.png` — swap that file to change it.

## A real bug fixed, the 5-role login system, and a unified calendar

- **The document upload bug, root-caused and fixed.** The actual cause
  wasn't in the upload logic at all — it was `window.prompt()`, used to
  ask "what is this document?" A well-known Electron reliability gap:
  `window.prompt()` frequently fails completely silently (no dialog, no
  error, nothing happens) depending on build/version. The same pattern
  existed in one other place — the transaction correction-reason prompt
  in Reports & Accounting — and has been fixed there too, both replaced
  with proper in-app modals matching everything else in this build.
  `window.prompt()`/`window.confirm()` no longer appear anywhere in the
  codebase.
- **Five-role login system**, implementing the agreed proposal: Cashier,
  Receptionist, Manager, HR, Administrator, on top of the existing
  unified PIN login (one entry point, role resolved after authentication
  — not separate login screens per role, per the reasoning in the
  original proposal). The Home screen now filters its tiles by role, so
  people only ever see what they can use — a cashier doesn't see a
  Payroll tile at all, not even to be denied.
- **Backend permissions widened to match**, deliberately bounded: recipe/
  stock editing, stock/wastage sign-offs, and attendance/leave approvals
  now accept Manager alongside Admin; the most sensitive actions (backup
  restore, user account management, HR/payroll record edits) remain
  admin/HR-only exactly as before — this was a conscious scope decision,
  not an oversight, given the real cost of getting access boundaries
  wrong for a live business.
- **A second real gap found and fixed along the way**: conference
  facility setup, running cost entries, and maintenance records had *no
  permission gating at all* — any staff login could create or delete
  them. Now properly restricted to Admin/Manager.
- **Calendar unified across the app.** Reservations, to-do tasks,
  conference bookings, and maintenance schedules now all appear on one
  calendar — pulled live from where they already live, not duplicated
  into a separate table. Employee leave appears too, but only for
  Admin/Manager/HR logins (re-verified server-side, not trusted from the
  renderer) — matching "management logging in can see who's on leave."
  Click any date to see everything scheduled that day in one list, add a
  mini note directly from there, and flag a note for a reminder — due
  reminders trigger a real desktop notification the next time the app is
  opened with that date's date arrived.

## Attendance, document attachments, termination workflow, job history

- **Attendance** is its own top-level module, as requested — a
  self-service kiosk (search your name, Clock In / Clock Out, no login
  gate, since not every employee has a system account) plus an
  admin/HR-only report with Daily/Monthly/Yearly ranges and CSV/PDF
  export. The kiosk uses a deliberately minimal, ungated roster endpoint
  that exposes only name and employee number — nothing from the
  sensitive HR record.
- **Linked to the compensatory structure, for real this time.** Every
  6th consecutive worked day (checked at clock-out, counting backward
  through completed attendance records) automatically credits 1
  Compensatory leave day via the same balance-adjustment mechanism an
  admin would use manually — the exact gap flagged when Compensatory was
  first built ("this app has no attendance system to auto-detect this")
  is now closed.
- **Employee document attachments** reuse the existing Documents
  module's storage mechanism rather than a parallel system — same
  upload/copy/open flow, just with an `employee_id` link. Reachable from
  HR → Documents: pick an employee, upload or view their files (ID
  copies, signed contracts, certificates).
- **Termination / exit workflow.** Marks employment status Terminated
  and the record inactive — nothing is deleted, and a "Rehire" action
  reverses it cleanly. Computes a *suggested* final settlement figure
  from unused annual leave balance × daily rate, clearly labeled as a
  starting point to verify, not an authoritative payroll calculation
  (settlement rules vary by policy and jurisdiction).
- **Job & compensation history**, as its own browsable timeline —
  distinct from the audit log. Every promotion, department transfer,
  salary change, and status change is automatically recorded with an
  effective date and from/to values, visible on each employee's ledger
  page alongside their leave history.

## Hire-date accrual, full HR data model, and a dedicated HR role

- **Leave accrual is now based on actual service, not a lump sum.**
  Previously every employee showed the full annual entitlement (21 days
  annual leave, etc.) from day one of the calendar year regardless of
  when they joined. Now Accrued is prorated by the fraction of the year
  actually worked — bounded by hire date on one side and today on the
  other, since you can't have accrued leave for a period before you
  joined or for days that haven't happened yet. This mirrors how Uganda's
  Employment Act literally describes annual leave accruing progressively
  (7 days per 4-month period) rather than as a lump sum.
- **HR is now a real module with four sections**: Personal Information,
  Employment Details, Payroll, and Leave — each its own table, matching
  the fields requested. "Position" reuses the existing role field and
  "Date Joined" reuses hire_date rather than adding duplicate columns
  for the same concept.
- **A dedicated "HR" role**, distinct from admin and staff. The entire
  HR module — all four sections — is now restricted to admin and HR
  roles; general staff logins can't view it at all, not even read-only.
  This is a deliberate tightening: personal data (date of birth,
  national ID) and payroll data (salary, TIN, NSSF) are meaningfully
  more sensitive than day-to-day POS admin tasks, so a manager who
  handles routine admin work doesn't automatically see salaries unless
  specifically given the HR role. Assign it from Settings → Staff &
  Security when adding or editing a staff account.
- **Real audit trail for HR changes**: Personal/Employment/Payroll edits
  now log a field-level before/after diff (old value → new value) for
  every changed field, not just "something was updated" — this applies
  especially to salary changes, which is exactly the kind of change that
  needs a clear trail.
- Existing employee names were split into first/middle/surname on a
  best-effort basis (first word → first name, last word → surname,
  everything between → middle name) — imperfect for unusual name
  formats, worth a quick review for existing staff.
- **Recommendations for a future pass, not built now**: document
  attachments (ID scans, signed contracts — the existing Documents
  module's storage pattern could be reused for this); a full
  termination/exit workflow (exit date, reason, final settlement,
  connecting to the "Payable on Exit" leave concept mentioned earlier);
  and a genuine job/compensation history table if you want to track
  promotions and raises as their own timeline rather than just an audit
  log entry.

## Leave entitlements & balances (Uganda Employment Act 2006)

Entitlement defaults, verified against Uganda's Employment Act 2006 and
current HR compliance sources rather than assumed from memory, since
this has real payroll/compliance consequences:

- **Annual: 21 days** — confirmed correct, accruing at 7 days per
  4-month period of continuous service.
- **Sick: 30 days** — confirmed correct as the *fully paid* entitlement.
  One nuance worth knowing: the law actually allows up to **two months**
  of sick leave per year — the first month (≈30 days) at full pay, a
  second month available but **unpaid**. Only the paid 30-day figure is
  modeled as the entitlement here.
- **"Family Responsibility Leave" (3 days) — not actually a Uganda
  statutory category.** That name and allocation come from South African
  labour law (BCEA). Uganda's closer legal concept is discretionary
  **"compassionate leave"** (typically 3–6 days, entirely employer
  policy, not a legal mandate). 3 days is a reasonable choice within
  that range, kept under your preferred label — just worth knowing it's
  a policy decision on your part, not a legal requirement.
- **Maternity: 60 working days, Paternity: 4 working days** — both
  confirmed against the Employment Act 2006.
- **Compensatory and Public Holiday have no fixed annual number** — both
  are earned, not entitled. Compensatory ties to the "6 consecutive days
  worked" rule you described; since this app has no attendance/clock-in
  system, that can't be auto-detected — an admin manually credits the
  day when they know it applies (Leave ledger → Adjust balance →
  Accrual credit).

**Leave log** (HR → Leave): Employee Number / Employee / Date From /
Date To / Leave Type / Days / Status / Approved By — matching the
requested format, with Transaction ID replaced by Employee Number
(sequential, starting from 1, backfilled for existing staff) and the
Remarks column dropped. The unique reference per record still exists
internally for audit purposes, just isn't a displayed column.

**Employee balance ledger**: Employee / Leave Type / Opening Balance /
Accrued / Taken / Adjustment / Closing Balance, per calendar year, with
a year selector. Nothing here is a separately-stored running total that
could drift — every figure is computed fresh from entitlement policy,
manually recorded opening balances/accruals/corrections, and the actual
leave records for that year, every time it's viewed. "Payable on Exit"
from the original example wasn't built, as requested — a genuine, useful
future addition (calculating unused annual leave payout on termination)
if you want it later, not something to guess at now.

## PDF export fix, employee leave tracking, and an employee ledger

- **Fixed a real PDF export bug**: exported PDFs showed a dark rectangular
  region wherever the printed content was shorter than the page. Root
  cause wasn't in the app's styling at all — `index.html` sets a dark
  background directly on `html`/`body`/`#root`, outside the React
  component tree the print CSS override touches. When printed content
  didn't fill the full page, that dark background showed through
  underneath. Fixed at the source with a print-media override on those
  three elements specifically.
- **Employee leave tracking** — Leave Day, Off Day, Sick Leave,
  Maternity, Paternity, Other. HR now has a Leave tab (company-wide,
  every employee) alongside Employees, with reference numbers (`LVE001`,
  same persistent pattern as everything else), and the same lightweight
  approval sign-off used for wastage/adjustments — stock/leave already
  took effect the moment it's logged; approval is an optional review
  annotation, not a gate.
- **Employee Ledger** — click any employee's name for their full history:
  hire date, every leave record, and running totals by leave type.
  Mirrors the Inventory Ledger's shape and philosophy.
- **A real permission gap, fixed.** The entire Employees module —
  including editing pay rates — had no admin gating at all, unlike every
  other sensitive module in this app (recipes, stock, staff accounts).
  Anyone logged in as staff could previously edit or delete employee
  records and pay rates. Fixed to match the Phase 1 pattern: only admins
  can create, edit, deactivate, or remove employee records; anyone can
  still view the directory and open an employee's leave ledger.
- Deliberately not built: a leave entitlement/balance system (e.g. "21
  days annual leave per year, 16 remaining"). This tracks leave *taken*,
  not an accrual policy — a real, separate feature worth adding later if
  wanted, not something to bolt on without being asked.

## Detailed Wastage, Staff & Comp, and Adjustments reports

- **Wastage and Staff/Comp meals split into two separate tabs** (Store →
  Wastage / Staff & Comp Meals), rather than one shared list — logging
  still goes through one modal with an internal toggle between the two,
  but reporting is now genuinely separate: Waste ID / Date / Time / Item
  / Qty / Unit / Unit Cost / Waste Cost / Reason / Location / Reported By
  / Approved By, matching the requested format (Category column dropped,
  as asked). Unit Cost is kept deliberately — it's what makes Waste Cost
  auditable instead of a black box. Both tabs have Daily/Monthly/Yearly
  ranges and CSV/PDF export, and a new Location field on every entry.
- **Adjustments tab rebuilt** the same way: Adjustment ID / Date / Time /
  Item / System Qty / Physical Qty / Adjustment Qty / Unit / Unit Cost /
  Adjustment Value / Reason / Adjusted By / Approved By / Status. Every
  adjustment now snapshots the ingredient's cost at the moment it
  happens (same principle as the COGS snapshot on sales since Phase 1),
  so Adjustment Value reflects what the item was actually worth then —
  not whatever it costs today.
- **"Approved By" / "Status" — a deliberate, lighter-weight design
  choice.** This is *not* a blocking approval workflow: stock is still
  deducted or corrected the instant an entry is logged, exactly as
  before. An admin can mark any wastage or adjustment entry "Approved"
  afterward — a lightweight sign-off, like a manager initialing a paper
  log during review — which never reverses or blocks anything. A real
  gated workflow (where stock isn't touched until approved) is a
  genuinely different, larger feature and wasn't built here; this was a
  deliberate scope decision, not an oversight.

## Staff meals, complimentary meals, a Consumption report, and a full Inventory Ledger

- **Staff meals and complimentary meals** are now trackable, deliberately
  kept separate from stock corrections. A stock adjustment stays a
  neutral bookkeeping fix — correcting a miscount isn't a cost, it's
  fixing the record to match reality. Staff meals and comps, like waste,
  *are* real costs (ingredients that left with no revenue behind them),
  just for a deliberate reason rather than spoilage — so they're logged
  through the same mechanism as wastage (Store → Wastage & Meals) but
  reported completely separately, with their own reference sequences
  (`STAFF-001`, `COMP-001`) and **excluded from the wastage total**, so
  that figure stays a true measure of loss rather than being inflated by
  a benefit program or comps policy.
- **Consumption tab rebuilt** to the requested format: Item / Sales
  Consumption / Waste / Staff Meals / Complimentary Meals, with a Today/
  This month/This year range and CSV/PDF export, plus summary cards for
  staff-meal and comp cost.
- **Full reference numbering**, matching the pattern already used for
  receipts/invoices/SKUs: `GRN-XXX` for every goods-received purchase,
  `WST/STAFF/COMP-XXX` for the three non-sale movement types, `ADJ-XXX`
  for adjustments (including stock-count reconciliations). All persistent
  and sequential, existing records backfilled automatically.
- **Inventory Ledger** (Store → Ledger) — the full running-balance
  history for one item: every purchase, sale, waste/staff/comp entry, and
  adjustment, chronologically, exactly in the Date / Reference / Type /
  Item / Qty In / Qty Out / Balance format requested. Reachable via a
  searchable item picker or by clicking an item name directly in the
  Stock tab. Like the Stock tab's Opening figure, the ledger's opening
  balance is derived — today's real quantity worked backward through
  every movement ever logged for that item — which guarantees the last
  row's balance always exactly equals current stock.
- **A real accounting gap, fixed.** Waste, staff meals, and complimentary
  meals were never subtracted anywhere in the Dashboard's net profit —
  they're real costs that simply weren't in the calculation. Fixed: they
  now reduce net profit correctly (folded into Operating Expenses, with
  their own summary card so the component is still visible), in both the
  summary cards and the per-period income-vs-expense chart.

## Stock IDs, a proper Stock table, and a real goods-received purchase log

- **Every stock item now has a Stock ID** (`STK001`, `STK002`, ...) —
  generated the same way receipt/invoice numbers are: a persistent,
  sequential, never-reused reference. Existing items were backfilled in
  order of creation; nothing had to be re-entered.
- **The Stock tab is now the primary report**, not a plain list: Stock ID
  / Item / Unit / Opening / Received / Consumed / Wasted / Current /
  Reorder Level / Status, with the same Today/This month/This year range
  and CSV/PDF export as the Consumption tab's reconciliation (which now
  lives here instead, since duplicating the same table in two tabs added
  nothing). The Consumption tab goes back to being just the detailed
  sale-by-sale movement log, with a pointer to the Stock tab for the full
  reconciliation.
- **Recording a purchase is now a real goods-received form**: Supplier,
  Invoice number, Item, Quantity, Unit, Unit cost, a live Total cost
  preview, and "Received by" auto-captured from whoever's logged in —
  no separate field needed for that, since it's always the acting user.
- **Purchase log is a proper table**: Date received / Item / Supplier /
  Invoice # / Qty / Unit / Unit Cost / Total / Received by, with CSV/PDF
  export, matching every other tabular report in the app.

## Stock movement reconciliation, dashboard chart redesign, and two real bugs fixed

- **Stock movement table** (Store → Consumption): Opening / Purchases /
  Sales Consumption / Waste / Closing per item, with a Today/This month/
  This year range and CSV/PDF export. There's no historical stock-level
  snapshot table, so Opening is derived backward — today's real current
  quantity minus every logged movement (purchases, sale consumption,
  waste, correction reversals, manual adjustments) in the period. This is
  accurate for any range running up to now (which is all three range
  options offered), not for an arbitrary already-closed past period —
  that would need real point-in-time snapshots, which isn't what this
  does. If a manual adjustment happened during the period, it's folded
  into Opening rather than broken out as its own column, with a note
  pointing to the Adjustments tab for that detail.
- **Dashboard charts redesigned** to look like an actual analytics
  product: smooth Catmull-Rom curves instead of straight jagged
  segments, a gradient area fill under the revenue trend line, Y-axis
  gridlines with compact labels (1.5M / 500K, not raw digits), and
  consistent card framing with legends across all four charts — still no
  charting library added, just better SVG.
- **Conference hourly billing bug, fixed.** The booking amount was always
  set to the flat hourly rate, never multiplied by actual hours between
  start and end time — so a 3-hour hourly booking billed the same as a
  1-hour one. Fixed to compute `hourly_rate × hours occupied`, with the
  math now shown directly under the amount field so it's visible, not a
  black box.
- **Blank Inventory screen, fixed.** A state variable (`wastageItem`) got
  dropped during an earlier consolidation while three places in the
  component still referenced it — including at the top level of the
  render, which throws on every single render with no error boundary to
  catch it, producing a blank screen. This also exposed a real gap in
  how this project was being validated: syntax checks were filtered to
  just `TS1xxx` (real syntax errors) and discarded everything else,
  which meant "undefined variable" (`TS2304`) was being silently thrown
  away along with legitimate noise. Validation now explicitly checks for
  `TS2304` too, plus a sweep confirming every state setter used has a
  matching declaration — both run clean as of this build.

## Conference billing, reporting fixes, exports, and a business dashboard

A batch of real fixes plus three new capabilities, all additive:

- **Conference now bills like Restaurant and Accommodation, and its sales
  are no longer invisible to reporting.** The actual bug: settling a
  conference booking only ever updated its own table — it never wrote
  into the shared financial ledger the other two sections use, so
  conference revenue couldn't show up in any report no matter how the
  report was written. Fixed at the root: settling a booking now writes
  into the same ledger (sharing the booking's own ID as the transaction
  ID, so no extra column was needed), allocates a real receipt reference,
  and gets a proper Bill → payment method → receipt/print screen matching
  the other two sections. A second, related bug this surfaced: conference
  revenue was silently being added to *room* revenue in the summary
  totals via a catch-all `else` — fixed with explicit per-kind handling,
  and a "This year" range was added to Reports & Accounting (it only had
  Today/This month before).
- **Stock consumption visibility.** A new Consumption tab in the Store
  shows exactly what stock has been deducted by sales (and restored by
  corrections) — this was already being tracked, it just had no screen.
  Worth knowing: a menu item only deducts stock if it has a recipe linked
  under the Recipes tab — an unlinked item selling normally with no stock
  movement isn't a bug, it's a dish with no defined ingredients yet.
- **CSV and PDF export**, in Reports & Accounting (with a Restaurant/
  Accommodation/Conference filter) and Running Costs. CSV is a plain
  client-side download, no dependency needed. PDF reuses Electron's
  built-in PDF renderer (`webContents.printToPDF`) on the same print-only
  DOM technique already used for receipts — no new library, and it
  prompts a normal save-file dialog.
- **Business Dashboard** — a new top-level tile with day/week/month/year
  granularity: an overall revenue trend line chart, a bar chart comparing
  the three revenue sections, a pie chart of revenue share, and a grouped
  bar chart of revenue vs. operating expenses vs. net profit. All four
  charts are hand-rolled plain SVG components — deliberately no charting
  library was added, consistent with how the food-cost chart in Phase 3
  was already built with plain CSS bars. Net profit = revenue − cost of
  goods sold (restaurant only) − operating expenses (running costs +
  completed maintenance work); gross profit is shown as a summary figure
  alongside it.

## Phase 3: food-cost & profitability reporting, alerts

No new schema — this is entirely reporting on what Phases 1 and 2 already
capture. Reports & Accounting is now sectioned (Overview / Food Cost /
Wastage / Variance / Alerts):

- **Food cost by dish** — uses the COGS snapshot from Phase 1, so it
  reflects what a dish actually cost at the time it was sold, never
  recalculated from today's recipe or prices.
- **Daily revenue vs. cost of goods sold**, as a simple bar chart (no
  charting library — plain CSS bars, consistent with the rest of the
  app). Day-bucketing happens in the renderer using local calendar dates,
  the same approach used everywhere else in this app for dates — not
  SQLite's UTC-based date functions, which would reintroduce the kind of
  timezone skew already fixed elsewhere.
- **Wastage value** — total and by-reason breakdown, plus the most-wasted
  items in the selected range.
- **Variance** — current total inventory value, recent finalized stock
  counts with their net variance cost, and which items drift most across
  counts over time.
- **Alerts** — a single feed combining: an ingredient's price jumping
  beyond a configurable %, a dish exceeding its target food-cost %, a
  stock count variance beyond a configurable %, and low stock. Thresholds
  are editable right on the Alerts tab.

## Layout & readability pass

A general pass to keep text readable and layouts predictable whether the
window is maximized, resized small, or anywhere in between:

- Fixed a real CSS grid bug present throughout the app: a bare `1fr`
  column doesn't actually shrink below its content's natural size by
  default, so long guest names, item names, or notes could silently
  overflow their row instead of truncating. Every text-holding grid
  column now uses `minmax(0, 1fr)`, and long labels truncate with an
  ellipsis instead of breaking the layout.
- Content sections now cap at a comfortable reading width (1100px)
  instead of stretching edge-to-edge on a maximized or ultra-wide
  display — applied uniformly, including table/room tile grids, for
  visual consistency (tiles still wrap naturally within that width). The
  Home app launcher is intentionally left unconstrained, since more tiles
  per row is a good use of extra space there.

## Recipe units: separated quantity/unit, editable lines, and real conversion

- **Quantity and unit are now independent fields** on every recipe line —
  you can specify "5 g curry powder" even though curry powder might be
  stocked in kg. The system converts automatically as long as the units
  are in the same measurable family (weight, volume, or the literal-count
  group pcs/pair/dozen/gross). If they're not compatible — e.g. trying to
  express a weight ingredient in a volume unit — the line is flagged and
  saving is blocked, rather than silently producing a wrong cost.
- **Existing recipe lines are directly editable** — adjust a quantity or
  unit in place, no need to remove and re-add an ingredient.
- **The unit dropdown is now a full, categorized catalog**: cooking/
  kitchen (tsp, tbsp, cup, pinch, dash), metric and regional-imperial
  weight (mg/g/kg, oz/lb) and volume (ml/l, fl oz/pint/quart/gallon),
  count/piece (pcs, pair, dozen, gross), food portion (portion, serving,
  scoop), produce (bunch, head, punnet), meat/seafood (fillet, whole,
  side, slab), bakery/pastry (loaf, batch, sheet), beverage (shot, glass,
  keg), and inventory packaging/purchasing (carton, case, box, bag, sack,
  crate, pallet, bottle, can, tin, jar, drum, roll). Descriptive units
  like "carton" or "bunch" don't have a fixed numeric ratio to anything
  else, so each only converts to itself — this is deliberate, to avoid
  quietly guessing a wrong conversion for things that genuinely vary
  (a carton of what, holding how much?).
- What actually gets costed and deducted from stock is still always
  expressed in the stock item's own tracked unit — the quantity/unit you
  type is converted into that behind the scenes and both are kept, so the
  recipe editor can show back exactly what was typed.

## Accounting correctness

Two fixes worth knowing about, since they affect real numbers:

- **Nights stayed** is now calculated as the difference between calendar
  *dates* (check-out date minus check-in date), not elapsed hours. A guest
  who checks in on the 10th and checks out any time on the 11th has stayed
  1 night — not 2. The old formula rounded up any partial day past 24
  elapsed hours, which overcharged almost any stay that didn't end at
  exactly the same clock time it began. This affects the room folio,
  checkout billing, the Accommodation board's "nights" badge, and the
  outstanding-charges report in Reports & Accounting.
- **A later planned checkout date now shows up immediately.** Previously,
  the room folio only counted nights *elapsed so far*, so a guest booked
  in for a week still showed "1 night" on day one — the checkout date
  given at check-in wasn't being used for anything until the day actually
  arrived. The folio, the Accommodation board's badge, and the outstanding
  report now show the greater of (nights elapsed) and (nights implied by
  the planned checkout date), clearly labeled as a planned estimate. The
  *actual* bill at checkout still always uses the real checkout date, not
  the plan — this only fixes what's displayed while the stay is ongoing.
- **All monetary calculations are rounded to the cent** (`roundMoney`) at
  every stage — subtotal, tax, service, total, and recipe cost — both in
  the renderer and in the equivalent SQL aggregates. This prevents the
  small floating-point drift that repeated addition/multiplication can
  introduce from ever reaching a stored total, a receipt, or a report.
- **Local dates, not UTC.** Check-in dates and "today" are computed from
  the browser's local calendar date, not `toISOString()` (which is UTC and
  can silently roll over to the wrong day near midnight in any timezone
  ahead or behind UTC). This matters for anywhere not on UTC — which is
  everywhere this app is actually likely to run.

## Where your data lives

- **Database**: `g2-pos.sqlite` in the OS's standard app-data folder
  (e.g. `%APPDATA%\g2-pos-desktop` on Windows, `~/Library/Application
  Support/g2-pos-desktop` on Mac).
- **Uploaded documents**: a `documents/` folder next to the database,
  organized by category.
- **Backups**: a `backups/` folder next to the database. Use "Open folder"
  in Settings → Backups to find it directly, or "Restore from a backup
  file" to roll back to one.

All of this survives app updates and reinstalls (as long as you don't
delete the app-data folder), and the backups give you a way to recover
if a machine is lost or the database file gets corrupted.

## Notes

- The app's icon comes from `build/icon.png` (and `build/icon.ico` for
  Windows, generated from your logo). electron-builder generates the
  macOS `.icns` automatically from `icon.png` during the Mac build — no
  extra step needed.
- The app currently loads its fonts (Space Grotesk / Inter) from Google
  Fonts at runtime, so it needs internet the first time each font loads.
  If you need this fully offline, let me know and I can bundle the font
  files locally instead.
- To change the app name shown during install, edit `productName` in
  `package.json`.
