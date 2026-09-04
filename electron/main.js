const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const isDev = !app.isPackaged;
const uid = (p) => `${p}-${crypto.randomUUID()}`;

// Local calendar date as YYYY-MM-DD — not toISOString(), which is UTC and
// can roll to the wrong day near midnight in any non-UTC timezone. Mirrors
// the same fix applied to date handling in the renderer.
function todayStrServer() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Same idea as todayStrServer, but for an arbitrary timestamp — used to
// bridge epoch-ms transaction dates against the YYYY-MM-DD date strings
// running_costs/maintenance_records store.
function toLocalDateStrServer(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


// electron-updater is optional at runtime: if it's missing or throws on
// require (e.g. a broken install), the app must still start normally
// instead of showing a blank window — updates just become unavailable.
let autoUpdater = null;
try {
  ({ autoUpdater } = require("electron-updater"));
} catch {
  autoUpdater = null;
}
const UPDATE_OWNER = "TimothyFesto";
const UPDATE_REPO = "POS_APP_DEV";

/* ------------------------------------------------------------------ */
/* Paths                                                               */
/* ------------------------------------------------------------------ */
const userDataDir = app.getPath("userData");
const dbPath = path.join(userDataDir, "g2-pos.sqlite");
const backupsDir = path.join(userDataDir, "backups");
const documentsDir = path.join(userDataDir, "documents");
for (const dir of [backupsDir, documentsDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

/* ------------------------------------------------------------------ */
/* Database + schema                                                   */
/* ------------------------------------------------------------------ */
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  -- generic key/value store: settings, menu, tables/rooms config
  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- this installation's terminal identity
  CREATE TABLE IF NOT EXISTS terminals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  );

  -- staff accounts (PIN login)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,             -- 'admin' | 'staff'
    pin_hash TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  -- durable financial ledger: one row per finalized transaction
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,             -- 'restaurant' | 'accommodation'
    ref_label TEXT,                 -- Table T3 / Room 12 / etc.
    guest_name TEXT,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    service REAL NOT NULL,
    total REAL NOT NULL,
    payment_method TEXT,            -- cash | card | room
    room_charged TEXT,
    status TEXT NOT NULL,           -- paid | void
    void_reason TEXT,
    user_id TEXT,
    user_name TEXT,
    terminal_id TEXT,
    created_at INTEGER NOT NULL,
    closed_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    menu_item_id TEXT,
    name TEXT NOT NULL,
    qty REAL NOT NULL,
    price REAL NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_txn_kind_date ON transactions(kind, closed_at);
  CREATE INDEX IF NOT EXISTS idx_txn_items ON transaction_items(transaction_id);

  -- audit trail: every sensitive action
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    terminal_id TEXT,
    created_at INTEGER NOT NULL
  );

  -- uploaded company templates/documents
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,         -- letterhead | receipt | invoice | delivery_note | other
    filename TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    uploaded_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    note TEXT
  );

  -- restaurant store: raw stock items (ingredients, supplies)
  CREATE TABLE IF NOT EXISTS stock_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,                 -- kg, g, l, ml, pcs, etc.
    current_qty REAL NOT NULL DEFAULT 0,
    reorder_level REAL NOT NULL DEFAULT 0,
    cost_per_unit REAL,
    created_at INTEGER NOT NULL
  );

  -- purchases into stock
  CREATE TABLE IF NOT EXISTS stock_purchases (
    id TEXT PRIMARY KEY,
    stock_item_id TEXT NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    qty REAL NOT NULL,
    unit_cost REAL,
    total_cost REAL,
    supplier TEXT,
    note TEXT,
    user_id TEXT,
    user_name TEXT,
    terminal_id TEXT,
    purchased_at INTEGER NOT NULL
  );

  -- recipe / bill-of-materials: how much of each stock item a menu item uses
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    menu_item_id TEXT NOT NULL,
    stock_item_id TEXT NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    qty_per_serving REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_recipes_menu ON recipes(menu_item_id);

  -- stock movements caused by sales (and their reversals on correction)
  CREATE TABLE IF NOT EXISTS stock_consumption_log (
    id TEXT PRIMARY KEY,
    stock_item_id TEXT NOT NULL,
    qty REAL NOT NULL,                  -- amount subtracted from stock (negative = added back)
    reason TEXT NOT NULL,               -- 'sale' | 'reversal' | 'adjustment'
    ref_transaction_id TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_consumption_item ON stock_consumption_log(stock_item_id);
`);

/* ------------------------------------------------------------------ */
/* Database schema versioning + migrations                             */
/*                                                                       */
/* App updates (see the update system below) only ever replace program  */
/* files — they never run SQL. Any future structural database change    */
/* belongs here instead, as a new numbered, additive migration. This    */
/* keeps "install a new app version" and "change the database" as two   */
/* separate, independently-recoverable operations.                      */
/* ------------------------------------------------------------------ */
const CURRENT_SCHEMA_VERSION = 24;

// Every structural change after the baseline goes here as a new entry.
// Never edit an already-released migration — add a new one instead, so
// a database that already applied it is left alone.
const MIGRATIONS = [
  {
    version: 2,
    name: "add_document_references",
    up: (db) => {
      // Persistent, never-reused reference numbers for receipts (R001...)
      // and invoices (INV001...), assigned once at finalization and kept
      // forever afterwards — including if the transaction is later voided.
      db.exec(`
        CREATE TABLE IF NOT EXISTS document_sequences (
          doc_type TEXT PRIMARY KEY,
          prefix TEXT NOT NULL,
          next_number INTEGER NOT NULL DEFAULT 1
        );
      `);
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, 1)").run("receipt", "R");
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, 1)").run("invoice", "INV");
      db.exec(`ALTER TABLE transactions ADD COLUMN receipt_ref TEXT`);
      db.exec(`ALTER TABLE transactions ADD COLUMN invoice_ref TEXT`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_txn_receipt_ref ON transactions(receipt_ref)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_txn_invoice_ref ON transactions(invoice_ref)`);
    },
  },
  {
    version: 3,
    name: "add_calendar_contacts_tasks_hr",
    up: (db) => {
      db.exec(`
        -- Advance bookings, ahead of an actual check-in
        CREATE TABLE IF NOT EXISTS reservations (
          id TEXT PRIMARY KEY,
          room_id TEXT,
          room_name TEXT NOT NULL,
          guest_name TEXT NOT NULL,
          phone TEXT,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'reserved',   -- reserved | checked_in | cancelled
          notes TEXT,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);

        -- Guests / suppliers / staff directory
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,                        -- guest | supplier | staff | other
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          notes TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);

        -- Staff task list
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          assigned_to TEXT,
          due_date TEXT,
          priority TEXT NOT NULL DEFAULT 'normal',   -- low | normal | high
          status TEXT NOT NULL DEFAULT 'open',       -- open | done
          created_by TEXT,
          created_at INTEGER NOT NULL,
          completed_at INTEGER
        );

        -- Employee records, separate from POS login accounts — not every
        -- staff member (e.g. cleaning, security) needs a system login.
        CREATE TABLE IF NOT EXISTS employees (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT,
          phone TEXT,
          email TEXT,
          hire_date TEXT,
          pay_rate REAL,
          pay_type TEXT DEFAULT 'monthly',           -- hourly | monthly
          status TEXT NOT NULL DEFAULT 'active',     -- active | inactive
          notes TEXT,
          linked_user_id TEXT,
          created_at INTEGER NOT NULL
        );
      `);
    },
  },
  {
    version: 4,
    name: "add_conference_running_costs_maintenance",
    up: (db) => {
      db.exec(`
        -- Conference / meeting-room facilities, separate from guest rooms
        CREATE TABLE IF NOT EXISTS conference_rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          capacity INTEGER,
          hourly_rate REAL,
          daily_rate REAL,
          amenities TEXT,
          status TEXT NOT NULL DEFAULT 'active',      -- active | retired
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conference_bookings (
          id TEXT PRIMARY KEY,
          room_id TEXT NOT NULL,
          room_name TEXT NOT NULL,
          client_name TEXT NOT NULL,
          phone TEXT,
          event_date TEXT NOT NULL,
          start_time TEXT,
          end_time TEXT,
          rate_type TEXT NOT NULL DEFAULT 'daily',    -- hourly | daily
          amount REAL NOT NULL,
          payment_method TEXT,
          status TEXT NOT NULL DEFAULT 'booked',      -- booked | completed | cancelled
          notes TEXT,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL,
          closed_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_conf_bookings_date ON conference_bookings(room_id, event_date);

        -- Recurring/operating expenses: utilities, rent, and the like
        CREATE TABLE IF NOT EXISTS running_costs (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,                     -- electricity | water | internet | rent | other...
          description TEXT,
          vendor TEXT,
          amount REAL NOT NULL,
          expense_date TEXT NOT NULL,
          payment_method TEXT,
          recurring INTEGER NOT NULL DEFAULT 0,
          notes TEXT,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_running_costs_date ON running_costs(expense_date);

        -- Renovations, maintenance, and repairs
        CREATE TABLE IF NOT EXISTS maintenance_records (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'repair',     -- repair | maintenance | renovation
          location TEXT,
          cost REAL,
          vendor TEXT,
          status TEXT NOT NULL DEFAULT 'planned',      -- planned | in_progress | completed
          scheduled_date TEXT,
          completed_date TEXT,
          notes TEXT,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_records(status);
      `);
    },
  },
  {
    version: 5,
    name: "add_recipe_versioning_cost_snapshots_stock_adjustments",
    up: (db) => {
      db.exec(`
        -- Recipes are no longer overwritten in place: every save creates a
        -- new version, and past sales stay linked to whichever version was
        -- active when they happened. This is what makes historical food-cost
        -- figures trustworthy even after a recipe changes later.
        CREATE TABLE IF NOT EXISTS recipe_versions (
          id TEXT PRIMARY KEY,
          menu_item_id TEXT NOT NULL,
          version_number INTEGER NOT NULL,
          is_current INTEGER NOT NULL DEFAULT 1,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_recipe_versions_menu ON recipe_versions(menu_item_id, is_current);

        ALTER TABLE recipes ADD COLUMN recipe_version_id TEXT;

        -- Cost-of-goods-sold snapshot: what the dish actually cost to make
        -- at the moment it was sold, frozen permanently — not recalculated
        -- later if the recipe or ingredient prices change.
        ALTER TABLE transaction_items ADD COLUMN unit_cost REAL;
        ALTER TABLE transaction_items ADD COLUMN recipe_version_id TEXT;

        -- Controlled manual stock corrections — distinct from purchases and
        -- sale consumption, always with a reason and always audit-logged.
        CREATE TABLE IF NOT EXISTS stock_adjustments (
          id TEXT PRIMARY KEY,
          stock_item_id TEXT NOT NULL,
          previous_qty REAL NOT NULL,
          new_qty REAL NOT NULL,
          delta REAL NOT NULL,
          reason TEXT NOT NULL,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_stock_adjustments_item ON stock_adjustments(stock_item_id);
      `);

      // Backfill: every menu item that already has recipe lines gets a
      // version 1, and its existing lines are attached to it — nothing
      // about existing recipes changes from the user's point of view.
      const menuItemIds = db.prepare("SELECT DISTINCT menu_item_id FROM recipes WHERE recipe_version_id IS NULL").all();
      const insertVersion = db.prepare("INSERT INTO recipe_versions (id, menu_item_id, version_number, is_current, user_id, user_name, created_at) VALUES (?,?,1,1,NULL,NULL,?)");
      const attachLines = db.prepare("UPDATE recipes SET recipe_version_id = ? WHERE menu_item_id = ? AND recipe_version_id IS NULL");
      for (const row of menuItemIds) {
        const versionId = `rv-backfill-${row.menu_item_id}`;
        insertVersion.run(versionId, row.menu_item_id, Date.now());
        attachLines.run(versionId, row.menu_item_id);
      }
    },
  },
  {
    version: 6,
    name: "add_recipe_line_display_quantity_and_unit",
    up: (db) => {
      // qty_per_serving stays the source of truth for costing/consumption
      // (always expressed in the stock item's own tracked unit). These two
      // columns separately remember what the user actually typed — e.g.
      // "5 g" rather than a converted "0.005 kg" — so a recipe line can be
      // re-opened and shows back exactly what was entered.
      db.exec(`
        ALTER TABLE recipes ADD COLUMN display_qty REAL;
        ALTER TABLE recipes ADD COLUMN display_unit TEXT;
      `);
    },
  },
  {
    version: 7,
    name: "add_wastage_and_stock_counts",
    up: (db) => {
      db.exec(`
        -- Wastage: spoilage, expiry, prep error, spillage, damage — tracked
        -- separately from normal sale consumption so it's clear how much
        -- stock loss isn't explained by sales at all.
        CREATE TABLE IF NOT EXISTS wastage_log (
          id TEXT PRIMARY KEY,
          stock_item_id TEXT NOT NULL,
          qty REAL NOT NULL,
          reason TEXT NOT NULL,
          note TEXT,
          cost_impact REAL,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_wastage_item ON wastage_log(stock_item_id);
        CREATE INDEX IF NOT EXISTS idx_wastage_date ON wastage_log(created_at);

        -- Physical stock counts: theoretical vs. actual, with variance and
        -- its cost impact. Finalizing a count reconciles stock via the same
        -- stock_adjustments mechanism from Phase 1, tagged to the count.
        CREATE TABLE IF NOT EXISTS stock_counts (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL DEFAULT 'in_progress',
          note TEXT,
          started_by_user_id TEXT,
          started_by_user_name TEXT,
          finalized_by_user_id TEXT,
          finalized_by_user_name TEXT,
          started_at INTEGER NOT NULL,
          finalized_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS stock_count_items (
          id TEXT PRIMARY KEY,
          stock_count_id TEXT NOT NULL,
          stock_item_id TEXT NOT NULL,
          theoretical_qty REAL NOT NULL,
          counted_qty REAL,
          variance REAL,
          cost_impact REAL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_stock_count_items_count ON stock_count_items(stock_count_id);
      `);
    },
  },
  {
    version: 8,
    name: "add_stock_sku_and_purchase_invoice_number",
    up: (db) => {
      db.exec(`
        ALTER TABLE stock_items ADD COLUMN sku TEXT;
        ALTER TABLE stock_purchases ADD COLUMN invoice_number TEXT;
      `);
      // Backfill existing items with a sequential Stock ID (STK001, ...),
      // then seed the shared reference-number sequence so future items
      // continue from there. This can't reuse allocateReference() — that
      // helper isn't defined yet at migration-run time — so it's inlined.
      const existing = db.prepare("SELECT id FROM stock_items ORDER BY created_at ASC").all();
      const updateSku = db.prepare("UPDATE stock_items SET sku = ? WHERE id = ?");
      let n = 0;
      for (const row of existing) {
        n += 1;
        updateSku.run(`STK${String(n).padStart(3, "0")}`, row.id);
      }
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run("stock_sku", "STK", n + 1);
    },
  },
  {
    version: 9,
    name: "add_stock_movement_references_and_internal_consumption",
    up: (db) => {
      db.exec(`
        ALTER TABLE stock_purchases ADD COLUMN grn_number TEXT;
        ALTER TABLE wastage_log ADD COLUMN reference TEXT;
        ALTER TABLE stock_adjustments ADD COLUMN reference TEXT;
      `);

      const seedAndBackfill = (doc_type, prefix, rows, updateStmt) => {
        let n = 0;
        for (const row of rows) {
          n += 1;
          updateStmt.run(`${prefix}${String(n).padStart(3, "0")}`, row.id);
        }
        db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run(doc_type, prefix, n + 1);
      };

      // Goods-received references, in the order they were actually received.
      seedAndBackfill(
        "grn", "GRN",
        db.prepare("SELECT id FROM stock_purchases ORDER BY purchased_at ASC").all(),
        db.prepare("UPDATE stock_purchases SET grn_number = ? WHERE id = ?")
      );

      // Wastage, staff meals, and complimentary meals share one table but
      // get their own independent reference sequences, since they're
      // conceptually different movement types even though the schema is
      // the same shape.
      const wasteRows = db.prepare("SELECT id FROM wastage_log WHERE reason NOT IN ('staff_meal', 'complimentary') ORDER BY created_at ASC").all();
      seedAndBackfill("wastage_ref", "WST", wasteRows, db.prepare("UPDATE wastage_log SET reference = ? WHERE id = ?"));
      const staffRows = db.prepare("SELECT id FROM wastage_log WHERE reason = 'staff_meal' ORDER BY created_at ASC").all();
      seedAndBackfill("staff_meal_ref", "STAFF", staffRows, db.prepare("UPDATE wastage_log SET reference = ? WHERE id = ?"));
      const compRows = db.prepare("SELECT id FROM wastage_log WHERE reason = 'complimentary' ORDER BY created_at ASC").all();
      seedAndBackfill("complimentary_ref", "COMP", compRows, db.prepare("UPDATE wastage_log SET reference = ? WHERE id = ?"));

      // Stock adjustments (manual corrections and stock-count reconciliations).
      seedAndBackfill(
        "adjustment_ref", "ADJ",
        db.prepare("SELECT id FROM stock_adjustments ORDER BY created_at ASC").all(),
        db.prepare("UPDATE stock_adjustments SET reference = ? WHERE id = ?")
      );
    },
  },
  {
    version: 10,
    name: "add_wastage_location_and_approval_sign_off_and_adjustment_cost",
    up: (db) => {
      db.exec(`
        ALTER TABLE wastage_log ADD COLUMN location TEXT;
        ALTER TABLE wastage_log ADD COLUMN unit_cost REAL;
        ALTER TABLE wastage_log ADD COLUMN approved_by_user_id TEXT;
        ALTER TABLE wastage_log ADD COLUMN approved_by_user_name TEXT;
        ALTER TABLE wastage_log ADD COLUMN approved_at INTEGER;

        ALTER TABLE stock_adjustments ADD COLUMN unit_cost_snapshot REAL;
        ALTER TABLE stock_adjustments ADD COLUMN value_impact REAL;
        ALTER TABLE stock_adjustments ADD COLUMN approved_by_user_id TEXT;
        ALTER TABLE stock_adjustments ADD COLUMN approved_by_user_name TEXT;
        ALTER TABLE stock_adjustments ADD COLUMN approved_at INTEGER;
      `);
      // Backfill existing wastage rows' unit_cost from cost_impact/qty —
      // exact, since cost_impact was already computed as qty * unit cost
      // at the time each entry was logged.
      const existingWaste = db.prepare("SELECT id, qty, cost_impact FROM wastage_log WHERE qty > 0").all();
      const updateWasteCost = db.prepare("UPDATE wastage_log SET unit_cost = ? WHERE id = ?");
      for (const w of existingWaste) {
        updateWasteCost.run(Math.round(((w.cost_impact || 0) / w.qty + Number.EPSILON) * 100) / 100, w.id);
      }
      // Best-effort backfill for existing adjustments: there's no
      // historical cost snapshot to draw on, so this uses today's
      // current cost as an approximation for old rows only — every new
      // adjustment going forward snapshots the real cost at the moment
      // it happens, same as wastage already does.
      const existingAdjustments = db.prepare(`
        SELECT sa.id, sa.delta, si.cost_per_unit FROM stock_adjustments sa JOIN stock_items si ON si.id = sa.stock_item_id
      `).all();
      const updateAdj = db.prepare("UPDATE stock_adjustments SET unit_cost_snapshot = ?, value_impact = ? WHERE id = ?");
      for (const a of existingAdjustments) {
        const cost = a.cost_per_unit || 0;
        updateAdj.run(cost, Math.round((a.delta * cost + Number.EPSILON) * 100) / 100, a.id);
      }
    },
  },
  {
    version: 11,
    name: "add_leave_records",
    up: (db) => {
      db.exec(`
        -- Leave day, off day, sick leave, maternity, paternity, other.
        -- Uses the same lightweight sign-off model as wastage/adjustments:
        -- the record exists the moment it's logged (it already happened
        -- or was granted), and "approved" is an optional review annotation,
        -- not a gate.
        CREATE TABLE IF NOT EXISTS leave_records (
          id TEXT PRIMARY KEY,
          reference TEXT,
          employee_id TEXT NOT NULL,
          leave_type TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          days REAL NOT NULL,
          reason TEXT,
          approved_by_user_id TEXT,
          approved_by_user_name TEXT,
          approved_at INTEGER,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_leave_records_employee ON leave_records(employee_id);
      `);
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run("leave_ref", "LVE", 1);
    },
  },
  {
    version: 12,
    name: "add_leave_entitlements_and_employee_numbers",
    up: (db) => {
      db.exec(`
        ALTER TABLE employees ADD COLUMN employee_number INTEGER;

        -- Opening balances, manual accruals (e.g. crediting a compensatory
        -- day for 6 consecutive days worked, or a public holiday worked —
        -- there's no attendance/clock-in system in this app to detect
        -- these automatically, so an admin credits them when they know
        -- they apply), and general corrections. Everything needed to
        -- compute Opening/Accrued/Taken/Adjustment/Closing per employee
        -- per leave type without a separate mutable "balance" row that
        -- could drift out of sync.
        CREATE TABLE IF NOT EXISTS leave_balance_adjustments (
          id TEXT PRIMARY KEY,
          reference TEXT,
          employee_id TEXT NOT NULL,
          leave_type TEXT NOT NULL,
          kind TEXT NOT NULL,        -- opening | accrual | adjustment
          days REAL NOT NULL,
          note TEXT,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_leave_bal_adj ON leave_balance_adjustments(employee_id, leave_type);
      `);
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run("leave_balance_ref", "LBA", 1);

      // Backfill employee numbers in order of hire (created_at), so
      // existing staff get low, stable numbers rather than everyone
      // showing NULL until manually edited.
      const existingEmployees = db.prepare("SELECT id FROM employees ORDER BY created_at ASC").all();
      const updateEmpNum = db.prepare("UPDATE employees SET employee_number = ? WHERE id = ?");
      existingEmployees.forEach((e, i) => updateEmpNum.run(i + 1, e.id));

      // "Off Day" is renamed to "Compensatory" to match the new
      // entitlement structure (compensatory days earned for working 6
      // consecutive days) — same concept, clearer terminology.
      db.exec(`UPDATE leave_records SET leave_type = 'compensatory' WHERE leave_type = 'off_day';`);
    },
  },
  {
    version: 13,
    name: "add_hr_personal_employment_payroll_fields",
    up: (db) => {
      db.exec(`
        -- Personal information
        ALTER TABLE employees ADD COLUMN first_name TEXT;
        ALTER TABLE employees ADD COLUMN middle_name TEXT;
        ALTER TABLE employees ADD COLUMN surname TEXT;
        ALTER TABLE employees ADD COLUMN gender TEXT;
        ALTER TABLE employees ADD COLUMN date_of_birth TEXT;
        ALTER TABLE employees ADD COLUMN nationality TEXT;
        ALTER TABLE employees ADD COLUMN id_number TEXT;

        -- Employment details ("Position" reuses the existing role column;
        -- "Date Joined" reuses the existing hire_date column — both
        -- already hold exactly this data, so no need for duplicate
        -- columns, just a relabel in the UI)
        ALTER TABLE employees ADD COLUMN department TEXT;
        ALTER TABLE employees ADD COLUMN supervisor TEXT;
        ALTER TABLE employees ADD COLUMN employment_type TEXT;
        ALTER TABLE employees ADD COLUMN contract_start TEXT;
        ALTER TABLE employees ADD COLUMN contract_end TEXT;
        ALTER TABLE employees ADD COLUMN probation_end TEXT;
        ALTER TABLE employees ADD COLUMN work_location TEXT;
        -- Distinct from the existing 'status' column, which stays as the
        -- simple active/inactive toggle used for list filtering —
        -- employment_status is the richer HR-meaningful status.
        ALTER TABLE employees ADD COLUMN employment_status TEXT;

        -- Payroll ("Basic Salary" reuses pay_rate, "Pay Frequency" reuses
        -- pay_type — same reasoning as above)
        ALTER TABLE employees ADD COLUMN payment_method TEXT;
        ALTER TABLE employees ADD COLUMN nssf_number TEXT;
        ALTER TABLE employees ADD COLUMN tin TEXT;
      `);

      // Best-effort split of the existing single "name" field into
      // first/middle/surname — imperfect for names that don't follow a
      // simple [first] [middle...] [last] pattern, but far more useful
      // than leaving every existing employee's personal info blank.
      // "name" itself is kept as the authoritative full display name
      // (used throughout the rest of the app — leave records, pickers,
      // receipts) and is kept in sync going forward whenever personal
      // info is edited, rather than computed on the fly everywhere.
      const existing = db.prepare("SELECT id, name, status FROM employees").all();
      const updateSplit = db.prepare("UPDATE employees SET first_name = ?, middle_name = ?, surname = ?, employment_status = ? WHERE id = ?");
      for (const e of existing) {
        const parts = (e.name || "").trim().split(/\s+/).filter(Boolean);
        const first = parts[0] || "";
        const surname = parts.length > 1 ? parts[parts.length - 1] : "";
        const middle = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
        updateSplit.run(first || null, middle || null, surname || null, e.status === "active" ? "active" : "terminated", e.id);
      }
    },
  },
  {
    version: 14,
    name: "add_attendance_documents_termination_history",
    up: (db) => {
      db.exec(`
        -- Attendance: who's clocked in, when, and for how long. The
        -- compensatory-day auto-crediting the user asked for is applied
        -- at clock-out time (see the attendance:clockOut handler) rather
        -- than computed here, so this table just holds the raw record.
        CREATE TABLE IF NOT EXISTS attendance_records (
          id TEXT PRIMARY KEY,
          reference TEXT,
          employee_id TEXT NOT NULL,
          date TEXT NOT NULL,
          clock_in INTEGER NOT NULL,
          clock_out INTEGER,
          hours REAL,
          compensatory_credited INTEGER NOT NULL DEFAULT 0,
          note TEXT,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);

        -- Employee document attachments reuse the existing documents
        -- table (same upload/storage mechanism as letterhead/receipt
        -- templates) rather than a parallel one — employee_id is NULL
        -- for the pre-existing venue-level documents, set for
        -- employee-linked ones.
        ALTER TABLE documents ADD COLUMN employee_id TEXT;
        ALTER TABLE documents ADD COLUMN label TEXT;

        -- Termination / exit
        ALTER TABLE employees ADD COLUMN termination_date TEXT;
        ALTER TABLE employees ADD COLUMN termination_reason TEXT;
        ALTER TABLE employees ADD COLUMN exit_notes TEXT;
        ALTER TABLE employees ADD COLUMN final_settlement_amount REAL;
        ALTER TABLE employees ADD COLUMN final_settlement_status TEXT;

        -- Job & compensation history as its own browsable timeline,
        -- distinct from the audit log — promotions, salary changes,
        -- transfers, status changes, and manual notes, each with an
        -- effective date and a from/to value.
        CREATE TABLE IF NOT EXISTS employee_history (
          id TEXT PRIMARY KEY,
          reference TEXT,
          employee_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          effective_date TEXT NOT NULL,
          title TEXT NOT NULL,
          from_value TEXT,
          to_value TEXT,
          notes TEXT,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_employee_history_employee ON employee_history(employee_id);
      `);
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run("attendance_ref", "ATT", 1);
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run("employee_history_ref", "HIST", 1);
    },
  },
  {
    version: 15,
    name: "add_calendar_notes",
    up: (db) => {
      db.exec(`
        -- Mini notes/reminders pinned to a calendar date — separate from
        -- every other event source (reservations, tasks, conference,
        -- maintenance, leave), which the calendar pulls in live rather
        -- than duplicating.
        CREATE TABLE IF NOT EXISTS calendar_notes (
          id TEXT PRIMARY KEY,
          reference TEXT,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          note TEXT,
          remind INTEGER NOT NULL DEFAULT 0,
          user_id TEXT,
          user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_calendar_notes_date ON calendar_notes(date);
      `);
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run("calendar_note_ref", "NOTE", 1);
    },
  },
  {
    version: 16,
    name: "add_user_staff_id",
    up: (db) => {
      // A short, human-typeable identifier for POS login accounts —
      // separate from employees.employee_number, since not every login
      // account has a full HR record and not every employee needs a
      // login. Also fixes a real ambiguity in the old PIN-only login:
      // without a distinct identifier, two accounts sharing a PIN by
      // coincidence would resolve to whichever the database happened to
      // return first.
      db.exec(`ALTER TABLE users ADD COLUMN staff_id TEXT;`);
      const existing = db.prepare("SELECT id FROM users ORDER BY created_at ASC").all();
      const updateStaffId = db.prepare("UPDATE users SET staff_id = ? WHERE id = ?");
      existing.forEach((u, i) => updateStaffId.run(String(i + 1), u.id));
    },
  },
  {
    version: 17,
    name: "add_temporary_role_grants",
    up: (db) => {
      // Time-boxed, per-person role elevation — the "just-in-time access"
      // pattern used by AWS IAM/STS AssumeRole and Azure AD PIM: grant a
      // specific person a specific role for a bounded window, auto-
      // expiring rather than needing to be remembered and manually
      // revoked. Deliberately does NOT touch any existing permission
      // check — requireRole() is extended once, centrally, to also
      // recognize an active grant; every individual handler's own logic
      // stays exactly as it was.
      db.exec(`
        CREATE TABLE IF NOT EXISTS permission_grants (
          id TEXT PRIMARY KEY,
          reference TEXT,
          user_id TEXT NOT NULL,
          granted_role TEXT NOT NULL,
          granted_by_user_id TEXT,
          granted_by_user_name TEXT,
          reason TEXT,
          expires_at INTEGER NOT NULL,
          revoked_at INTEGER,
          revoked_by_user_id TEXT,
          revoked_by_user_name TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_permission_grants_user ON permission_grants(user_id, expires_at);
      `);
      db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, ?)").run("grant_ref", "GRT", 1);
    },
  },
  {
    version: 18,
    name: "scope_grants_to_specific_tiles",
    up: (db) => {
      // Refines v17's whole-role grants down to specific tiles — e.g.
      // grant just Inventory rather than every "manager" capability at
      // once. granted_roles is the underlying set of role(s) actually
      // needed to satisfy the backend's existing checks for the tiles
      // picked (computed server-side from TILE_REQUIRED_ROLES, never
      // trusted from the client); granted_tiles is what's shown on
      // Home. The old single-role column is kept for existing rows but
      // no longer written to.
      db.exec(`
        ALTER TABLE permission_grants ADD COLUMN granted_roles TEXT;
        ALTER TABLE permission_grants ADD COLUMN granted_tiles TEXT;
      `);
      // Best-effort backfill for any grants already made under the old
      // whole-role model: preserve the role, leave tiles empty (the old
      // model didn't track tiles, so there's nothing accurate to fill
      // in — these were whole-role grants and will still work via
      // granted_roles for backend checks, just won't populate specific
      // Home tiles beyond what the person's base role already shows).
      const existing = db.prepare("SELECT id, granted_role FROM permission_grants WHERE granted_role IS NOT NULL").all();
      const update = db.prepare("UPDATE permission_grants SET granted_roles = ?, granted_tiles = ? WHERE id = ?");
      for (const g of existing) update.run(JSON.stringify([g.granted_role]), JSON.stringify([]), g.id);
    },
  },
  {
    version: 19,
    name: "add_purchase_unit_conversion",
    up: (db) => {
      // Lets a stock item be bought in one unit (a 5L jerrycan, a carton
      // of 24) and consumed by recipes in another (ml, pieces) — with an
      // explicit conversion factor between them. Fully backward
      // compatible: both new columns are nullable, and a NULL
      // purchase_unit means "purchase unit = base unit," exactly
      // today's behavior, for every existing item.
      db.exec(`
        ALTER TABLE stock_items ADD COLUMN purchase_unit TEXT;
        ALTER TABLE stock_items ADD COLUMN purchase_to_base_factor REAL;

        -- What was actually typed (e.g. "2 Jerrycans @ $15") is kept
        -- alongside the existing qty/unit_cost columns, which continue
        -- to always mean "in the item's base unit" exactly as before —
        -- nothing that already reads stock_purchases.qty/unit_cost
        -- needs to change or is affected by this migration.
        ALTER TABLE stock_purchases ADD COLUMN entered_qty REAL;
        ALTER TABLE stock_purchases ADD COLUMN entered_unit TEXT;
        ALTER TABLE stock_purchases ADD COLUMN entered_unit_cost REAL;
      `);
    },
  },
  {
    version: 20,
    name: "department_specific_receipt_invoice_prefixes",
    up: (db) => {
      // Restaurant, Accommodation, and Conference receipts previously
      // all drew from one shared "R" sequence (and one shared "INV" for
      // invoices) — there was no way to tell which department a receipt
      // belonged to from its number alone. Splitting into a dedicated
      // sequence per department, each starting fresh at 1, going
      // forward. Deliberately NOT renumbering anything already issued —
      // a reference number is never reassigned once given out (see
      // allocateReference), so every receipt/invoice printed before this
      // migration keeps exactly the number it already has.
      const seed = db.prepare("INSERT OR IGNORE INTO document_sequences (doc_type, prefix, next_number) VALUES (?, ?, 1)");
      seed.run("receipt_restaurant", "RESR");
      seed.run("receipt_accommodation", "ACCR");
      seed.run("receipt_conference", "CNFR");
      seed.run("invoice_restaurant", "RESI");
      seed.run("invoice_accommodation", "ACCI");
      seed.run("invoice_conference", "CNFI");
    },
  },
  {
    version: 21,
    name: "restaurant_dash_prefix_convention",
    up: (db) => {
      // Adopting a new convention for restaurant first — DEPT-DOCTYPE-
      // NUMBER (e.g. RES-RCT-00027) — before rolling it out to the other
      // departments once confirmed. Only the prefix TEXT changes here;
      // next_number is deliberately left untouched so the sequence
      // continues exactly where it was (e.g. if 2 restaurant receipts
      // were already issued as RESR001/RESR002, the 3rd is
      // RES-RCT-00003, not a restart at 1 under the new prefix).
      db.prepare("UPDATE document_sequences SET prefix = 'RES-RCT-' WHERE doc_type = 'receipt_restaurant'").run();
      db.prepare("UPDATE document_sequences SET prefix = 'RES-INV-' WHERE doc_type = 'invoice_restaurant'").run();
    },
  },
  {
    version: 22,
    name: "accommodation_conference_dash_prefix_convention",
    up: (db) => {
      // Same rollout as v21, now for Accommodation and Conference —
      // confirmed working on Restaurant first. Same guarantee: only the
      // prefix text changes, next_number is untouched, so each
      // department's sequence continues exactly where it was.
      db.prepare("UPDATE document_sequences SET prefix = 'ACC-RCT-' WHERE doc_type = 'receipt_accommodation'").run();
      db.prepare("UPDATE document_sequences SET prefix = 'ACC-INV-' WHERE doc_type = 'invoice_accommodation'").run();
      db.prepare("UPDATE document_sequences SET prefix = 'CNF-RCT-' WHERE doc_type = 'receipt_conference'").run();
      db.prepare("UPDATE document_sequences SET prefix = 'CNF-INV-' WHERE doc_type = 'invoice_conference'").run();
    },
  },
  {
    version: 23,
    name: "staff_id_prefixed_format",
    up: (db) => {
      // Reformats existing bare-number staff IDs (e.g. "7") into
      // STAFF007, preserving each person's underlying number so nobody's
      // relative ordering changes — only the format does. Unlike
      // receipt/invoice numbers, a staff ID is a live login credential,
      // not a historical financial record, so bringing existing accounts
      // in line with the new format (rather than leaving a permanent mix
      // of old- and new-style IDs) is the right call here. Existing
      // staff will need to be told their login ID's format changed.
      const rows = db.prepare("SELECT id, staff_id FROM users WHERE staff_id IS NOT NULL AND staff_id NOT LIKE 'STAFF%'").all();
      const update = db.prepare("UPDATE users SET staff_id = ? WHERE id = ?");
      for (const r of rows) {
        const n = parseInt(r.staff_id, 10);
        if (Number.isFinite(n)) update.run(`STAFF${String(n).padStart(3, "0")}`, r.id);
      }
      // Seed (or correct) the sequence so the next NEW account continues
      // after the highest number now in use, rather than colliding with
      // or reusing an existing one.
      const maxN = db.prepare("SELECT MAX(CAST(SUBSTR(staff_id, 6) AS INTEGER)) AS m FROM users WHERE staff_id LIKE 'STAFF%'").get().m || 0;
      db.prepare(`
        INSERT INTO document_sequences (doc_type, prefix, next_number) VALUES ('staff_id', 'STAFF', ?)
        ON CONFLICT(doc_type) DO UPDATE SET next_number = excluded.next_number
      `).run(maxN + 1);
    },
  },
  {
    version: 24,
    name: "staff_id_drop_prefix",
    up: (db) => {
      // Dropping the "STAFF" prefix — plain zero-padded number instead
      // (STAFF007 -> 007). Preserves each account's underlying number;
      // only the prefix text is removed. Existing staff will again need
      // to be told their login ID's format changed.
      const rows = db.prepare("SELECT id, staff_id FROM users WHERE staff_id LIKE 'STAFF%'").all();
      const update = db.prepare("UPDATE users SET staff_id = ? WHERE id = ?");
      for (const r of rows) {
        const n = parseInt(r.staff_id.slice(5), 10);
        if (Number.isFinite(n)) update.run(String(n).padStart(3, "0"), r.id);
      }
      db.prepare("UPDATE document_sequences SET prefix = '' WHERE doc_type = 'staff_id'").run();
    },
  },
];

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at INTEGER NOT NULL
  );
`);

const appliedMigration = db.prepare("SELECT MAX(version) AS version FROM schema_migrations").get();
let currentSchemaVersion = Number(appliedMigration?.version || 0);

if (currentSchemaVersion === 0) {
  // Brand-new database, or an existing one from before schema versioning
  // existed. Either way the baseline schema above has already been
  // ensured with CREATE TABLE IF NOT EXISTS, so it's safe to mark it as
  // version 1 without touching or rebuilding anything.
  db.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(1, "baseline", Date.now());
  currentSchemaVersion = 1;
}

// Errors here used to be thrown raw, which crashes into Electron's own
// default "Uncaught Exception" dialog before any window exists — a
// scary, unhelpful raw stack trace on some platforms, and apparently no
// visible dialog at all on others (default crash handling isn't
// guaranteed consistent across macOS/Windows this early in startup).
// dialog.showErrorBox works safely before the app is "ready" on every
// platform, so failures here now always show the same clear message.
//
// The "app is older than the data" case is checked and exited on its
// own, deliberately outside any try/catch below it — app.exit() ends
// the process immediately in real Electron, but keeping this path
// structurally separate means there's no way a catch block below could
// ever see it and show a second, confusing dialog on top of the first.
if (currentSchemaVersion > CURRENT_SCHEMA_VERSION) {
  // The data on this computer was already upgraded by a NEWER copy of
  // this app than the one currently installed — e.g. a newer build was
  // run here before, and now an older installer/build is being run
  // against that same data. Refusing to run an older app against newer
  // data avoids silently misreading or corrupting it; this is a
  // "please update the app" situation, not a broken database.
  dialog.showErrorBox(
    "G2 POS needs to be updated",
    `This copy of G2 POS is older than the data already saved on this computer (data is at version ${currentSchemaVersion}; this copy only supports up to version ${CURRENT_SCHEMA_VERSION}).\n\nPlease install the latest version of G2 POS. Nothing on this computer has been changed — your data is untouched.`
  );
  app.exit(1);
} else {
  try {
    const migrationsByVersion = new Map(MIGRATIONS.map((m) => [m.version, m]));
    for (let version = currentSchemaVersion + 1; version <= CURRENT_SCHEMA_VERSION; version += 1) {
      const migration = migrationsByVersion.get(version);
      if (!migration) throw new Error(`Missing database migration for schema version ${version}`);
      const runMigration = db.transaction(() => {
        migration.up(db);
        db.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.name, Date.now());
      });
      runMigration();
      currentSchemaVersion = version;
    }
    if (currentSchemaVersion !== CURRENT_SCHEMA_VERSION) {
      throw new Error(`Database schema ended up at version ${currentSchemaVersion} after migrating, expected ${CURRENT_SCHEMA_VERSION}`);
    }
  } catch (err) {
    dialog.showErrorBox(
      "G2 POS couldn't start",
      `Something went wrong preparing the database:\n\n${err.message}\n\nYour data has not been modified. Please contact support with this exact message before trying again.`
    );
    app.exit(1);
  }
}

/* ------------------------------------------------------------------ */
/* Terminal identity                                                    */
/* ------------------------------------------------------------------ */
let terminalId = db.prepare("SELECT id FROM terminals ORDER BY first_seen ASC LIMIT 1").get()?.id;
if (!terminalId) {
  terminalId = uid("term");
  db.prepare("INSERT INTO terminals (id, name, first_seen, last_seen) VALUES (?, ?, ?, ?)")
    .run(terminalId, "Terminal 1", Date.now(), Date.now());
} else {
  db.prepare("UPDATE terminals SET last_seen = ? WHERE id = ?").run(Date.now(), terminalId);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function hashPin(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 64).toString("hex");
}
function logAudit({ userId, userName, action, entityType, entityId, details }) {
  db.prepare(`
    INSERT INTO audit_log (id, user_id, user_name, action, entity_type, entity_id, details, terminal_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uid("aud"), userId || null, userName || null, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, terminalId, Date.now());
}

// Rounds to whole cents — mirrors roundMoney() in the renderer, so cost
// snapshots and weighted-average costing never drift from what's shown.
const roundMoneyServer = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
// Deliberately NOT the same as roundMoneyServer. A per-base-unit cost
// (e.g. cost per ml, after converting from a cost per 5L jerrycan) can
// legitimately be a small fraction of a cent — rounding that to 2dp like
// a currency total would silently floor it to zero. Six decimal places
// keeps real precision for weighted-average cost_per_unit while still
// killing floating-point noise. Money *totals* (what's actually shown
// on a receipt) still use roundMoneyServer, unchanged.
const roundUnitCostServer = (n) => Math.round((n + Number.EPSILON) * 1e6) / 1e6;
// Similarly, converted quantities (purchase-unit qty × factor) need more
// than 2 decimal places of precision for the same reason.
const roundQtyServer = (n) => Math.round((n + Number.EPSILON) * 1e4) / 1e4;

// Re-checks the acting user's role directly against the database rather
// than trusting the role the renderer happened to send — the renderer's
// `currentUser` is just in-memory state, not a verified session, so
// sensitive actions (recipes, ingredient costs, stock corrections, staff
// accounts, restoring a backup) confirm the real, current role here.
function requireRole(actingUser, allowedRoles) {
  if (!actingUser?.id) throw new Error("You need to be logged in to do that.");
  const user = db.prepare("SELECT role, active FROM users WHERE id = ?").get(actingUser.id);
  if (!user || !user.active) throw new Error("Your account isn't active — ask an admin for help.");
  if (allowedRoles.includes(user.role)) return user;

  // Base role didn't qualify on its own — check for an active, unexpired,
  // unrevoked temporary grant covering one of the allowed roles. Grants
  // are tile-scoped (e.g. "just Inventory"), but what they actually
  // unlock at the permission level is always one of the same role names
  // every other check already uses — granted_roles is the server-
  // computed set of roles that satisfies the tiles someone was granted.
  // This is the only place grants are consulted; every other permission
  // check in this file is unaware of them and stays exactly as written.
  const activeGrants = db.prepare(`
    SELECT id, granted_roles FROM permission_grants WHERE user_id = ? AND expires_at > ? AND revoked_at IS NULL
  `).all(actingUser.id, Date.now());
  for (const g of activeGrants) {
    let roles = [];
    try { roles = JSON.parse(g.granted_roles || "[]"); } catch { roles = []; }
    const match = roles.find((r) => allowedRoles.includes(r));
    if (match) {
      logAudit({ userId: actingUser.id, userName: actingUser.name, action: "action_via_temporary_grant", entityType: "permission_grant", entityId: g.id, details: { grantedRole: match } });
      return user;
    }
  }

  throw new Error("You don't have permission to do that — ask an admin.");
}

// Which underlying role(s) actually unlock each Home tile's backend-
// gated actions — this is the canonical, server-side source of truth
// used to compute what a tile-scoped grant needs to satisfy. Tiles not
// listed here have no dedicated backend permission check today (their
// access is effectively already open), so granting them is purely
// visual — showing the tile, nothing more.
const TILE_REQUIRED_ROLES = {
  inventory: ["manager"],
  conference: ["manager"],
  runningcosts: ["manager"],
  maintenance: ["manager"],
  hr: ["hr"],
  attendance: ["manager", "hr"],
};

// Roles that can be temporarily granted to a specific person for a
// bounded time. "admin" is deliberately excluded — full system access
// (backups, user accounts, deleting core data) is too broad a thing to
// hand out temporarily; this mechanism is for sharing operational
// workload (e.g. "let a cashier populate recipes for the afternoon"),
// not for standing in for an administrator.
const GRANTABLE_ROLES = ["manager", "hr", "cashier", "receptionist", "staff"];

ipcMain.handle("grants:list", (_e, { actingUser }) => {
  requireRole(actingUser, ["admin"]);
  return db.prepare(`
    SELECT pg.*, u.name AS user_name, u.staff_id AS user_staff_id
    FROM permission_grants pg JOIN users u ON u.id = pg.user_id
    ORDER BY pg.created_at DESC LIMIT 200
  `).all();
});

// Grants are requested as a set of Home tiles, not a role — the role(s)
// actually needed to back those tiles are computed here, server-side,
// from TILE_REQUIRED_ROLES, never trusted from the client. Tiles with no
// entry in that map need no backend elevation at all; picking only those
// produces a grant that's purely visual (shows tiles, unlocks nothing
// extra on the backend, since there was nothing gated to unlock).
ipcMain.handle("grants:create", (_e, { userId, tiles, durationMinutes, reason, actingUser }) => {
  requireRole(actingUser, ["admin"]);
  if (!Array.isArray(tiles) || tiles.length === 0) throw new Error("Select at least one tile to grant.");
  const targetUser = db.prepare("SELECT id, active FROM users WHERE id = ?").get(userId);
  if (!targetUser || !targetUser.active) throw new Error("That account no longer exists or isn't active.");
  if (!durationMinutes || durationMinutes <= 0) throw new Error("Duration must be greater than zero.");
  const grantedRoles = [...new Set(tiles.flatMap((t) => TILE_REQUIRED_ROLES[t] || []))].filter((r) => GRANTABLE_ROLES.includes(r));
  const expiresAt = Date.now() + durationMinutes * 60000;
  const id = uid("grt");
  const reference = allocateReference("grant_ref");
  db.prepare(`
    INSERT INTO permission_grants (id, reference, user_id, granted_roles, granted_tiles, granted_by_user_id, granted_by_user_name, reason, expires_at, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, reference, userId, JSON.stringify(grantedRoles), JSON.stringify(tiles), actingUser?.id || null, actingUser?.name || null, reason || null, expiresAt, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "permission_granted", entityType: "permission_grant", entityId: id, details: { targetUserId: userId, tiles, grantedRoles, expiresAt, reason } });
  return { id, reference, expiresAt };
});

ipcMain.handle("grants:revoke", (_e, { id, actingUser }) => {
  requireRole(actingUser, ["admin"]);
  db.prepare("UPDATE permission_grants SET revoked_at = ?, revoked_by_user_id = ?, revoked_by_user_name = ? WHERE id = ?")
    .run(Date.now(), actingUser?.id || null, actingUser?.name || null, id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "permission_grant_revoked", entityType: "permission_grant", entityId: id });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* IPC: generic kv store (settings / menu / tables / rooms)            */
/* ------------------------------------------------------------------ */
const stmtGet = db.prepare("SELECT value FROM kv_store WHERE key = ?");
const stmtSet = db.prepare(`
  INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`);
const stmtDelete = db.prepare("DELETE FROM kv_store WHERE key = ?");
const stmtList = db.prepare("SELECT key FROM kv_store WHERE key LIKE ?");

ipcMain.handle("store:get", (_e, key) => { const r = stmtGet.get(key); return r ? { key, value: r.value } : null; });
ipcMain.handle("store:set", (_e, key, value) => { stmtSet.run(key, value, Date.now()); return { key, value }; });
ipcMain.handle("store:delete", (_e, key) => { stmtDelete.run(key); return { key, deleted: true }; });
ipcMain.handle("store:list", (_e, prefix) => ({ keys: stmtList.all(`${prefix || ""}%`).map((r) => r.key) }));

/* ------------------------------------------------------------------ */
/* IPC: users / auth                                                    */
/* ------------------------------------------------------------------ */
ipcMain.handle("users:list", () => db.prepare("SELECT id, staff_id, name, role, active, created_at FROM users ORDER BY created_at ASC").all());

ipcMain.handle("users:hasAny", () => db.prepare("SELECT COUNT(*) c FROM users").get().c > 0);

ipcMain.handle("users:create", (_e, { name, pin, role, actingUser }) => {
  // The very first account (initial setup, nobody logged in yet) is
  // exempt — after that, only an admin can create new staff accounts.
  const hasAny = db.prepare("SELECT COUNT(*) c FROM users").get().c > 0;
  if (hasAny) requireRole(actingUser, ["admin"]);
  const salt = crypto.randomBytes(16).toString("hex");
  const id = uid("usr");
  const staffId = allocateReference("staff_id", 3);
  db.prepare("INSERT INTO users (id, staff_id, name, role, pin_hash, pin_salt, active, created_at) VALUES (?,?,?,?,?,?,1,?)")
    .run(id, staffId, name, role, hashPin(pin, salt), salt, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "user_created", entityType: "user", entityId: id, details: { name, role, staffId } });
  return { id, staffId, name, role, active: 1 };
});

ipcMain.handle("users:setActive", (_e, { id, active, actingUser }) => {
  requireRole(actingUser, ["admin"]);
  db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: active ? "user_reactivated" : "user_deactivated", entityType: "user", entityId: id });
  return true;
});

// Admin-initiated PIN reset — the practical "forgot my PIN" answer for a
// local, offline-capable app: no email/SMS involved, just another admin
// who's already trusted to manage staff accounts.
ipcMain.handle("users:resetPin", (_e, { targetUserId, newPin, actingUser }) => {
  requireRole(actingUser, ["admin"]);
  if (!newPin || String(newPin).length < 4) throw new Error("PIN must be at least 4 digits.");
  const target = db.prepare("SELECT id, name FROM users WHERE id = ?").get(targetUserId);
  if (!target) throw new Error("That account no longer exists.");
  const salt = crypto.randomBytes(16).toString("hex");
  db.prepare("UPDATE users SET pin_hash = ?, pin_salt = ? WHERE id = ?").run(hashPin(newPin, salt), salt, targetUserId);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "pin_reset", entityType: "user", entityId: targetUserId, details: { targetName: target.name } });
  return { ok: true };
});

ipcMain.handle("users:login", (_e, { staffId, pin }) => {
  const u = db.prepare("SELECT * FROM users WHERE staff_id = ? AND active = 1").get(String(staffId).trim());
  if (!u || hashPin(pin, u.pin_salt) !== u.pin_hash) return null;
  logAudit({ userId: u.id, userName: u.name, action: "login", entityType: "user", entityId: u.id });
  const grants = db.prepare("SELECT granted_tiles, expires_at FROM permission_grants WHERE user_id = ? AND expires_at > ? AND revoked_at IS NULL").all(u.id, Date.now());
  const grantedTiles = [...new Set(grants.flatMap((g) => { try { return JSON.parse(g.granted_tiles || "[]"); } catch { return []; } }))];
  return {
    id: u.id, staffId: u.staff_id, name: u.name, role: u.role,
    grantedTiles,
    grantExpiresAt: grants.length ? Math.min(...grants.map((g) => g.expires_at)) : null,
  };
});

/* ------------------------------------------------------------------ */
/* IPC: transactional ledger (restaurant bills)                        */
/* ------------------------------------------------------------------ */
const insertTxn = db.prepare(`
  INSERT INTO transactions (id, kind, ref_label, guest_name, subtotal, tax, service, total, payment_method, room_charged, status, receipt_ref, user_id, user_name, terminal_id, created_at, closed_at)
  VALUES (@id, @kind, @refLabel, @guestName, @subtotal, @tax, @service, @total, @paymentMethod, @roomCharged, @status, @receiptRef, @userId, @userName, @terminalId, @createdAt, @closedAt)
`);
const insertTxnItem = db.prepare("INSERT INTO transaction_items (id, transaction_id, menu_item_id, name, qty, price, unit_cost, recipe_version_id) VALUES (?,?,?,?,?,?,?,?)");
// IMPORTANT: filtered to the current recipe version only. Recipes can have
// multiple historical versions in this table now — without this filter,
// editing a recipe would cause both the old and new version's ingredients
// to be consumed on the next sale.
const getRecipeLines = db.prepare(`
  SELECT r.stock_item_id, r.qty_per_serving
  FROM recipes r JOIN recipe_versions rv ON rv.id = r.recipe_version_id
  WHERE rv.menu_item_id = ? AND rv.is_current = 1
`);
// What the current recipe version costs to make one serving, and which
// version that is — snapshotted onto the sale itself so it's frozen at
// the moment of sale rather than recomputed later from whatever the
// recipe happens to be by the time someone looks at a report.
const getCurrentRecipeCost = db.prepare(`
  SELECT rv.id AS version_id, ROUND(SUM(r.qty_per_serving * COALESCE(si.cost_per_unit, 0)), 2) AS cost
  FROM recipe_versions rv
  LEFT JOIN recipes r ON r.recipe_version_id = rv.id
  LEFT JOIN stock_items si ON si.id = r.stock_item_id
  WHERE rv.menu_item_id = ? AND rv.is_current = 1
  GROUP BY rv.id
`);
const shiftStock = db.prepare("UPDATE stock_items SET current_qty = current_qty - ? WHERE id = ?");
const insertConsumption = db.prepare("INSERT INTO stock_consumption_log (id, stock_item_id, qty, reason, ref_transaction_id, created_at) VALUES (?,?,?,?,?,?)");

// Persistent, sequential, never-reused document reference numbers
// (R001, R002... for receipts; INV001, INV002... for invoices). Wrapped
// in its own db.transaction so the increment is atomic even under
// concurrent calls; better-sqlite3 nests this safely inside a caller's
// own transaction via a SAVEPOINT.
// Reads the venue's configured document-number padding width (e.g. 5 →
// "00027"), used for document types that have opted into the new
// DEPT-DOCTYPE-NUMBER convention. Read fresh on every call rather than
// cached, so changing the setting takes effect on the very next
// document — but it never touches numbers already issued, since
// allocateReference bakes the fully-formatted string in once, at the
// moment of issuance, exactly like the prefix itself.
function documentNumberDigits() {
  const row = stmtGet.get("pos:settings");
  if (!row) return 5;
  try {
    const s = JSON.parse(row.value);
    const n = parseInt(s.documentNumberDigits, 10);
    return Number.isFinite(n) && n >= 1 && n <= 10 ? n : 5;
  } catch {
    return 5;
  }
}

const allocateReference = db.transaction((docType, digits = 3) => {
  const row = db.prepare("SELECT prefix, next_number FROM document_sequences WHERE doc_type = ?").get(docType);
  if (!row) throw new Error(`Unknown document sequence: ${docType}`);
  db.prepare("UPDATE document_sequences SET next_number = next_number + 1 WHERE doc_type = ?").run(docType);
  return `${row.prefix}${String(row.next_number).padStart(digits, "0")}`;
});

// direction: false = consume for a sale (stock goes down), true = reverse a correction (stock goes back up)
function applyConsumption(transactionId, items, reverse) {
  for (const it of items) {
    if (!it.menu_item_id) continue;
    const lines = getRecipeLines.all(it.menu_item_id);
    for (const line of lines) {
      const baseQty = line.qty_per_serving * it.qty;
      const delta = reverse ? -baseQty : baseQty;
      shiftStock.run(delta, line.stock_item_id);
      insertConsumption.run(uid("cons"), line.stock_item_id, delta, reverse ? "reversal" : "sale", transactionId, Date.now());
    }
  }
}

ipcMain.handle("ledger:recordTransaction", (_e, payload) => {
  let receiptRef = null;
  const tx = db.transaction((p) => {
    // A reference is issued the moment a transaction is finalized — paid
    // or void both count, since both are terminal outcomes of a ticket
    // that was opened. Once issued, a number is never freed or reused.
    // Restaurant and Accommodation each draw from their own sequence
    // (see migration v20) so a reference number identifies its
    // department at a glance, rather than sharing one global sequence.
    receiptRef = allocateReference(p.kind === "restaurant" ? "receipt_restaurant" : "receipt_accommodation", documentNumberDigits());
    insertTxn.run({
      id: p.id, kind: p.kind, refLabel: p.refLabel || null, guestName: p.guestName || null,
      subtotal: p.subtotal, tax: p.tax, service: p.service, total: p.total,
      paymentMethod: p.paymentMethod || null, roomCharged: p.roomCharged || null,
      status: p.status, receiptRef, userId: p.userId || null, userName: p.userName || null,
      terminalId, createdAt: p.createdAt, closedAt: p.closedAt,
    });
    for (const it of p.items) {
      const recipeCost = it.menuItemId ? getCurrentRecipeCost.get(it.menuItemId) : null;
      insertTxnItem.run(
        uid("ti"), p.id, it.menuItemId || null, it.name, it.qty, it.amount != null ? it.amount / it.qty : it.price,
        recipeCost?.cost ?? null, recipeCost?.version_id ?? null
      );
    }
    if (p.status === "paid" && p.kind === "restaurant") {
      applyConsumption(p.id, p.items.map((it) => ({ menu_item_id: it.menuItemId, qty: it.qty })), false);
    }
    logAudit({ userId: p.userId, userName: p.userName, action: p.status === "void" ? "transaction_void" : "transaction_recorded", entityType: "transaction", entityId: p.id, details: { total: p.total, kind: p.kind, receiptRef } });
  });
  tx(payload);
  return { ok: true, receiptRef };
});

ipcMain.handle("ledger:ensureInvoiceRef", (_e, { transactionId }) => {
  const existing = db.prepare("SELECT invoice_ref, kind FROM transactions WHERE id = ?").get(transactionId);
  if (!existing) return { invoiceRef: null };
  if (existing.invoice_ref) return { invoiceRef: existing.invoice_ref };
  const invoiceDocType = existing.kind === "restaurant" ? "invoice_restaurant" : existing.kind === "conference" ? "invoice_conference" : "invoice_accommodation";
  const invoiceRef = allocateReference(invoiceDocType, documentNumberDigits());
  db.prepare("UPDATE transactions SET invoice_ref = ? WHERE id = ?").run(invoiceRef, transactionId);
  logAudit({ action: "invoice_reference_assigned", entityType: "transaction", entityId: transactionId, details: { invoiceRef } });
  return { invoiceRef };
});

ipcMain.handle("ledger:voidTransaction", (_e, { id, reason, actingUser }) => {
  const tx = db.transaction(() => {
    const prev = db.prepare("SELECT status, kind FROM transactions WHERE id = ?").get(id);
    db.prepare("UPDATE transactions SET status = 'void', void_reason = ? WHERE id = ?").run(reason, id);
    if (prev && prev.status === "paid" && prev.kind === "restaurant") {
      const items = db.prepare("SELECT menu_item_id, qty FROM transaction_items WHERE transaction_id = ?").all(id);
      applyConsumption(id, items, true);
    }
    logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "transaction_corrected_void", entityType: "transaction", entityId: id, details: { reason } });
  });
  tx();
  return { ok: true };
});

ipcMain.handle("ledger:listRange", (_e, { from, to, kind }) => {
  const rows = kind
    ? db.prepare("SELECT * FROM transactions WHERE closed_at BETWEEN ? AND ? AND kind = ? ORDER BY closed_at DESC").all(from, to, kind)
    : db.prepare("SELECT * FROM transactions WHERE closed_at BETWEEN ? AND ? ORDER BY closed_at DESC").all(from, to);
  const itemsStmt = db.prepare("SELECT name, qty, price, unit_cost FROM transaction_items WHERE transaction_id = ?");
  return rows.map((r) => ({ ...r, items: itemsStmt.all(r.id) }));
});

ipcMain.handle("ledger:summary", (_e, { from, to }) => {
  const rows = db.prepare("SELECT kind, payment_method, total FROM transactions WHERE closed_at BETWEEN ? AND ? AND status = 'paid'").all(from, to);
  const summary = { restaurantTotal: 0, roomTotal: 0, conferenceTotal: 0, cash: 0, card: 0, roomCharge: 0, count: rows.length };
  for (const r of rows) {
    if (r.kind === "restaurant") summary.restaurantTotal += r.total;
    else if (r.kind === "accommodation") summary.roomTotal += r.total;
    else if (r.kind === "conference") summary.conferenceTotal += r.total;
    if (r.payment_method === "cash") summary.cash += r.total;
    else if (r.payment_method === "card") summary.card += r.total;
    else if (r.payment_method === "room") summary.roomCharge += r.total;
  }
  return summary;
});

/* ------------------------------------------------------------------ */
/* IPC: food-cost & profitability reporting (Phase 3)                   */
/* ------------------------------------------------------------------ */

// Per-dish food cost %, using the COGS snapshot Phase 1 stores on every
// sale — never recomputed from the current recipe, so this always
// reflects what dishes actually cost at the time they were sold.
ipcMain.handle("ledger:foodCostReport", (_e, { from, to }) => {
  const rows = db.prepare(`
    SELECT ti.menu_item_id, ti.name, SUM(ti.qty) AS qtySold, ROUND(SUM(ti.price * ti.qty), 2) AS revenue,
      ROUND(SUM(COALESCE(ti.unit_cost, 0) * ti.qty), 2) AS cogs,
      SUM(CASE WHEN ti.unit_cost IS NULL THEN ti.qty ELSE 0 END) AS qtyMissingCost
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.kind = 'restaurant' AND t.status = 'paid' AND t.closed_at BETWEEN ? AND ?
    GROUP BY ti.menu_item_id, ti.name
    ORDER BY revenue DESC
  `).all(from, to);
  return rows.map((r) => ({ ...r, foodCostPct: r.revenue > 0 ? roundMoneyServer((r.cogs / r.revenue) * 100) : null }));
});

// Raw per-transaction revenue/COGS for the range — day-bucketing happens
// in the renderer using local calendar dates (not SQLite's UTC-based
// date functions), consistent with how every other date in this app
// is handled.
ipcMain.handle("ledger:profitSeries", (_e, { from, to }) => db.prepare(`
  SELECT t.id, t.closed_at, ROUND(SUM(ti.price * ti.qty), 2) AS revenue, ROUND(SUM(COALESCE(ti.unit_cost, 0) * ti.qty), 2) AS cogs
  FROM transactions t JOIN transaction_items ti ON ti.transaction_id = t.id
  WHERE t.kind = 'restaurant' AND t.status = 'paid' AND t.closed_at BETWEEN ? AND ?
  GROUP BY t.id
`).all(from, to));

ipcMain.handle("stock:inventoryValue", () => {
  const row = db.prepare("SELECT ROUND(SUM(current_qty * COALESCE(cost_per_unit, 0)), 2) AS value FROM stock_items").get();
  return { value: row.value || 0 };
});

ipcMain.handle("wastage:byItem", (_e, { from, to }) => db.prepare(`
  SELECT si.name, si.unit, SUM(w.qty) AS qty, ROUND(SUM(w.cost_impact), 2) AS cost
  FROM wastage_log w JOIN stock_items si ON si.id = w.stock_item_id
  WHERE w.created_at BETWEEN ? AND ? AND w.reason NOT IN ('staff_meal', 'complimentary')
  GROUP BY w.stock_item_id ORDER BY cost DESC LIMIT 10
`).all(from, to));

ipcMain.handle("stockCounts:varianceTrend", () => db.prepare(`
  SELECT sc.id, sc.finalized_at, sc.note,
    ROUND(SUM(ABS(COALESCE(sci.cost_impact, 0))), 2) AS totalAbsVarianceCost,
    ROUND(SUM(COALESCE(sci.cost_impact, 0)), 2) AS netVarianceCost
  FROM stock_counts sc JOIN stock_count_items sci ON sci.stock_count_id = sc.id
  WHERE sc.status = 'finalized'
  GROUP BY sc.id ORDER BY sc.finalized_at DESC LIMIT 20
`).all());

ipcMain.handle("stockCounts:varianceByItem", () => db.prepare(`
  SELECT si.name, si.unit, COUNT(*) AS timesCounted,
    ROUND(SUM(ABS(COALESCE(sci.variance, 0))), 2) AS totalAbsVarianceQty,
    ROUND(SUM(COALESCE(sci.cost_impact, 0)), 2) AS totalCostImpact
  FROM stock_count_items sci
  JOIN stock_items si ON si.id = sci.stock_item_id
  JOIN stock_counts sc ON sc.id = sci.stock_count_id
  WHERE sc.status = 'finalized' AND sci.counted_qty IS NOT NULL
  GROUP BY sci.stock_item_id ORDER BY totalAbsVarianceQty DESC LIMIT 10
`).all());

/* ------------------------------------------------------------------ */
/* IPC: business dashboard (revenue trend, section mix, income/expense) */
/* ------------------------------------------------------------------ */

// Every paid transaction across all three revenue streams (restaurant,
// accommodation, conference) — the renderer buckets these by local
// day/week/month/year for the trend line, and sums by kind for the
// section-comparison bar/pie charts.
ipcMain.handle("dashboard:revenueRows", (_e, { from, to }) => db.prepare(`
  SELECT kind, total, closed_at FROM transactions WHERE status = 'paid' AND closed_at BETWEEN ? AND ?
`).all(from, to));

// Operating expenses: utility/operating bills plus completed maintenance
// work. Dates here are YYYY-MM-DD strings (unlike transactions'
// epoch-ms), so `from`/`to` — epoch-ms, matching every other report in
// this app — are converted to local date strings before querying.
ipcMain.handle("dashboard:expenseRows", (_e, { from, to }) => {
  const fromStr = toLocalDateStrServer(from);
  const toStr = toLocalDateStrServer(to);
  const running = db.prepare("SELECT amount, expense_date AS date FROM running_costs WHERE expense_date BETWEEN ? AND ?").all(fromStr, toStr);
  const maintenance = db.prepare(`
    SELECT cost AS amount, COALESCE(completed_date, scheduled_date) AS date
    FROM maintenance_records WHERE status = 'completed' AND COALESCE(completed_date, scheduled_date) BETWEEN ? AND ?
  `).all(fromStr, toStr);
  return [...running, ...maintenance.map((m) => ({ amount: m.amount || 0, date: m.date }))];
});

// Waste, staff meals, and complimentary meals are real costs too — food
// that left the building without generating revenue — and previously
// weren't reflected anywhere in the Dashboard's net profit at all. Dates
// here are already epoch-ms (unlike running_costs/maintenance above),
// so no date-string conversion is needed.
ipcMain.handle("dashboard:internalCostRows", (_e, { from, to }) => db.prepare(`
  SELECT created_at, cost_impact AS amount FROM wastage_log WHERE created_at BETWEEN ? AND ?
`).all(from, to));

// Money spent buying stock in a period — distinct from Cost of Goods
// Sold (ledger:profitSeries), which recognizes cost only as items are
// actually sold or wasted. This is the cash-outflow view: what was
// actually paid to suppliers in this window, regardless of whether
// that stock has been used yet. Both are legitimate things to look at;
// they answer different questions and are surfaced separately in the
// dashboard rather than combined, so neither obscures the other.
ipcMain.handle("dashboard:stockPurchaseRows", (_e, { from, to }) => db.prepare(`
  SELECT sp.purchased_at AS created_at, sp.total_cost AS amount, si.name AS item_name
  FROM stock_purchases sp JOIN stock_items si ON si.id = sp.stock_item_id
  WHERE sp.purchased_at BETWEEN ? AND ? AND sp.total_cost IS NOT NULL
`).all(from, to));

// A single combined alerts feed — price jumps, dishes over their target
// food-cost %, stock count variance beyond threshold, and low stock.
// Thresholds are passed in from the renderer (which owns where they're
// stored) rather than assumed here, so this handler stays a pure query.
ipcMain.handle("alerts:list", (_e, { priceJumpPct = 15, foodCostTargetPct = 35, varianceQtyPct = 10, days = 30 } = {}) => {
  const since = Date.now() - days * 86400000;
  const alerts = [];

  const priceRows = db.prepare(`
    SELECT p.unit_cost, p.purchased_at, si.name AS item_name, si.unit,
      (SELECT unit_cost FROM stock_purchases p2 WHERE p2.stock_item_id = p.stock_item_id AND p2.purchased_at < p.purchased_at AND p2.unit_cost IS NOT NULL ORDER BY p2.purchased_at DESC LIMIT 1) AS prev_unit_cost
    FROM stock_purchases p JOIN stock_items si ON si.id = p.stock_item_id
    WHERE p.purchased_at >= ? AND p.unit_cost IS NOT NULL
  `).all(since);
  for (const r of priceRows) {
    if (r.prev_unit_cost == null || r.prev_unit_cost <= 0) continue;
    const pct = ((r.unit_cost - r.prev_unit_cost) / r.prev_unit_cost) * 100;
    if (Math.abs(pct) >= priceJumpPct) {
      alerts.push({ type: "price_jump", severity: pct > 0 ? "warning" : "info", message: `${r.item_name} price ${pct > 0 ? "rose" : "fell"} ${Math.abs(pct).toFixed(0)}% (now ${r.unit_cost}/${r.unit})`, date: r.purchased_at });
    }
  }

  const foodRows = db.prepare(`
    SELECT ti.name, SUM(ti.qty) qty, SUM(ti.price * ti.qty) revenue, SUM(COALESCE(ti.unit_cost, 0) * ti.qty) cogs
    FROM transaction_items ti JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.kind = 'restaurant' AND t.status = 'paid' AND t.closed_at >= ? AND ti.menu_item_id IS NOT NULL
    GROUP BY ti.menu_item_id, ti.name
  `).all(since);
  for (const r of foodRows) {
    if (r.revenue <= 0) continue;
    const pct = (r.cogs / r.revenue) * 100;
    if (pct >= foodCostTargetPct) {
      alerts.push({ type: "food_cost", severity: "warning", message: `${r.name} food cost is ${pct.toFixed(1)}% (target ${foodCostTargetPct}%)`, date: Date.now() });
    }
  }

  const varRows = db.prepare(`
    SELECT si.name AS item_name, si.unit, sci.theoretical_qty, sci.variance, sc.finalized_at
    FROM stock_count_items sci
    JOIN stock_items si ON si.id = sci.stock_item_id
    JOIN stock_counts sc ON sc.id = sci.stock_count_id
    WHERE sc.status = 'finalized' AND sc.finalized_at >= ? AND sci.counted_qty IS NOT NULL AND sci.theoretical_qty > 0
  `).all(since);
  for (const r of varRows) {
    const pct = (Math.abs(r.variance) / r.theoretical_qty) * 100;
    if (pct >= varianceQtyPct) {
      alerts.push({ type: "variance", severity: "danger", message: `${r.item_name} varied ${r.variance > 0 ? "+" : ""}${r.variance} ${r.unit} (${pct.toFixed(0)}% off) in last count`, date: r.finalized_at });
    }
  }

  const lowStock = db.prepare("SELECT name, unit, current_qty, reorder_level FROM stock_items WHERE current_qty <= reorder_level").all();
  for (const r of lowStock) {
    alerts.push({ type: "low_stock", severity: "danger", message: `${r.name} is low: ${r.current_qty} ${r.unit} (reorder at ${r.reorder_level})`, date: Date.now() });
  }

  return alerts.sort((a, b) => b.date - a.date);
});

ipcMain.handle("ledger:lookup", (_e, { query }) => {
  const like = `%${query}%`;
  const rows = db.prepare(`
    SELECT * FROM transactions
    WHERE id LIKE ? OR ref_label LIKE ? OR guest_name LIKE ? OR room_charged LIKE ?
    ORDER BY closed_at DESC LIMIT 100
  `).all(like, like, like, like);
  const itemsStmt = db.prepare("SELECT name, qty, price FROM transaction_items WHERE transaction_id = ?");
  return rows.map((r) => ({ ...r, items: itemsStmt.all(r.id) }));
});

/* ------------------------------------------------------------------ */
/* IPC: audit log                                                       */
/* ------------------------------------------------------------------ */
ipcMain.handle("audit:list", (_e, { limit }) => db.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?").all(limit || 200));
ipcMain.handle("audit:write", (_e, entry) => { logAudit(entry); return { ok: true }; });

/* ------------------------------------------------------------------ */
/* IPC: restaurant store (stock, purchases, recipes)                    */
/* ------------------------------------------------------------------ */
ipcMain.handle("stock:list", () => db.prepare("SELECT * FROM stock_items ORDER BY name ASC").all());

ipcMain.handle("stock:create", (_e, { name, unit, reorderLevel, initialQty, costPerUnit, purchaseUnit, purchaseToBaseFactor, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  if (purchaseUnit && !(purchaseToBaseFactor > 0)) throw new Error("Purchase unit needs a conversion factor greater than zero.");
  const id = uid("stk");
  const sku = allocateReference("stock_sku");
  db.prepare("INSERT INTO stock_items (id, sku, name, unit, current_qty, reorder_level, cost_per_unit, purchase_unit, purchase_to_base_factor, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(id, sku, name, unit, initialQty || 0, reorderLevel || 0, costPerUnit ?? null, purchaseUnit || null, purchaseUnit ? purchaseToBaseFactor : null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_item_created", entityType: "stock_item", entityId: id, details: { name, unit, sku, purchaseUnit, purchaseToBaseFactor } });
  return db.prepare("SELECT * FROM stock_items WHERE id = ?").get(id);
});

ipcMain.handle("stock:update", (_e, { id, name, unit, reorderLevel, costPerUnit, purchaseUnit, purchaseToBaseFactor, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  if (purchaseUnit && !(purchaseToBaseFactor > 0)) throw new Error("Purchase unit needs a conversion factor greater than zero.");
  db.prepare("UPDATE stock_items SET name = ?, unit = ?, reorder_level = ?, cost_per_unit = ?, purchase_unit = ?, purchase_to_base_factor = ? WHERE id = ?")
    .run(name, unit, reorderLevel, costPerUnit ?? null, purchaseUnit || null, purchaseUnit ? purchaseToBaseFactor : null, id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_item_updated", entityType: "stock_item", entityId: id });
  return db.prepare("SELECT * FROM stock_items WHERE id = ?").get(id);
});

ipcMain.handle("stock:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  const usedIn = db.prepare(`
    SELECT COUNT(*) c FROM recipes r JOIN recipe_versions rv ON rv.id = r.recipe_version_id
    WHERE r.stock_item_id = ? AND rv.is_current = 1
  `).get(id).c;
  if (usedIn > 0) throw new Error("This ingredient is used in at least one current recipe — remove it from those recipes first.");
  db.prepare("DELETE FROM stock_items WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_item_removed", entityType: "stock_item", entityId: id });
  return { ok: true };
});

ipcMain.handle("stock:adjust", (_e, { stockItemId, newQty, reason, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  if (!reason || !reason.trim()) throw new Error("A reason is required for a stock adjustment.");
  const item = db.prepare("SELECT current_qty, cost_per_unit FROM stock_items WHERE id = ?").get(stockItemId);
  if (!item) throw new Error("That stock item no longer exists.");
  const previousQty = item.current_qty;
  const delta = roundMoneyServer(newQty - previousQty);
  const unitCostSnapshot = item.cost_per_unit || 0;
  const valueImpact = roundMoneyServer(delta * unitCostSnapshot);
  const reference = allocateReference("adjustment_ref");
  db.prepare("UPDATE stock_items SET current_qty = ? WHERE id = ?").run(newQty, stockItemId);
  db.prepare(`
    INSERT INTO stock_adjustments (id, stock_item_id, previous_qty, new_qty, delta, reason, reference, unit_cost_snapshot, value_impact, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(uid("adj"), stockItemId, previousQty, newQty, delta, reason.trim(), reference, unitCostSnapshot, valueImpact, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_adjusted", entityType: "stock_item", entityId: stockItemId, details: { previousQty, newQty, delta, reason: reason.trim(), reference } });
  return { ...db.prepare("SELECT * FROM stock_items WHERE id = ?").get(stockItemId), reference };
});

// Same lightweight sign-off model as wastage:approve — records review,
// doesn't gate or reverse the adjustment (which already took effect).
ipcMain.handle("stockAdjustments:approve", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  db.prepare("UPDATE stock_adjustments SET approved_by_user_id = ?, approved_by_user_name = ?, approved_at = ? WHERE id = ?")
    .run(actingUser?.id || null, actingUser?.name || null, Date.now(), id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "adjustment_approved", entityType: "stock_adjustment", entityId: id });
  return { ok: true };
});

ipcMain.handle("stock:adjustments:list", (_e, { stockItemId, limit }) => (
  stockItemId
    ? db.prepare("SELECT * FROM stock_adjustments WHERE stock_item_id = ? ORDER BY created_at DESC LIMIT ?").all(stockItemId, limit || 50)
    : db.prepare("SELECT sa.*, si.name AS item_name, si.unit FROM stock_adjustments sa JOIN stock_items si ON si.id = sa.stock_item_id ORDER BY created_at DESC LIMIT ?").all(limit || 50)
));

ipcMain.handle("stockAdjustments:report", (_e, { from, to }) => db.prepare(`
  SELECT sa.*, si.name AS item_name, si.unit
  FROM stock_adjustments sa JOIN stock_items si ON si.id = sa.stock_item_id
  WHERE sa.created_at BETWEEN ? AND ?
  ORDER BY sa.created_at DESC
`).all(from, to));

ipcMain.handle("stock:purchase", (_e, { stockItemId, qty, unitCost, purchaseUnitQty, purchaseUnitCost, supplier, invoiceNumber, note, actingUser }) => {
  const item = db.prepare("SELECT current_qty, cost_per_unit, unit, purchase_unit, purchase_to_base_factor FROM stock_items WHERE id = ?").get(stockItemId);
  if (!item) throw new Error("That stock item no longer exists.");

  // Two entry modes: in the item's purchase unit (converted here, once,
  // before anything else runs) or directly in its base/recipe unit
  // (unchanged from before this feature existed). Either way, baseQty
  // and baseUnitCost below are always in the base unit by the time the
  // weighted-average formula sees them — that formula has no idea a
  // conversion happened, and doesn't need to.
  let baseQty, baseUnitCost, enteredQty = null, enteredUnit = null, enteredUnitCost = null;
  const usingPurchaseUnit = purchaseUnitQty != null && purchaseUnitQty !== "";

  if (usingPurchaseUnit) {
    if (!item.purchase_unit || !item.purchase_to_base_factor) {
      throw new Error("This item has no purchase unit configured — set one by editing the stock item, or enter the quantity directly in its base unit.");
    }
    const factor = item.purchase_to_base_factor;
    if (!(factor > 0)) throw new Error("This item's purchase conversion factor is invalid — fix it on the stock item before recording a purchase.");
    if (!(purchaseUnitQty > 0)) throw new Error("Quantity must be greater than zero.");
    baseQty = roundQtyServer(purchaseUnitQty * factor);
    baseUnitCost = (purchaseUnitCost != null && purchaseUnitCost !== "") ? roundUnitCostServer(purchaseUnitCost / factor) : null;
    enteredQty = purchaseUnitQty;
    enteredUnit = item.purchase_unit;
    enteredUnitCost = (purchaseUnitCost != null && purchaseUnitCost !== "") ? purchaseUnitCost : null;
  } else {
    if (!(qty > 0)) throw new Error("Quantity must be greater than zero.");
    baseQty = qty;
    baseUnitCost = (unitCost != null && unitCost !== "") ? unitCost : null;
  }

  const oldQty = item.current_qty || 0;
  const oldCost = item.cost_per_unit || 0;
  const totalCost = baseUnitCost != null ? roundMoneyServer(baseUnitCost * baseQty) : null;

  // Weighted-average cost: blend the value already on hand with the value
  // just brought in, rather than letting the latest purchase price simply
  // overwrite the running cost. A first purchase (nothing on hand yet)
  // just becomes that purchase's price. This formula is exactly what it
  // was before purchase-unit conversion existed — only the precision of
  // the rounding changed (see roundUnitCostServer above), not the logic.
  let newCost = oldCost;
  if (baseUnitCost != null) {
    const totalQty = oldQty + baseQty;
    newCost = totalQty > 0 ? roundUnitCostServer((oldQty * oldCost + baseQty * baseUnitCost) / totalQty) : baseUnitCost;
  }

  const grnNumber = allocateReference("grn");
  db.prepare(`
    INSERT INTO stock_purchases (id, stock_item_id, qty, unit_cost, total_cost, entered_qty, entered_unit, entered_unit_cost, supplier, invoice_number, grn_number, note, user_id, user_name, terminal_id, purchased_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(uid("pur"), stockItemId, baseQty, baseUnitCost, totalCost, enteredQty, enteredUnit, enteredUnitCost, supplier || null, invoiceNumber || null, grnNumber, note || null, actingUser?.id || null, actingUser?.name || null, terminalId, Date.now());
  db.prepare("UPDATE stock_items SET current_qty = current_qty + ?, cost_per_unit = ? WHERE id = ?").run(baseQty, newCost, stockItemId);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_purchase", entityType: "stock_item", entityId: stockItemId, details: { baseQty, baseUnitCost, newWeightedAvgCost: newCost, enteredQty, enteredUnit, enteredUnitCost, supplier, grnNumber } });
  return { ...db.prepare("SELECT * FROM stock_items WHERE id = ?").get(stockItemId), grnNumber };
});

ipcMain.handle("stock:purchases:list", (_e, { stockItemId, limit }) => (
  stockItemId
    ? db.prepare("SELECT sp.*, si.name AS item_name, si.unit FROM stock_purchases sp JOIN stock_items si ON si.id = sp.stock_item_id WHERE sp.stock_item_id = ? ORDER BY purchased_at DESC LIMIT ?").all(stockItemId, limit || 50)
    : db.prepare("SELECT sp.*, si.name AS item_name, si.unit FROM stock_purchases sp JOIN stock_items si ON si.id = sp.stock_item_id ORDER BY purchased_at DESC LIMIT ?").all(limit || 50)
));

ipcMain.handle("stock:consumption:list", (_e, { stockItemId, limit }) => (
  stockItemId
    ? db.prepare("SELECT * FROM stock_consumption_log WHERE stock_item_id = ? ORDER BY created_at DESC LIMIT ?").all(stockItemId, limit || 50)
    : db.prepare("SELECT scl.*, si.name AS item_name, si.unit FROM stock_consumption_log scl JOIN stock_items si ON si.id = scl.stock_item_id ORDER BY created_at DESC LIMIT ?").all(limit || 50)
));

// Opening / Purchases / Sales Consumption / Waste / Closing per item.
// There's no historical stock-level snapshot table, so "Opening" is
// derived backward: Closing (today's real current_qty) minus every
// logged movement in the range (purchases, sale consumption, waste,
// reversals, and manual adjustments) gives Opening. This only works
// correctly for ranges that run up to "now" (Today/This month/This
// year, as offered in the UI) — a genuinely past, closed-out period
// would need real point-in-time snapshots, which this doesn't attempt.
ipcMain.handle("stock:movementReport", (_e, { from, to }) => {
  const items = db.prepare("SELECT id, sku, name, unit, current_qty, reorder_level FROM stock_items ORDER BY name ASC").all();

  const toMap = (rows, keyField, valField) => {
    const map = {};
    for (const r of rows) map[r[keyField]] = r[valField];
    return map;
  };
  const purchasesMap = toMap(db.prepare("SELECT stock_item_id, SUM(qty) AS qty FROM stock_purchases WHERE purchased_at BETWEEN ? AND ? GROUP BY stock_item_id").all(from, to), "stock_item_id", "qty");
  const wasteMap = toMap(db.prepare("SELECT stock_item_id, SUM(qty) AS qty FROM wastage_log WHERE created_at BETWEEN ? AND ? GROUP BY stock_item_id").all(from, to), "stock_item_id", "qty");
  const adjMap = toMap(db.prepare("SELECT stock_item_id, SUM(delta) AS delta FROM stock_adjustments WHERE created_at BETWEEN ? AND ? GROUP BY stock_item_id").all(from, to), "stock_item_id", "delta");

  const salesMap = {}, reversalsMap = {};
  for (const r of db.prepare("SELECT stock_item_id, reason, SUM(qty) AS qty FROM stock_consumption_log WHERE created_at BETWEEN ? AND ? GROUP BY stock_item_id, reason").all(from, to)) {
    if (r.reason === "sale") salesMap[r.stock_item_id] = r.qty;
    else if (r.reason === "reversal") reversalsMap[r.stock_item_id] = r.qty; // stored negative
  }

  return items.map((it) => {
    const purchases = purchasesMap[it.id] || 0;
    const sales = salesMap[it.id] || 0;
    const waste = wasteMap[it.id] || 0;
    const reversals = reversalsMap[it.id] || 0; // negative value = stock added back
    const adjustments = adjMap[it.id] || 0;
    const closing = it.current_qty;
    // Net signed change to stock from everything logged in range.
    const totalDelta = purchases - sales - waste - reversals + adjustments;
    const opening = roundMoneyServer(closing - totalDelta);
    return {
      id: it.id, sku: it.sku, name: it.name, unit: it.unit, reorderLevel: it.reorder_level,
      opening, purchases: roundMoneyServer(purchases), sales: roundMoneyServer(sales), waste: roundMoneyServer(waste), closing: roundMoneyServer(closing),
      hasOtherMovements: reversals !== 0 || adjustments !== 0,
    };
  });
});

// Per-item breakdown of every non-purchase way stock leaves: sold,
// wasted, given to staff, or comped — the four columns the Consumption
// tab shows. Waste/staff-meal/complimentary are kept in separate columns
// deliberately (see the note above wastage:summary) rather than lumped
// into one "non-sale consumption" figure.
ipcMain.handle("stock:consumptionReport", (_e, { from, to }) => {
  const items = db.prepare("SELECT id, sku, name, unit FROM stock_items ORDER BY name ASC").all();
  const salesMap = {};
  for (const r of db.prepare("SELECT stock_item_id, SUM(qty) AS qty FROM stock_consumption_log WHERE reason = 'sale' AND created_at BETWEEN ? AND ? GROUP BY stock_item_id").all(from, to)) {
    salesMap[r.stock_item_id] = r.qty;
  }
  const wasteMap = {}, staffMap = {}, compMap = {};
  for (const r of db.prepare("SELECT stock_item_id, reason, SUM(qty) AS qty FROM wastage_log WHERE created_at BETWEEN ? AND ? GROUP BY stock_item_id, reason").all(from, to)) {
    if (r.reason === "staff_meal") staffMap[r.stock_item_id] = (staffMap[r.stock_item_id] || 0) + r.qty;
    else if (r.reason === "complimentary") compMap[r.stock_item_id] = (compMap[r.stock_item_id] || 0) + r.qty;
    else wasteMap[r.stock_item_id] = (wasteMap[r.stock_item_id] || 0) + r.qty;
  }
  return items.map((it) => ({
    id: it.id, sku: it.sku, name: it.name, unit: it.unit,
    sales: roundMoneyServer(salesMap[it.id] || 0),
    waste: roundMoneyServer(wasteMap[it.id] || 0),
    staffMeals: roundMoneyServer(staffMap[it.id] || 0),
    complimentary: roundMoneyServer(compMap[it.id] || 0),
  })).filter((r) => r.sales || r.waste || r.staffMeals || r.complimentary);
});

// The full running-balance history for one item — every purchase, sale,
// waste/staff-meal/complimentary entry, and adjustment, chronologically,
// with a computed opening balance and a balance after every row. There's
// no historical snapshot table, so the opening balance is derived the
// same way as stock:movementReport's Opening column: today's real
// quantity worked backward through every logged movement, ever — which
// means the final row's balance always exactly equals current stock.
ipcMain.handle("stock:ledger", (_e, { stockItemId }) => {
  const item = db.prepare("SELECT * FROM stock_items WHERE id = ?").get(stockItemId);
  if (!item) return null;

  const events = [];
  for (const p of db.prepare("SELECT * FROM stock_purchases WHERE stock_item_id = ? ORDER BY purchased_at ASC").all(stockItemId)) {
    events.push({ date: p.purchased_at, reference: p.grn_number || p.id, type: "Purchase", qtyIn: p.qty, qtyOut: 0 });
  }
  const consRows = db.prepare(`
    SELECT scl.*, t.receipt_ref FROM stock_consumption_log scl
    LEFT JOIN transactions t ON t.id = scl.ref_transaction_id
    WHERE scl.stock_item_id = ? AND scl.reason IN ('sale', 'reversal')
    ORDER BY scl.created_at ASC
  `).all(stockItemId);
  for (const c of consRows) {
    const isReversal = c.reason === "reversal";
    const qty = Math.abs(c.qty);
    events.push({
      date: c.created_at, reference: c.receipt_ref || c.ref_transaction_id || c.id,
      type: isReversal ? "Consumption (Reversed)" : "Consumption",
      qtyIn: isReversal ? qty : 0, qtyOut: isReversal ? 0 : qty,
    });
  }
  const typeLabels = { staff_meal: "Staff Meal", complimentary: "Complimentary" };
  for (const w of db.prepare("SELECT * FROM wastage_log WHERE stock_item_id = ? ORDER BY created_at ASC").all(stockItemId)) {
    events.push({ date: w.created_at, reference: w.reference || w.id, type: typeLabels[w.reason] || "Waste", qtyIn: 0, qtyOut: w.qty });
  }
  for (const a of db.prepare("SELECT * FROM stock_adjustments WHERE stock_item_id = ? ORDER BY created_at ASC").all(stockItemId)) {
    events.push({ date: a.created_at, reference: a.reference || a.id, type: "Adjustment", qtyIn: Math.max(0, a.delta), qtyOut: Math.max(0, -a.delta), note: a.reason });
  }

  events.sort((a, b) => a.date - b.date);

  const netMovement = events.reduce((s, e) => s + e.qtyIn - e.qtyOut, 0);
  const opening = roundMoneyServer(item.current_qty - netMovement);

  const rows = [{ date: item.created_at, reference: "OPEN-001", type: "Opening", qtyIn: opening, qtyOut: 0, balance: opening }];
  let running = opening;
  for (const e of events) {
    running = roundMoneyServer(running + e.qtyIn - e.qtyOut);
    rows.push({ ...e, balance: running });
  }
  return { item: { id: item.id, sku: item.sku, name: item.name, unit: item.unit }, rows };
});

/* ------------------------------------------------------------------ */
/* IPC: wastage (Phase 2)                                               */
/* ------------------------------------------------------------------ */
// Waste (spoilage/expired/prep_error/spillage/damaged/other), staff meals,
// and complimentary meals share this table and the same underlying
// mechanics — all three are "stock left without a sale" — but are kept
// clearly distinguishable via `reason` and their own reference-number
// sequences, and staff/comp are deliberately excluded from "waste"
// totals in reporting (see wastage:summary / wastage:byItem below):
// a staff meal isn't spoilage, and conflating them would misrepresent
// both figures.
const WASTAGE_REASONS = ["spoilage", "expired", "prep_error", "spillage", "damaged", "staff_meal", "complimentary", "other"];
const referenceTypeForReason = (reason) => (reason === "staff_meal" ? "staff_meal_ref" : reason === "complimentary" ? "complimentary_ref" : "wastage_ref");

ipcMain.handle("wastage:list", (_e, { stockItemId, limit } = {}) => (
  stockItemId
    ? db.prepare("SELECT w.*, si.name AS item_name, si.unit FROM wastage_log w JOIN stock_items si ON si.id = w.stock_item_id WHERE w.stock_item_id = ? ORDER BY w.created_at DESC LIMIT ?").all(stockItemId, limit || 50)
    : db.prepare("SELECT w.*, si.name AS item_name, si.unit FROM wastage_log w JOIN stock_items si ON si.id = w.stock_item_id ORDER BY w.created_at DESC LIMIT ?").all(limit || 100)
));

// Detailed, date-ranged rows for the Waste and Staff/Comp report tables.
// category: 'waste' (true wastage only), 'internal' (staff meals +
// complimentary only), or omitted for everything.
ipcMain.handle("wastage:report", (_e, { from, to, category }) => {
  const categoryFilter = category === "waste" ? "AND w.reason NOT IN ('staff_meal', 'complimentary')"
    : category === "internal" ? "AND w.reason IN ('staff_meal', 'complimentary')" : "";
  return db.prepare(`
    SELECT w.* , si.name AS item_name, si.unit
    FROM wastage_log w JOIN stock_items si ON si.id = w.stock_item_id
    WHERE w.created_at BETWEEN ? AND ? ${categoryFilter}
    ORDER BY w.created_at DESC
  `).all(from, to);
});

ipcMain.handle("wastage:create", (_e, { stockItemId, qty, reason, location, note, actingUser }) => {
  if (!WASTAGE_REASONS.includes(reason)) throw new Error("Unrecognized reason.");
  if (!qty || qty <= 0) throw new Error("Quantity must be greater than zero.");
  const item = db.prepare("SELECT current_qty, cost_per_unit, unit FROM stock_items WHERE id = ?").get(stockItemId);
  if (!item) throw new Error("That stock item no longer exists.");
  const unitCost = item.cost_per_unit || 0;
  const costImpact = roundMoneyServer(qty * unitCost);
  const id = uid("wst");
  const reference = allocateReference(referenceTypeForReason(reason));
  const tx = db.transaction(() => {
    db.prepare("INSERT INTO wastage_log (id, stock_item_id, qty, reason, reference, location, note, unit_cost, cost_impact, user_id, user_name, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(id, stockItemId, qty, reason, reference, location || null, note || null, unitCost, costImpact, actingUser?.id || null, actingUser?.name || null, Date.now());
    db.prepare("UPDATE stock_items SET current_qty = current_qty - ? WHERE id = ?").run(qty, stockItemId);
    // Also lands in the general consumption ledger, tagged distinctly, so
    // "what happened to this ingredient" has one place to look.
    db.prepare("INSERT INTO stock_consumption_log (id, stock_item_id, qty, reason, ref_transaction_id, created_at) VALUES (?,?,?,?,?,?)")
      .run(uid("cons"), stockItemId, qty, reason === "staff_meal" ? "staff_meal" : reason === "complimentary" ? "complimentary" : "wastage", id, Date.now());
  });
  tx();
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "wastage_recorded", entityType: "stock_item", entityId: stockItemId, details: { qty, reason, costImpact, reference } });
  return { ...db.prepare("SELECT * FROM stock_items WHERE id = ?").get(stockItemId), reference };
});

// Lightweight sign-off, not a gate: stock is already deducted the moment
// an entry is logged (as it should be, for real-time accuracy) — this
// just records that someone in authority reviewed and confirmed it,
// similar to a manager initialing a paper waste log. It never reverses
// or blocks anything.
ipcMain.handle("wastage:approve", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  db.prepare("UPDATE wastage_log SET approved_by_user_id = ?, approved_by_user_name = ?, approved_at = ? WHERE id = ?")
    .run(actingUser?.id || null, actingUser?.name || null, Date.now(), id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "wastage_approved", entityType: "wastage_log", entityId: id });
  return { ok: true };
});

ipcMain.handle("wastage:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, ["admin"]);
  const row = db.prepare("SELECT * FROM wastage_log WHERE id = ?").get(id);
  if (!row) return { ok: true };
  // Removing an incorrectly-logged entry puts the stock back.
  db.prepare("UPDATE stock_items SET current_qty = current_qty + ? WHERE id = ?").run(row.qty, row.stock_item_id);
  db.prepare("DELETE FROM wastage_log WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "wastage_removed", entityType: "stock_item", entityId: row.stock_item_id, details: { qty: row.qty, reason: row.reason } });
  return { ok: true };
});

// True waste only — staff meals and complimentary meals are deliberately
// excluded, since blending them in would inflate the wastage/spoilage
// figure with cost that isn't actually a loss or process problem.
ipcMain.handle("wastage:summary", (_e, { from, to }) => {
  const rows = db.prepare("SELECT reason, cost_impact FROM wastage_log WHERE created_at BETWEEN ? AND ? AND reason NOT IN ('staff_meal', 'complimentary')").all(from, to);
  const byReason = {};
  let total = 0;
  for (const r of rows) { byReason[r.reason] = (byReason[r.reason] || 0) + (r.cost_impact || 0); total += r.cost_impact || 0; }
  return { total: roundMoneyServer(total), byReason, count: rows.length };
});

// Staff meals and complimentary meals get their own summary, parallel to
// wastage:summary but reported separately for the reason above.
ipcMain.handle("stock:internalConsumptionSummary", (_e, { from, to }) => {
  const rows = db.prepare("SELECT reason, cost_impact FROM wastage_log WHERE created_at BETWEEN ? AND ? AND reason IN ('staff_meal', 'complimentary')").all(from, to);
  let staffMealsTotal = 0, complimentaryTotal = 0;
  for (const r of rows) {
    if (r.reason === "staff_meal") staffMealsTotal += r.cost_impact || 0;
    else complimentaryTotal += r.cost_impact || 0;
  }
  return { staffMealsTotal: roundMoneyServer(staffMealsTotal), complimentaryTotal: roundMoneyServer(complimentaryTotal), count: rows.length };
});

/* ------------------------------------------------------------------ */
/* IPC: physical stock counts (Phase 2)                                 */
/* ------------------------------------------------------------------ */
ipcMain.handle("stockCounts:list", () => db.prepare("SELECT * FROM stock_counts ORDER BY started_at DESC LIMIT 50").all());

ipcMain.handle("stockCounts:start", (_e, { note, actingUser }) => {
  const id = uid("cnt");
  const items = db.prepare("SELECT id, current_qty FROM stock_items").all();
  const tx = db.transaction(() => {
    db.prepare("INSERT INTO stock_counts (id, status, note, started_by_user_id, started_by_user_name, started_at) VALUES (?, 'in_progress', ?, ?, ?, ?)")
      .run(id, note || null, actingUser?.id || null, actingUser?.name || null, Date.now());
    const insertItem = db.prepare("INSERT INTO stock_count_items (id, stock_count_id, stock_item_id, theoretical_qty, created_at) VALUES (?,?,?,?,?)");
    for (const it of items) insertItem.run(uid("cnti"), id, it.id, it.current_qty, Date.now());
  });
  tx();
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_count_started", entityType: "stock_count", entityId: id });
  return { id };
});

ipcMain.handle("stockCounts:get", (_e, { id }) => {
  const count = db.prepare("SELECT * FROM stock_counts WHERE id = ?").get(id);
  if (!count) return null;
  const items = db.prepare(`
    SELECT sci.*, si.name AS item_name, si.unit, si.cost_per_unit
    FROM stock_count_items sci JOIN stock_items si ON si.id = sci.stock_item_id
    WHERE sci.stock_count_id = ? ORDER BY si.name ASC
  `).all(id);
  return { ...count, items };
});

ipcMain.handle("stockCounts:recordCount", (_e, { countId, stockItemId, countedQty, actingUser }) => {
  const row = db.prepare("SELECT * FROM stock_count_items WHERE stock_count_id = ? AND stock_item_id = ?").get(countId, stockItemId);
  if (!row) throw new Error("That item isn't part of this stock count.");
  const item = db.prepare("SELECT cost_per_unit FROM stock_items WHERE id = ?").get(stockItemId);
  const variance = roundMoneyServer(countedQty - row.theoretical_qty);
  const costImpact = roundMoneyServer(variance * (item?.cost_per_unit || 0));
  db.prepare("UPDATE stock_count_items SET counted_qty = ?, variance = ?, cost_impact = ? WHERE id = ?").run(countedQty, variance, costImpact, row.id);
  return { ok: true, variance, costImpact };
});

ipcMain.handle("stockCounts:finalize", (_e, { id, actingUser }) => {
  requireRole(actingUser, ["admin"]);
  const count = db.prepare("SELECT * FROM stock_counts WHERE id = ?").get(id);
  if (!count) throw new Error("That stock count no longer exists.");
  if (count.status === "finalized") throw new Error("This stock count has already been finalized.");
  const items = db.prepare("SELECT * FROM stock_count_items WHERE stock_count_id = ? AND counted_qty IS NOT NULL").all(id);
  const tx = db.transaction(() => {
    for (const it of items) {
      if (it.variance === 0) continue;
      const current = db.prepare("SELECT current_qty, cost_per_unit FROM stock_items WHERE id = ?").get(it.stock_item_id);
      if (!current) continue;
      const delta = roundMoneyServer(it.counted_qty - current.current_qty);
      const unitCostSnapshot = current.cost_per_unit || 0;
      db.prepare("UPDATE stock_items SET current_qty = ? WHERE id = ?").run(it.counted_qty, it.stock_item_id);
      db.prepare(`
        INSERT INTO stock_adjustments (id, stock_item_id, previous_qty, new_qty, delta, reason, reference, unit_cost_snapshot, value_impact, user_id, user_name, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(uid("adj"), it.stock_item_id, current.current_qty, it.counted_qty, delta, `Stock count variance (${todayStrServer()})`, allocateReference("adjustment_ref"), unitCostSnapshot, roundMoneyServer(delta * unitCostSnapshot), actingUser?.id || null, actingUser?.name || null, Date.now());
    }
    db.prepare("UPDATE stock_counts SET status = 'finalized', finalized_by_user_id = ?, finalized_by_user_name = ?, finalized_at = ? WHERE id = ?")
      .run(actingUser?.id || null, actingUser?.name || null, Date.now(), id);
  });
  tx();
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_count_finalized", entityType: "stock_count", entityId: id, details: { itemsReconciled: items.filter((i) => i.variance !== 0).length } });
  return { ok: true };
});

ipcMain.handle("stockCounts:cancel", (_e, { id, actingUser }) => {
  requireRole(actingUser, ["admin"]);
  db.prepare("DELETE FROM stock_count_items WHERE stock_count_id = ?").run(id);
  db.prepare("DELETE FROM stock_counts WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "stock_count_cancelled", entityType: "stock_count", entityId: id });
  return { ok: true };
});

ipcMain.handle("recipe:get", (_e, { menuItemId }) => db.prepare(`
  SELECT r.id, r.stock_item_id, r.qty_per_serving,
    COALESCE(r.display_qty, r.qty_per_serving) AS display_qty,
    COALESCE(r.display_unit, si.unit) AS display_unit,
    si.name AS stock_name, si.unit, si.cost_per_unit
  FROM recipes r
  JOIN recipe_versions rv ON rv.id = r.recipe_version_id
  JOIN stock_items si ON si.id = r.stock_item_id
  WHERE rv.menu_item_id = ? AND rv.is_current = 1
`).all(menuItemId));

ipcMain.handle("recipe:currentVersion", (_e, { menuItemId }) =>
  db.prepare("SELECT * FROM recipe_versions WHERE menu_item_id = ? AND is_current = 1").get(menuItemId) || null
);

// A recipe edit never overwrites the previous one — it creates a new,
// numbered version and marks it current. Old versions stay in the
// database exactly as they were, still linked to whichever past sales
// used them, so historical food-cost figures never move retroactively.
//
// Each line's `qty` must already be converted to the stock item's own
// unit by the caller (the renderer owns the unit-conversion table) —
// `displayQty`/`displayUnit` are kept purely so the editor can show back
// exactly what was typed rather than a converted decimal.
ipcMain.handle("recipe:set", (_e, { menuItemId, lines, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  let versionId;
  const tx = db.transaction((menuItemId, lines) => {
    const prevMax = db.prepare("SELECT MAX(version_number) v FROM recipe_versions WHERE menu_item_id = ?").get(menuItemId).v || 0;
    db.prepare("UPDATE recipe_versions SET is_current = 0 WHERE menu_item_id = ? AND is_current = 1").run(menuItemId);
    versionId = uid("rv");
    db.prepare("INSERT INTO recipe_versions (id, menu_item_id, version_number, is_current, user_id, user_name, created_at) VALUES (?,?,?,1,?,?,?)")
      .run(versionId, menuItemId, prevMax + 1, actingUser?.id || null, actingUser?.name || null, Date.now());
    const insert = db.prepare("INSERT INTO recipes (id, menu_item_id, stock_item_id, qty_per_serving, recipe_version_id, display_qty, display_unit) VALUES (?,?,?,?,?,?,?)");
    for (const l of lines) insert.run(uid("rcp"), menuItemId, l.stockItemId, l.qty, versionId, l.displayQty ?? l.qty, l.displayUnit ?? null);
  });
  tx(menuItemId, lines);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "recipe_updated", entityType: "menu_item", entityId: menuItemId, details: { lines: lines.length, versionId } });
  return { ok: true, versionId };
});

ipcMain.handle("recipe:allCounts", () => {
  const rows = db.prepare(`
    SELECT rv.menu_item_id, COUNT(*) c
    FROM recipes r JOIN recipe_versions rv ON rv.id = r.recipe_version_id
    WHERE rv.is_current = 1
    GROUP BY rv.menu_item_id
  `).all();
  const map = {};
  for (const r of rows) map[r.menu_item_id] = r.c;
  return map;
});

// Cost to make one serving of each dish: sum(qty_per_serving × cost_per_unit)
// across the CURRENT version's recipe lines. Ingredients with no recorded
// cost contribute 0, so the total is always a floor estimate, never an error.
ipcMain.handle("recipe:allWithCost", () => {
  const rows = db.prepare(`
    SELECT rv.menu_item_id, COUNT(*) AS count, ROUND(SUM(r.qty_per_serving * COALESCE(si.cost_per_unit, 0)), 2) AS cost
    FROM recipes r
    JOIN recipe_versions rv ON rv.id = r.recipe_version_id
    JOIN stock_items si ON si.id = r.stock_item_id
    WHERE rv.is_current = 1
    GROUP BY rv.menu_item_id
  `).all();
  const map = {};
  for (const r of rows) map[r.menu_item_id] = { count: r.count, cost: r.cost || 0 };
  return map;
});

/* ------------------------------------------------------------------ */
/* IPC: reservations (Calendar / advance bookings)                      */
/* ------------------------------------------------------------------ */
ipcMain.handle("reservations:list", () => db.prepare("SELECT * FROM reservations ORDER BY start_date ASC").all());

ipcMain.handle("reservations:create", (_e, { roomId, roomName, guestName, phone, startDate, endDate, notes, actingUser }) => {
  // Overlap = NOT (existing ends before this starts OR existing starts
  // after this ends). Checked against every other still-active
  // reservation for the same room. This is the safeguard that matters
  // most once two terminals can both be creating reservations — without
  // it, both could book the same room for overlapping dates before
  // either one notices.
  const overlap = db.prepare(`
    SELECT id, guest_name, start_date, end_date FROM reservations
    WHERE room_id = ? AND status = 'reserved' AND NOT (end_date <= ? OR start_date >= ?)
  `).get(roomId, startDate, endDate);
  if (overlap) {
    throw new Error(`Room ${roomName} is already reserved for ${overlap.guest_name} (${overlap.start_date} → ${overlap.end_date}), which overlaps this range.`);
  }
  const id = uid("res");
  db.prepare(`
    INSERT INTO reservations (id, room_id, room_name, guest_name, phone, start_date, end_date, status, notes, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?,?, 'reserved', ?, ?, ?, ?)
  `).run(id, roomId || null, roomName, guestName, phone || null, startDate, endDate, notes || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "reservation_created", entityType: "reservation", entityId: id, details: { roomName, guestName, startDate, endDate } });
  return db.prepare("SELECT * FROM reservations WHERE id = ?").get(id);
});

ipcMain.handle("reservations:cancel", (_e, { id, actingUser }) => {
  db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "reservation_cancelled", entityType: "reservation", entityId: id });
  return { ok: true };
});

ipcMain.handle("reservations:markCheckedIn", (_e, { id, actingUser }) => {
  db.prepare("UPDATE reservations SET status = 'checked_in' WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "reservation_checked_in", entityType: "reservation", entityId: id });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* IPC: calendar (unified events across the app, plus mini notes)       */
/* ------------------------------------------------------------------ */

// Pulls together every date-bearing record in the app into one feed,
// rather than duplicating any of it into a separate calendar-specific
// table — reservations, tasks, conference bookings, and maintenance stay
// exactly where they already live and are simply queried by date range.
// Leave is included only for management/HR roles, verified server-side
// against the real user record rather than trusted from the renderer —
// same principle as every other role check in this app.
ipcMain.handle("calendar:events", (_e, { from, to, actingUser }) => {
  const events = [];

  for (const r of db.prepare("SELECT * FROM reservations WHERE status = 'reserved' AND NOT (end_date < ? OR start_date > ?)").all(from, to)) {
    events.push({ type: "reservation", id: r.id, date: r.start_date, endDate: r.end_date, title: `${r.room_name} — ${r.guest_name}` });
  }
  for (const t of db.prepare("SELECT * FROM tasks WHERE due_date IS NOT NULL AND due_date BETWEEN ? AND ? AND status != 'done'").all(from, to)) {
    events.push({ type: "task", id: t.id, date: t.due_date, title: t.title, priority: t.priority });
  }
  for (const c of db.prepare("SELECT * FROM conference_bookings WHERE event_date BETWEEN ? AND ? AND status = 'booked'").all(from, to)) {
    events.push({ type: "conference", id: c.id, date: c.event_date, title: `${c.room_name} — ${c.client_name}` });
  }
  for (const m of db.prepare("SELECT * FROM maintenance_records WHERE scheduled_date IS NOT NULL AND scheduled_date BETWEEN ? AND ? AND status != 'completed'").all(from, to)) {
    events.push({ type: "maintenance", id: m.id, date: m.scheduled_date, title: m.title });
  }

  const requestingUser = actingUser?.id ? db.prepare("SELECT role FROM users WHERE id = ?").get(actingUser.id) : null;
  if (requestingUser && MANAGEMENT_OR_HR_ROLES.includes(requestingUser.role)) {
    for (const l of db.prepare(`
      SELECT lr.*, e.name AS employee_name FROM leave_records lr JOIN employees e ON e.id = lr.employee_id
      WHERE NOT (lr.end_date < ? OR lr.start_date > ?)
    `).all(from, to)) {
      events.push({ type: "leave", id: l.id, date: l.start_date, endDate: l.end_date, title: l.employee_name, leaveType: l.leave_type });
    }
  }

  for (const n of db.prepare("SELECT * FROM calendar_notes WHERE date BETWEEN ? AND ? ORDER BY created_at ASC").all(from, to)) {
    events.push({ type: "note", id: n.id, date: n.date, title: n.title, note: n.note, remind: !!n.remind });
  }

  return events;
});

ipcMain.handle("calendar:notes:create", (_e, { date, title, note, remind, actingUser }) => {
  const id = uid("cnote");
  const reference = allocateReference("calendar_note_ref");
  db.prepare("INSERT INTO calendar_notes (id, reference, date, title, note, remind, user_id, user_name, created_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(id, reference, date, title, note || null, remind ? 1 : 0, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "calendar_note_created", entityType: "calendar_note", entityId: id, details: { date, title } });
  return { id, reference };
});

ipcMain.handle("calendar:notes:remove", (_e, { id, actingUser }) => {
  db.prepare("DELETE FROM calendar_notes WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "calendar_note_removed", entityType: "calendar_note", entityId: id });
  return { ok: true };
});

// Reminder notes landing today — checked once when the app opens, to
// drive a native desktop notification.
ipcMain.handle("calendar:notes:dueToday", () => db.prepare("SELECT * FROM calendar_notes WHERE remind = 1 AND date = ?").all(todayStrServer()));

/* ------------------------------------------------------------------ */
/* IPC: contacts (guests / suppliers / staff directory)                 */
/* ------------------------------------------------------------------ */
ipcMain.handle("contacts:list", () => db.prepare("SELECT * FROM contacts ORDER BY name ASC").all());

ipcMain.handle("contacts:create", (_e, { type, name, phone, email, notes, actingUser }) => {
  const id = uid("ct");
  db.prepare("INSERT INTO contacts (id, type, name, phone, email, notes, created_at) VALUES (?,?,?,?,?,?,?)")
    .run(id, type, name, phone || null, email || null, notes || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "contact_created", entityType: "contact", entityId: id, details: { type, name } });
  return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
});

ipcMain.handle("contacts:update", (_e, { id, name, phone, email, notes, actingUser }) => {
  db.prepare("UPDATE contacts SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?").run(name, phone || null, email || null, notes || null, id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "contact_updated", entityType: "contact", entityId: id });
  return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id);
});

ipcMain.handle("contacts:remove", (_e, { id, actingUser }) => {
  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "contact_removed", entityType: "contact", entityId: id });
  return { ok: true };
});

// Bulk-populate from data the app already has, deduplicated by name+phone.
ipcMain.handle("contacts:importGuests", (_e, { guests, actingUser }) => {
  const existing = new Set(db.prepare("SELECT name || '|' || COALESCE(phone,'') AS k FROM contacts WHERE type = 'guest'").all().map((r) => r.k));
  const insert = db.prepare("INSERT INTO contacts (id, type, name, phone, email, notes, created_at) VALUES (?, 'guest', ?, ?, NULL, NULL, ?)");
  let added = 0;
  const tx = db.transaction((rows) => {
    for (const g of rows) {
      const key = `${g.name}|${g.phone || ""}`;
      if (existing.has(key) || !g.name) continue;
      existing.add(key);
      insert.run(uid("ct"), g.name, g.phone || null, Date.now());
      added += 1;
    }
  });
  tx(guests || []);
  if (added > 0) logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "contacts_imported", entityType: "contact", details: { source: "guests", added } });
  return { added };
});

ipcMain.handle("contacts:importSuppliers", (_e, { actingUser }) => {
  const suppliers = db.prepare("SELECT DISTINCT supplier FROM stock_purchases WHERE supplier IS NOT NULL AND supplier != ''").all().map((r) => r.supplier);
  const existing = new Set(db.prepare("SELECT name FROM contacts WHERE type = 'supplier'").all().map((r) => r.name));
  const insert = db.prepare("INSERT INTO contacts (id, type, name, phone, email, notes, created_at) VALUES (?, 'supplier', ?, NULL, NULL, NULL, ?)");
  let added = 0;
  const tx = db.transaction((names) => {
    for (const name of names) {
      if (existing.has(name)) continue;
      existing.add(name);
      insert.run(uid("ct"), name, Date.now());
      added += 1;
    }
  });
  tx(suppliers);
  if (added > 0) logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "contacts_imported", entityType: "contact", details: { source: "suppliers", added } });
  return { added };
});

/* ------------------------------------------------------------------ */
/* IPC: tasks (To-do)                                                   */
/* ------------------------------------------------------------------ */
ipcMain.handle("tasks:list", () => db.prepare("SELECT * FROM tasks ORDER BY (status = 'done'), due_date IS NULL, due_date ASC, created_at DESC").all());

ipcMain.handle("tasks:create", (_e, { title, description, assignedTo, dueDate, priority, actingUser }) => {
  const id = uid("tsk");
  db.prepare(`
    INSERT INTO tasks (id, title, description, assigned_to, due_date, priority, status, created_by, created_at)
    VALUES (?,?,?,?,?,?, 'open', ?, ?)
  `).run(id, title, description || null, assignedTo || null, dueDate || null, priority || "normal", actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "task_created", entityType: "task", entityId: id, details: { title } });
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
});

ipcMain.handle("tasks:setStatus", (_e, { id, status, actingUser }) => {
  db.prepare("UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?").run(status, status === "done" ? Date.now() : null, id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: status === "done" ? "task_completed" : "task_reopened", entityType: "task", entityId: id });
  return { ok: true };
});

ipcMain.handle("tasks:remove", (_e, { id, actingUser }) => {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "task_removed", entityType: "task", entityId: id });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* IPC: employees (Human Resources)                                     */
/* ------------------------------------------------------------------ */
// HR data (personal info, employment details, payroll, leave) is
// restricted to admin and the dedicated "hr" role — distinct from
// general "admin" so a manager who administers day-to-day POS settings
// doesn't automatically see salaries, national ID numbers, and tax
// numbers unless specifically granted the HR role. "staff" has no
// access to any of it, not even read-only.
const HR_ROLES = ["admin", "hr"];
// Operational management — inventory/recipe/cost editing, stock
// corrections, conference facility config, running costs, maintenance,
// and sign-off approvals. Distinct from HR_ROLES: a manager runs
// day-to-day operations but doesn't need access to payroll or personal
// HR records unless also explicitly given the "hr" role.
const MANAGEMENT_ROLES = ["admin", "manager"];
// Anyone who should see leave/attendance context for planning purposes
// (e.g. "who's on leave this week" on the calendar) without necessarily
// having full HR record access.
const MANAGEMENT_OR_HR_ROLES = ["admin", "manager", "hr"];

function auditFieldDiff(before, after, fields) {
  const changes = {};
  for (const f of fields) {
    const from = before[f] ?? null, to = after[f] ?? null;
    if (from !== to) changes[f] = { from, to };
  }
  return changes;
}

ipcMain.handle("employees:list", (_e, { actingUser } = {}) => {
  requireRole(actingUser, HR_ROLES);
  return db.prepare("SELECT * FROM employees ORDER BY (status = 'inactive'), name ASC").all();
});

ipcMain.handle("employees:create", (_e, payload) => {
  requireRole(payload.actingUser, HR_ROLES);
  const {
    firstName, middleName, surname, gender, dateOfBirth, nationality, idNumber, phone, email,
    department, role, supervisor, employmentType, hireDate, contractStart, contractEnd, probationEnd, workLocation, employmentStatus,
    payRate, payType, paymentMethod, nssfNumber, tin, notes, actingUser,
  } = payload;
  const id = uid("emp");
  const employeeNumber = (db.prepare("SELECT COALESCE(MAX(employee_number), 0) AS m FROM employees").get().m) + 1;
  const name = [firstName, middleName, surname].filter(Boolean).join(" ").trim() || "Unnamed";
  db.prepare(`
    INSERT INTO employees (
      id, employee_number, name, first_name, middle_name, surname, gender, date_of_birth, nationality, id_number, phone, email,
      department, role, supervisor, employment_type, hire_date, contract_start, contract_end, probation_end, work_location, employment_status,
      pay_rate, pay_type, payment_method, nssf_number, tin, status, notes, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?,?,?, ?,?,?,?,?, 'active', ?, ?)
  `).run(
    id, employeeNumber, name, firstName || null, middleName || null, surname || null, gender || null, dateOfBirth || null, nationality || null, idNumber || null, phone || null, email || null,
    department || null, role || null, supervisor || null, employmentType || null, hireDate || null, contractStart || null, contractEnd || null, probationEnd || null, workLocation || null, employmentStatus || "active",
    payRate ?? null, payType || "monthly", paymentMethod || null, nssfNumber || null, tin || null, notes || null, Date.now()
  );
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_created", entityType: "employee", entityId: id, details: { name, employeeNumber } });
  return db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
});

ipcMain.handle("employees:updatePersonal", (_e, { id, firstName, middleName, surname, gender, dateOfBirth, nationality, idNumber, phone, email, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const before = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!before) throw new Error("That employee no longer exists.");
  const name = [firstName, middleName, surname].filter(Boolean).join(" ").trim() || before.name;
  db.prepare(`
    UPDATE employees SET name = ?, first_name = ?, middle_name = ?, surname = ?, gender = ?, date_of_birth = ?, nationality = ?, id_number = ?, phone = ?, email = ? WHERE id = ?
  `).run(name, firstName || null, middleName || null, surname || null, gender || null, dateOfBirth || null, nationality || null, idNumber || null, phone || null, email || null, id);
  const after = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_personal_updated", entityType: "employee", entityId: id, details: auditFieldDiff(before, after, ["name", "gender", "date_of_birth", "nationality", "id_number", "phone", "email"]) });
  return after;
});

// Records a discrete, browsable timeline entry — distinct from the audit
// log, which is a technical change record. This is the human-readable
// "what happened in this person's career here" view.
function addEmployeeHistory({ employeeId, eventType, effectiveDate, title, fromValue, toValue, notes, actingUser }) {
  const reference = allocateReference("employee_history_ref");
  db.prepare(`
    INSERT INTO employee_history (id, reference, employee_id, event_type, effective_date, title, from_value, to_value, notes, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(uid("eh"), reference, employeeId, eventType, effectiveDate, title, fromValue ?? null, toValue ?? null, notes || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  return reference;
}

ipcMain.handle("employees:updateEmployment", (_e, { id, department, role, supervisor, employmentType, hireDate, contractStart, contractEnd, probationEnd, workLocation, employmentStatus, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const before = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!before) throw new Error("That employee no longer exists.");
  db.prepare(`
    UPDATE employees SET department = ?, role = ?, supervisor = ?, employment_type = ?, hire_date = ?, contract_start = ?, contract_end = ?, probation_end = ?, work_location = ?, employment_status = ? WHERE id = ?
  `).run(department || null, role || null, supervisor || null, employmentType || null, hireDate || null, contractStart || null, contractEnd || null, probationEnd || null, workLocation || null, employmentStatus || "active", id);
  const after = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_employment_updated", entityType: "employee", entityId: id, details: auditFieldDiff(before, after, ["department", "role", "supervisor", "employment_type", "hire_date", "contract_start", "contract_end", "probation_end", "work_location", "employment_status"]) });
  const today = todayStrServer();
  if (before.role !== after.role) addEmployeeHistory({ employeeId: id, eventType: "promotion", effectiveDate: today, title: "Position changed", fromValue: before.role, toValue: after.role, actingUser });
  if (before.department !== after.department) addEmployeeHistory({ employeeId: id, eventType: "transfer", effectiveDate: today, title: "Department changed", fromValue: before.department, toValue: after.department, actingUser });
  if (before.employment_status !== after.employment_status) addEmployeeHistory({ employeeId: id, eventType: "status_change", effectiveDate: today, title: "Employment status changed", fromValue: before.employment_status, toValue: after.employment_status, actingUser });
  return after;
});

ipcMain.handle("employees:updatePayroll", (_e, { id, payRate, payType, paymentMethod, nssfNumber, tin, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const before = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!before) throw new Error("That employee no longer exists.");
  db.prepare(`
    UPDATE employees SET pay_rate = ?, pay_type = ?, payment_method = ?, nssf_number = ?, tin = ? WHERE id = ?
  `).run(payRate ?? null, payType || "monthly", paymentMethod || null, nssfNumber || null, tin || null, id);
  const after = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  // Salary changes are exactly the kind of thing that needs a clear
  // before/after trail — this is the same diff mechanism as the other
  // fields, but pay_rate changes are worth calling out explicitly.
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_payroll_updated", entityType: "employee", entityId: id, details: auditFieldDiff(before, after, ["pay_rate", "pay_type", "payment_method", "nssf_number", "tin"]) });
  if (before.pay_rate !== after.pay_rate) addEmployeeHistory({ employeeId: id, eventType: "salary_change", effectiveDate: todayStrServer(), title: "Salary changed", fromValue: before.pay_rate, toValue: after.pay_rate, actingUser });
  return after;
});

ipcMain.handle("employees:history", (_e, { employeeId, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  return db.prepare("SELECT * FROM employee_history WHERE employee_id = ? ORDER BY effective_date DESC, created_at DESC").all(employeeId);
});

ipcMain.handle("employees:historyAdd", (_e, { employeeId, eventType, effectiveDate, title, fromValue, toValue, notes, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const employee = db.prepare("SELECT id FROM employees WHERE id = ?").get(employeeId);
  if (!employee) throw new Error("That employee no longer exists.");
  const reference = addEmployeeHistory({ employeeId, eventType: eventType || "note", effectiveDate, title, fromValue, toValue, notes, actingUser });
  return { reference };
});

// Termination captures the exit details and books a starting-point
// figure for final settlement (unused annual leave, valued at the
// current pay rate) — this is a *suggested* number for review, not an
// authoritative payroll calculation, since exact settlement rules vary
// by policy and jurisdiction.
ipcMain.handle("employees:terminate", (_e, { id, terminationDate, terminationReason, exitNotes, finalSettlementAmount, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const before = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!before) throw new Error("That employee no longer exists.");
  db.prepare(`
    UPDATE employees SET employment_status = 'terminated', status = 'inactive', termination_date = ?, termination_reason = ?, exit_notes = ?, final_settlement_amount = ?, final_settlement_status = 'pending' WHERE id = ?
  `).run(terminationDate, terminationReason || null, exitNotes || null, finalSettlementAmount ?? null, id);
  addEmployeeHistory({ employeeId: id, eventType: "termination", effectiveDate: terminationDate, title: "Employment terminated", fromValue: before.employment_status, toValue: "terminated", notes: terminationReason, actingUser });
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_terminated", entityType: "employee", entityId: id, details: { terminationDate, terminationReason, finalSettlementAmount } });
  return { ok: true };
});

ipcMain.handle("employees:settlementPaid", (_e, { id, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  db.prepare("UPDATE employees SET final_settlement_status = 'paid' WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_settlement_paid", entityType: "employee", entityId: id });
  return { ok: true };
});

ipcMain.handle("employees:rehire", (_e, { id, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const before = db.prepare("SELECT * FROM employees WHERE id = ?").get(id);
  if (!before) throw new Error("That employee no longer exists.");
  db.prepare("UPDATE employees SET employment_status = 'active', status = 'active', termination_date = NULL, termination_reason = NULL, exit_notes = NULL WHERE id = ?").run(id);
  addEmployeeHistory({ employeeId: id, eventType: "rehire", effectiveDate: todayStrServer(), title: "Rehired", fromValue: before.employment_status, toValue: "active", actingUser });
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_rehired", entityType: "employee", entityId: id });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* IPC: attendance (clock in/out, linked to compensatory accrual)       */
/* ------------------------------------------------------------------ */

// Counts backward from endDateStr as long as each preceding calendar day
// has a completed (clocked-out) attendance record — this is what makes
// the "every 6 consecutive days worked" compensatory rule concrete now
// that there's real attendance data to check it against.
function countConsecutiveWorkedDays(employeeId, endDateStr) {
  let count = 0;
  let d = new Date(`${endDateStr}T00:00:00`);
  const hasWorkedDay = db.prepare("SELECT COUNT(*) c FROM attendance_records WHERE employee_id = ? AND date = ? AND clock_out IS NOT NULL");
  for (;;) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    if (hasWorkedDay.get(employeeId, `${y}-${m}-${day}`).c === 0) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// Deliberately not gated to HR roles — clocking in/out needs to be a
// quick, self-service kiosk action available to anyone at the terminal,
// including employees who don't have a separate POS login at all (not
// every staff member needs one). Viewing the detailed report and making
// manual corrections is restricted below, same as everything else HR.
// Deliberately minimal and ungated — the attendance kiosk needs a way to
// pick "who is clocking in," but that doesn't require exposing anything
// from the sensitive HR record (salary, ID number, DOB, etc.), so this
// returns only what a kiosk picker actually needs.
ipcMain.handle("attendance:roster", () => db.prepare("SELECT id, employee_number, name FROM employees WHERE status = 'active' ORDER BY name ASC").all());

ipcMain.handle("attendance:today", () => db.prepare(`
  SELECT a.*, e.name AS employee_name, e.employee_number FROM attendance_records a
  JOIN employees e ON e.id = a.employee_id
  WHERE a.date = ? ORDER BY a.clock_in DESC
`).all(todayStrServer()));

ipcMain.handle("attendance:status", (_e, { employeeId }) =>
  db.prepare("SELECT * FROM attendance_records WHERE employee_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1").get(employeeId) || null
);

ipcMain.handle("attendance:clockIn", (_e, { employeeId, actingUser }) => {
  const employee = db.prepare("SELECT id, status FROM employees WHERE id = ?").get(employeeId);
  if (!employee) throw new Error("That employee no longer exists.");
  if (employee.status !== "active") throw new Error("This employee is not active.");
  if (db.prepare("SELECT id FROM attendance_records WHERE employee_id = ? AND clock_out IS NULL").get(employeeId)) throw new Error("Already clocked in.");
  const reference = allocateReference("attendance_ref");
  db.prepare("INSERT INTO attendance_records (id, reference, employee_id, date, clock_in, user_id, user_name, created_at) VALUES (?,?,?,?,?,?,?,?)")
    .run(uid("att"), reference, employeeId, todayStrServer(), Date.now(), actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "attendance_clock_in", entityType: "employee", entityId: employeeId, details: { reference } });
  return { reference };
});

ipcMain.handle("attendance:clockOut", (_e, { employeeId, actingUser }) => {
  const open = db.prepare("SELECT * FROM attendance_records WHERE employee_id = ? AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1").get(employeeId);
  if (!open) throw new Error("Not currently clocked in.");
  const clockOut = Date.now();
  const hours = roundMoneyServer((clockOut - open.clock_in) / 3600000);
  db.prepare("UPDATE attendance_records SET clock_out = ?, hours = ? WHERE id = ?").run(clockOut, hours, open.id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "attendance_clock_out", entityType: "employee", entityId: employeeId, details: { hours } });

  let compensatoryCredited = false;
  const consecutive = countConsecutiveWorkedDays(employeeId, open.date);
  if (consecutive > 0 && consecutive % 6 === 0) {
    db.prepare("UPDATE attendance_records SET compensatory_credited = 1 WHERE id = ?").run(open.id);
    const reference = allocateReference("leave_balance_ref");
    db.prepare(`
      INSERT INTO leave_balance_adjustments (id, reference, employee_id, leave_type, kind, days, note, user_id, user_name, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(uid("lba"), reference, employeeId, "compensatory", "accrual", 1, `Auto-credited: ${consecutive} consecutive days worked ending ${open.date}`, null, "System (attendance)", Date.now());
    logAudit({ userId: null, userName: "System (attendance)", action: "compensatory_auto_credited", entityType: "employee", entityId: employeeId, details: { consecutiveDays: consecutive, endingDate: open.date, reference } });
    compensatoryCredited = true;
  }
  return { hours, compensatoryCredited };
});

ipcMain.handle("attendance:manualEntry", (_e, { employeeId, date, clockIn, clockOut, note, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_OR_HR_ROLES);
  const employee = db.prepare("SELECT id FROM employees WHERE id = ?").get(employeeId);
  if (!employee) throw new Error("That employee no longer exists.");
  const hours = clockOut ? roundMoneyServer((clockOut - clockIn) / 3600000) : null;
  const reference = allocateReference("attendance_ref");
  db.prepare("INSERT INTO attendance_records (id, reference, employee_id, date, clock_in, clock_out, hours, note, user_id, user_name, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .run(uid("att"), reference, employeeId, date, clockIn, clockOut || null, hours, note || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "attendance_manual_entry", entityType: "employee", entityId: employeeId, details: { date, reference } });
  return { reference };
});

ipcMain.handle("attendance:report", (_e, { from, to, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_OR_HR_ROLES);
  const fromStr = toLocalDateStrServer(from);
  const toStr = toLocalDateStrServer(to);
  return db.prepare(`
    SELECT a.*, e.name AS employee_name, e.employee_number FROM attendance_records a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.date BETWEEN ? AND ?
    ORDER BY a.clock_in DESC
  `).all(fromStr, toStr);
});

ipcMain.handle("attendance:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_OR_HR_ROLES);
  db.prepare("DELETE FROM attendance_records WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "attendance_removed", entityType: "attendance_record", entityId: id });
  return { ok: true };
});



ipcMain.handle("employees:setStatus", (_e, { id, status, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  db.prepare("UPDATE employees SET status = ? WHERE id = ?").run(status, id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: status === "active" ? "employee_reactivated" : "employee_deactivated", entityType: "employee", entityId: id });
  return { ok: true };
});

ipcMain.handle("employees:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  db.prepare("DELETE FROM employees WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "employee_removed", entityType: "employee", entityId: id });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* IPC: employee leave (entitlements, balances, ledger)                 */
/* ------------------------------------------------------------------ */
const LEAVE_TYPES = ["annual", "sick", "family_responsibility", "maternity", "paternity", "compensatory", "public_holiday", "other"];

// Default annual entitlements, verified against Uganda's Employment Act
// 2006 (21 days annual leave, accruing 7 days per 4-month period; up to
// 2 months' sick leave with the first month at full pay; 60 working days
// maternity; 4 working days paternity). "family_responsibility" isn't
// itself a named statutory category in Uganda — the closer legal concept
// is discretionary "compassionate leave" (commonly 3–6 days, employer
// policy, not a legal mandate) — 3 is kept here as a reasonable policy
// default under that label. compensatory/public_holiday/other have no
// fixed annual number: they only ever accrue when explicitly credited,
// since this app has no attendance/clock-in system to auto-detect a
// "6 consecutive days worked" or "worked a public holiday" event.
const LEAVE_POLICY_DEFAULTS = { annual: 21, sick: 30, family_responsibility: 3, maternity: 60, paternity: 4, compensatory: 0, public_holiday: 0, other: 0 };

function daysBetweenInclusive(startStr, endStr) {
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  return Math.round((end - start) / 86400000) + 1;
}

ipcMain.handle("leave:list", (_e, { employeeId, actingUser } = {}) => {
  requireRole(actingUser, HR_ROLES);
  return employeeId
    ? db.prepare("SELECT * FROM leave_records WHERE employee_id = ? ORDER BY start_date DESC").all(employeeId)
    : db.prepare("SELECT l.*, e.name AS employee_name, e.employee_number FROM leave_records l JOIN employees e ON e.id = l.employee_id ORDER BY l.start_date DESC LIMIT 200").all();
});

ipcMain.handle("leave:create", (_e, { employeeId, leaveType, startDate, endDate, reason, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  if (!LEAVE_TYPES.includes(leaveType)) throw new Error("Unrecognized leave type.");
  const employee = db.prepare("SELECT id FROM employees WHERE id = ?").get(employeeId);
  if (!employee) throw new Error("That employee no longer exists.");
  const days = daysBetweenInclusive(startDate, endDate);
  if (!(days > 0)) throw new Error("End date must be on or after the start date.");
  const id = uid("lve");
  const reference = allocateReference("leave_ref");
  db.prepare(`
    INSERT INTO leave_records (id, reference, employee_id, leave_type, start_date, end_date, days, reason, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, reference, employeeId, leaveType, startDate, endDate, days, reason || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "leave_recorded", entityType: "employee", entityId: employeeId, details: { leaveType, startDate, endDate, days, reference } });
  return { reference, days };
});

// Same lightweight sign-off as wastage/adjustments — an admin confirming
// the record is correct, not a gate that blocks the leave itself.
ipcMain.handle("leave:approve", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_OR_HR_ROLES);
  db.prepare("UPDATE leave_records SET approved_by_user_id = ?, approved_by_user_name = ?, approved_at = ? WHERE id = ?")
    .run(actingUser?.id || null, actingUser?.name || null, Date.now(), id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "leave_approved", entityType: "leave_record", entityId: id });
  return { ok: true };
});

ipcMain.handle("leave:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  db.prepare("DELETE FROM leave_records WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "leave_removed", entityType: "leave_record", entityId: id });
  return { ok: true };
});

// Opening balance carry-over, manual accrual credit (compensatory days,
// public holidays worked), or a general correction — for one employee,
// one leave type, one entry at a time.
ipcMain.handle("leave:balanceAdjust", (_e, { employeeId, leaveType, kind, days, note, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  if (!LEAVE_TYPES.includes(leaveType)) throw new Error("Unrecognized leave type.");
  if (!["opening", "accrual", "adjustment"].includes(kind)) throw new Error("Invalid adjustment kind.");
  if (!days) throw new Error("Days must not be zero.");
  const employee = db.prepare("SELECT id FROM employees WHERE id = ?").get(employeeId);
  if (!employee) throw new Error("That employee no longer exists.");
  const reference = allocateReference("leave_balance_ref");
  db.prepare(`
    INSERT INTO leave_balance_adjustments (id, reference, employee_id, leave_type, kind, days, note, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(uid("lba"), reference, employeeId, leaveType, kind, days, note || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "leave_balance_adjusted", entityType: "employee", entityId: employeeId, details: { leaveType, kind, days, reference } });
  return { reference };
});

// Full per-employee history — hire date plus every leave record,
// chronologically. Mirrors the Inventory Ledger's shape: one place to
// see everything that's happened for this one employee.
ipcMain.handle("employees:ledger", (_e, { employeeId, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const employee = db.prepare("SELECT * FROM employees WHERE id = ?").get(employeeId);
  if (!employee) return null;
  const leaves = db.prepare("SELECT * FROM leave_records WHERE employee_id = ? ORDER BY start_date ASC").all(employeeId);
  const totalsByType = {};
  for (const l of leaves) totalsByType[l.leave_type] = roundMoneyServer((totalsByType[l.leave_type] || 0) + l.days);
  return { employee, leaves, totalsByType };
});

// Fraction of a given calendar year actually worked, bounded by hire
// date and today — an employee can't have accrued leave for a period
// before they joined, or for days that haven't happened yet. This is
// what makes accrual reflect actual service rather than crediting a
// full year's entitlement on day one, mirroring how Uganda's Employment
// Act literally describes annual leave accruing progressively (7 days
// per 4 months worked) rather than as a lump sum.
function serviceProrationForYear(hireDateStr, year) {
  if (!hireDateStr) return 1;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const hire = new Date(`${hireDateStr}T00:00:00`);
  const today = new Date();
  const effectiveStart = hire > yearStart ? hire : yearStart;
  const effectiveEnd = today < yearEnd ? today : yearEnd;
  if (effectiveStart > effectiveEnd) return 0;
  const daysEmployed = Math.round((effectiveEnd - effectiveStart) / 86400000) + 1;
  const daysInYear = Math.round((yearEnd - yearStart) / 86400000) + 1;
  return Math.min(1, daysEmployed / daysInYear);
}

// Opening / Accrued / Taken / Adjustment / Closing per leave type, for
// one employee, for one calendar year. Accrued = the statutory/policy
// default, prorated by actual service within the year (see
// serviceProrationForYear), plus any manually credited accrual; Taken =
// sum of that year's leave records; Opening/Adjustment come from
// manually recorded balance entries — nothing here is a separately-
// stored running total that could drift out of sync with its inputs,
// it's computed fresh every time.
ipcMain.handle("leave:ledgerBalances", (_e, { employeeId, year, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  const employee = db.prepare("SELECT id, hire_date FROM employees WHERE id = ?").get(employeeId);
  if (!employee) return [];
  const yr = parseInt(String(year || new Date().getFullYear()), 10);
  const yearStart = new Date(yr, 0, 1).getTime();
  const yearEnd = new Date(yr + 1, 0, 1).getTime() - 1;
  const proration = serviceProrationForYear(employee.hire_date, yr);

  const adjustments = db.prepare("SELECT * FROM leave_balance_adjustments WHERE employee_id = ? AND created_at BETWEEN ? AND ?").all(employeeId, yearStart, yearEnd);
  const takenByType = db.prepare("SELECT leave_type, SUM(days) AS days FROM leave_records WHERE employee_id = ? AND substr(start_date, 1, 4) = ? GROUP BY leave_type").all(employeeId, String(yr));
  const takenMap = {};
  for (const r of takenByType) takenMap[r.leave_type] = r.days;

  return LEAVE_TYPES.map((type) => {
    const opening = roundMoneyServer(adjustments.filter((a) => a.leave_type === type && a.kind === "opening").reduce((s, a) => s + a.days, 0));
    const accrualCredit = roundMoneyServer(adjustments.filter((a) => a.leave_type === type && a.kind === "accrual").reduce((s, a) => s + a.days, 0));
    const adjustment = roundMoneyServer(adjustments.filter((a) => a.leave_type === type && a.kind === "adjustment").reduce((s, a) => s + a.days, 0));
    const accrued = roundMoneyServer((LEAVE_POLICY_DEFAULTS[type] || 0) * proration + accrualCredit);
    const taken = roundMoneyServer(takenMap[type] || 0);
    const closing = roundMoneyServer(opening + accrued - taken + adjustment);
    return { leaveType: type, opening, accrued, taken, adjustment, closing };
  });
});

/* ------------------------------------------------------------------ */
/* IPC: conference facility                                             */
/* ------------------------------------------------------------------ */
ipcMain.handle("conference:rooms:list", () => db.prepare("SELECT * FROM conference_rooms ORDER BY name ASC").all());

ipcMain.handle("conference:rooms:create", (_e, { name, capacity, hourlyRate, dailyRate, amenities, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  const id = uid("cfr");
  db.prepare(`
    INSERT INTO conference_rooms (id, name, capacity, hourly_rate, daily_rate, amenities, status, created_at)
    VALUES (?,?,?,?,?,?, 'active', ?)
  `).run(id, name, capacity ?? null, hourlyRate ?? null, dailyRate ?? null, amenities || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "conference_room_created", entityType: "conference_room", entityId: id, details: { name } });
  return db.prepare("SELECT * FROM conference_rooms WHERE id = ?").get(id);
});

ipcMain.handle("conference:rooms:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  const hasBookings = db.prepare("SELECT COUNT(*) c FROM conference_bookings WHERE room_id = ? AND status = 'booked'").get(id).c;
  if (hasBookings > 0) throw new Error("This facility has active bookings — cancel or complete them first.");
  db.prepare("DELETE FROM conference_rooms WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "conference_room_removed", entityType: "conference_room", entityId: id });
  return { ok: true };
});

ipcMain.handle("conference:bookings:list", () => db.prepare("SELECT * FROM conference_bookings ORDER BY event_date ASC").all());

ipcMain.handle("conference:bookings:create", (_e, { roomId, roomName, clientName, phone, eventDate, startTime, endTime, rateType, amount, notes, actingUser }) => {
  // One booking per facility per day, to keep double-booking impossible
  // across terminals without needing precise time-slot arithmetic.
  const conflict = db.prepare("SELECT id, client_name FROM conference_bookings WHERE room_id = ? AND event_date = ? AND status = 'booked'").get(roomId, eventDate);
  if (conflict) throw new Error(`${roomName} is already booked on ${eventDate} for ${conflict.client_name}.`);
  const id = uid("cfb");
  db.prepare(`
    INSERT INTO conference_bookings (id, room_id, room_name, client_name, phone, event_date, start_time, end_time, rate_type, amount, payment_method, status, notes, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?, NULL, 'booked', ?, ?, ?, ?)
  `).run(id, roomId, roomName, clientName, phone || null, eventDate, startTime || null, endTime || null, rateType, amount, notes || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "conference_booking_created", entityType: "conference_booking", entityId: id, details: { roomName, clientName, eventDate } });
  return db.prepare("SELECT * FROM conference_bookings WHERE id = ?").get(id);
});

ipcMain.handle("conference:bookings:settle", (_e, { id, paymentMethod, actingUser }) => {
  const booking = db.prepare("SELECT * FROM conference_bookings WHERE id = ?").get(id);
  if (!booking) throw new Error("Booking not found.");
  if (booking.status !== "booked") throw new Error("This booking has already been settled or cancelled.");
  let receiptRef = null;
  const tx = db.transaction(() => {
    // Conference bookings share the same id between conference_bookings
    // and transactions — the facility-specific detail (room/date/time)
    // stays in one table, the financial record lives in the other, and
    // they're joined for free by sharing an id rather than needing an
    // extra foreign-key column.
    receiptRef = allocateReference("receipt_conference", documentNumberDigits());
    insertTxn.run({
      id: booking.id, kind: "conference", refLabel: `${booking.room_name} — ${booking.event_date}`, guestName: booking.client_name,
      subtotal: booking.amount, tax: 0, service: 0, total: booking.amount,
      paymentMethod, roomCharged: null, status: "paid", receiptRef,
      userId: actingUser?.id || null, userName: actingUser?.name || null,
      terminalId, createdAt: booking.created_at, closedAt: Date.now(),
    });
    insertTxnItem.run(uid("ti"), booking.id, null, `${booking.room_name} — ${booking.event_date}${booking.start_time ? ` (${booking.start_time}–${booking.end_time || ""})` : ""}`, 1, booking.amount, null, null);
    db.prepare("UPDATE conference_bookings SET status = 'completed', payment_method = ?, closed_at = ? WHERE id = ?").run(paymentMethod, Date.now(), id);
    logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "conference_booking_settled", entityType: "conference_booking", entityId: id, details: { paymentMethod, receiptRef } });
  });
  tx();
  return { ok: true, receiptRef };
});

ipcMain.handle("conference:bookings:cancel", (_e, { id, actingUser }) => {
  db.prepare("UPDATE conference_bookings SET status = 'cancelled', closed_at = ? WHERE id = ?").run(Date.now(), id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "conference_booking_cancelled", entityType: "conference_booking", entityId: id });
  return { ok: true };
});

// Settled/cancelled conference bookings, for History. Joined against
// transactions to pick up the receipt reference generated at settle
// time — conference_bookings itself doesn't store one, since the
// financial record and the facility-booking record are deliberately
// kept in separate tables (see conference:bookings:settle).
ipcMain.handle("conference:bookings:historyList", () => db.prepare(`
  SELECT cb.*, t.receipt_ref AS receipt_ref
  FROM conference_bookings cb
  LEFT JOIN transactions t ON t.id = cb.id
  WHERE cb.status IN ('completed', 'cancelled')
  ORDER BY cb.closed_at DESC
`).all());

/* ------------------------------------------------------------------ */
/* IPC: running costs (utilities & operating expenses)                  */
/* ------------------------------------------------------------------ */
ipcMain.handle("runningCosts:list", (_e, { from, to } = {}) => (
  from && to
    ? db.prepare("SELECT * FROM running_costs WHERE expense_date BETWEEN ? AND ? ORDER BY expense_date DESC").all(from, to)
    : db.prepare("SELECT * FROM running_costs ORDER BY expense_date DESC LIMIT 200").all()
));

ipcMain.handle("runningCosts:create", (_e, { category, description, vendor, amount, expenseDate, paymentMethod, recurring, notes, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  const id = uid("rc");
  db.prepare(`
    INSERT INTO running_costs (id, category, description, vendor, amount, expense_date, payment_method, recurring, notes, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, category, description || null, vendor || null, amount, expenseDate, paymentMethod || null, recurring ? 1 : 0, notes || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "running_cost_recorded", entityType: "running_cost", entityId: id, details: { category, amount } });
  return db.prepare("SELECT * FROM running_costs WHERE id = ?").get(id);
});

ipcMain.handle("runningCosts:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  db.prepare("DELETE FROM running_costs WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "running_cost_removed", entityType: "running_cost", entityId: id });
  return { ok: true };
});

ipcMain.handle("runningCosts:summary", (_e, { from, to }) => {
  const rows = db.prepare("SELECT category, amount FROM running_costs WHERE expense_date BETWEEN ? AND ?").all(from, to);
  const byCategory = {};
  let total = 0;
  for (const r of rows) { byCategory[r.category] = (byCategory[r.category] || 0) + r.amount; total += r.amount; }
  return { total, byCategory, count: rows.length };
});

/* ------------------------------------------------------------------ */
/* IPC: maintenance & repairs                                           */
/* ------------------------------------------------------------------ */
ipcMain.handle("maintenance:list", () => db.prepare("SELECT * FROM maintenance_records ORDER BY (status = 'completed'), scheduled_date IS NULL, scheduled_date ASC, created_at DESC").all());

ipcMain.handle("maintenance:create", (_e, { title, category, location, cost, vendor, scheduledDate, notes, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  const id = uid("mnt");
  db.prepare(`
    INSERT INTO maintenance_records (id, title, category, location, cost, vendor, status, scheduled_date, notes, user_id, user_name, created_at)
    VALUES (?,?,?,?,?,?, 'planned', ?, ?, ?, ?, ?)
  `).run(id, title, category || "repair", location || null, cost ?? null, vendor || null, scheduledDate || null, notes || null, actingUser?.id || null, actingUser?.name || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "maintenance_recorded", entityType: "maintenance_record", entityId: id, details: { title, category } });
  return db.prepare("SELECT * FROM maintenance_records WHERE id = ?").get(id);
});

ipcMain.handle("maintenance:setStatus", (_e, { id, status, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  db.prepare("UPDATE maintenance_records SET status = ?, completed_date = ? WHERE id = ?").run(status, status === "completed" ? todayStrServer() : null, id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "maintenance_status_changed", entityType: "maintenance_record", entityId: id, details: { status } });
  return { ok: true };
});

ipcMain.handle("maintenance:remove", (_e, { id, actingUser }) => {
  requireRole(actingUser, MANAGEMENT_ROLES);
  db.prepare("DELETE FROM maintenance_records WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "maintenance_removed", entityType: "maintenance_record", entityId: id });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* IPC: documents (company templates)                                   */
/* ------------------------------------------------------------------ */
ipcMain.handle("documents:list", () => db.prepare("SELECT * FROM documents ORDER BY uploaded_at DESC").all());

ipcMain.handle("documents:listForEmployee", (_e, { employeeId, actingUser }) => {
  requireRole(actingUser, HR_ROLES);
  return db.prepare("SELECT * FROM documents WHERE employee_id = ? ORDER BY uploaded_at DESC").all(employeeId);
});

ipcMain.handle("documents:add", async (_e, { category, employeeId, label, actingUser }) => {
  if (employeeId) requireRole(actingUser, HR_ROLES);
  const res = await dialog.showOpenDialog({ properties: ["openFile"] });
  if (res.canceled || res.filePaths.length === 0) return null;
  const srcPath = res.filePaths[0];
  const filename = path.basename(srcPath);
  const categoryDir = path.join(documentsDir, category);
  fs.mkdirSync(categoryDir, { recursive: true });
  const destPath = path.join(categoryDir, `${Date.now()}-${filename}`);
  fs.copyFileSync(srcPath, destPath);
  const id = uid("doc");
  db.prepare("INSERT INTO documents (id, category, filename, stored_path, is_active, employee_id, label, uploaded_at) VALUES (?,?,?,?,0,?,?,?)")
    .run(id, category, filename, destPath, employeeId || null, label || null, Date.now());
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "document_uploaded", entityType: "document", entityId: id, details: { category, filename, employeeId, label } });
  return { id, category, filename, stored_path: destPath, is_active: 0, employee_id: employeeId || null, label: label || null, uploaded_at: Date.now() };
});

ipcMain.handle("documents:setActive", (_e, { id, category, actingUser }) => {
  db.prepare("UPDATE documents SET is_active = 0 WHERE category = ?").run(category);
  db.prepare("UPDATE documents SET is_active = 1 WHERE id = ?").run(id);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "document_set_active", entityType: "document", entityId: id, details: { category } });
  return { ok: true };
});

ipcMain.handle("documents:remove", (_e, { id, actingUser }) => {
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
  if (doc) {
    if (doc.employee_id) requireRole(actingUser, HR_ROLES);
    try { fs.unlinkSync(doc.stored_path); } catch {}
    db.prepare("DELETE FROM documents WHERE id = ?").run(id);
    logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "document_removed", entityType: "document", entityId: id, details: { filename: doc.filename } });
  }
  return { ok: true };
});

ipcMain.handle("documents:open", (_e, storedPath) => shell.openPath(storedPath));

/* ------------------------------------------------------------------ */
/* IPC: backup / restore                                                */
/* ------------------------------------------------------------------ */
ipcMain.handle("backup:create", async (_e, { actingUser, note }) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `g2-pos-backup-${stamp}.sqlite`;
  const destPath = path.join(backupsDir, filename);
  await db.backup(destPath);
  const size = fs.statSync(destPath).size;
  db.prepare("INSERT INTO backups (id, filename, created_at, size_bytes, note) VALUES (?,?,?,?,?)")
    .run(uid("bak"), filename, Date.now(), size, note || null);
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "backup_created", entityType: "backup", entityId: filename, details: { size } });
  return { filename, size, path: destPath };
});

ipcMain.handle("backup:list", () => db.prepare("SELECT * FROM backups ORDER BY created_at DESC").all());

ipcMain.handle("backup:restore", async (_e, { actingUser }) => {
  requireRole(actingUser, ["admin"]);
  const res = await dialog.showOpenDialog({ defaultPath: backupsDir, properties: ["openFile"], filters: [{ name: "SQLite backup", extensions: ["sqlite"] }] });
  if (res.canceled || res.filePaths.length === 0) return { ok: false };
  const chosen = res.filePaths[0];
  const { response } = await dialog.showMessageBox({
    type: "warning",
    buttons: ["Cancel", "Restore and restart"],
    defaultId: 0,
    cancelId: 0,
    message: "Restore this backup?",
    detail: "This replaces all current data with the selected backup. The app will restart. This can't be undone.",
  });
  if (response !== 1) return { ok: false };
  logAudit({ userId: actingUser?.id, userName: actingUser?.name, action: "backup_restored", entityType: "backup", entityId: path.basename(chosen) });
  db.close();
  fs.copyFileSync(chosen, dbPath);
  try { fs.unlinkSync(`${dbPath}-wal`); } catch {}
  try { fs.unlinkSync(`${dbPath}-shm`); } catch {}
  app.relaunch();
  app.exit(0);
  return { ok: true };
});

ipcMain.handle("backup:revealFolder", () => shell.openPath(backupsDir));

/* ------------------------------------------------------------------ */
/* IPC: PDF export                                                       */
/*                                                                        */
/* Reuses Electron's built-in Chromium PDF printer directly on the       */
/* current window — the renderer first swaps the hidden print-only DOM   */
/* to show a printable report (same mechanism already used for           */
/* receipts/invoices), then calls this to render exactly that content    */
/* to a PDF file, no new dependency required.                            */
/* ------------------------------------------------------------------ */
ipcMain.handle("export:pdf", async (_e, { suggestedName }) => {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return { ok: false, message: "No window available." };
  try {
    const pdfBuffer = await win.webContents.printToPDF({ printBackground: true, pageSize: "A4" });
    const res = await dialog.showSaveDialog(win, {
      defaultPath: suggestedName || "export.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (res.canceled || !res.filePath) return { ok: false };
    fs.writeFileSync(res.filePath, pdfBuffer);
    return { ok: true, path: res.filePath };
  } catch (err) {
    return { ok: false, message: err?.message || String(err) };
  }
});

// Auto-backup once per day on launch, keep the last 14
(function autoBackup() {
  const last = db.prepare("SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1").get();
  const dayMs = 24 * 60 * 60 * 1000;
  if (!last || Date.now() - last.created_at > dayMs) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `g2-pos-autobackup-${stamp}.sqlite`;
    const destPath = path.join(backupsDir, filename);
    db.backup(destPath).then(() => {
      const size = fs.statSync(destPath).size;
      db.prepare("INSERT INTO backups (id, filename, created_at, size_bytes, note) VALUES (?,?,?,?,?)").run(uid("bak"), filename, Date.now(), size, "auto");
      const old = db.prepare("SELECT id, filename FROM backups ORDER BY created_at DESC LIMIT -1 OFFSET 14").all();
      for (const o of old) {
        try { fs.unlinkSync(path.join(backupsDir, o.filename)); } catch {}
        db.prepare("DELETE FROM backups WHERE id = ?").run(o.id);
      }
    }).catch(() => {});
  }
})();

ipcMain.handle("terminal:info", () => ({ id: terminalId }));

ipcMain.handle("database:info", () => ({
  path: dbPath,
  schemaVersion: currentSchemaVersion,
}));

/* ------------------------------------------------------------------ */
/* App updates (electron-updater + GitHub Releases)                    */
/*                                                                      */
/* This only ever replaces the installed application files. It never   */
/* touches userData — the SQLite database, documents, and backups all  */
/* live in the OS app-data folder (see "Paths" above), completely      */
/* outside anything electron-builder/electron-updater manage. Updating */
/* the app cannot delete or overwrite business data.                   */
/* ------------------------------------------------------------------ */
ipcMain.handle("app:version", () => app.getVersion());

ipcMain.handle("app:info", () => ({
  version: app.getVersion(),
  schemaVersion: currentSchemaVersion,
  updateConfigured: Boolean(autoUpdater) && !isDev,
}));

function sendUpdateStatus(data) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send("updates:status", data);
  }
}

function configureUpdater() {
  if (!autoUpdater || isDev) return;
  try {
    autoUpdater.autoDownload = false; // never download without the user asking
    autoUpdater.autoInstallOnAppQuit = true; // install a *downloaded* update next natural quit
    autoUpdater.setFeedURL({ provider: "github", owner: UPDATE_OWNER, repo: UPDATE_REPO, releaseType: "release" });

    autoUpdater.on("checking-for-update", () => sendUpdateStatus({ state: "checking", currentVersion: app.getVersion() }));
    autoUpdater.on("update-available", (info) => sendUpdateStatus({
      state: "available", currentVersion: app.getVersion(), version: info.version,
      releaseDate: info.releaseDate || "", releaseNotes: typeof info.releaseNotes === "string" ? info.releaseNotes : "",
    }));
    autoUpdater.on("update-not-available", () => sendUpdateStatus({ state: "up-to-date", currentVersion: app.getVersion() }));
    autoUpdater.on("download-progress", (p) => sendUpdateStatus({
      state: "downloading", percent: p.percent || 0, transferred: p.transferred || 0, total: p.total || 0, bytesPerSecond: p.bytesPerSecond || 0,
    }));
    autoUpdater.on("update-downloaded", (info) => sendUpdateStatus({
      state: "downloaded", currentVersion: app.getVersion(), version: info.version,
      releaseNotes: typeof info.releaseNotes === "string" ? info.releaseNotes : "",
    }));
    autoUpdater.on("error", (error) => sendUpdateStatus({ state: "error", message: error?.message || String(error) }));
  } catch (err) {
    // Never let a bad updater config take the app down with it.
    console.error("Updater configuration failed:", err);
  }
}

async function checkForUpdates() {
  if (!autoUpdater || isDev) {
    const message = isDev ? "Update checking is disabled during development." : "Automatic updates are unavailable.";
    const payload = { state: "disabled", message, currentVersion: app.getVersion() };
    sendUpdateStatus(payload);
    return payload;
  }
  try {
    sendUpdateStatus({ state: "checking", currentVersion: app.getVersion() });
    const result = await autoUpdater.checkForUpdates();
    if (result?.updateInfo?.version && result.updateInfo.version !== app.getVersion()) {
      const info = result.updateInfo;
      const payload = {
        state: "available", currentVersion: app.getVersion(), version: info.version,
        releaseDate: info.releaseDate || "", releaseNotes: typeof info.releaseNotes === "string" ? info.releaseNotes : "",
      };
      sendUpdateStatus(payload);
      return payload;
    }
    const payload = { state: "up-to-date", currentVersion: app.getVersion() };
    sendUpdateStatus(payload);
    return payload;
  } catch (error) {
    const payload = { state: "error", message: error?.message || String(error), currentVersion: app.getVersion() };
    sendUpdateStatus(payload);
    return payload;
  }
}

ipcMain.handle("updates:check", () => checkForUpdates());

ipcMain.handle("updates:download", async () => {
  if (!autoUpdater || isDev) {
    return { state: "disabled", message: "Updates are unavailable during development." };
  }
  try {
    sendUpdateStatus({ state: "downloading", percent: 0 });
    await autoUpdater.downloadUpdate();
    return { state: "downloaded" };
  } catch (error) {
    const payload = { state: "error", message: error?.message || String(error) };
    sendUpdateStatus(payload);
    return payload;
  }
});

ipcMain.handle("updates:install", () => {
  if (!autoUpdater || isDev) {
    return { state: "disabled", message: "Updates are unavailable during development." };
  }
  autoUpdater.quitAndInstall(false, true);
  return { state: "installing" };
});

/* ------------------------------------------------------------------ */
/* Window                                                                */
/* ------------------------------------------------------------------ */
function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    icon: path.join(__dirname, "..", "build", "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Catch-all for any page-load failure — a missing/incomplete dist
  // folder (e.g. packaged before `vite build` actually succeeded), a
  // corrupted install, or anything else that would otherwise leave the
  // window sitting there blank with zero explanation, which is exactly
  // what was reported. errorCode -3 is a load that was aborted/
  // superseded (e.g. a genuine in-app navigation) and isn't a real
  // failure, so it's excluded.
  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return;
    dialog.showErrorBox(
      "G2 POS failed to load",
      `The application window failed to load its content.\n\nURL: ${validatedURL}\nError: ${errorDescription} (${errorCode})\n\nThis usually means the installed copy is incomplete or corrupted. Try reinstalling the latest version. If this keeps happening, please share this exact message with support.`
    );
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    if (!fs.existsSync(indexPath)) {
      // The single most likely cause of a blank window in a packaged
      // build: it was packaged without `dist/` actually being built
      // first (e.g. the build step failed or was skipped), so there's
      // no application content to show at all. Fail loudly here rather
      // than silently loading nothing.
      dialog.showErrorBox(
        "G2 POS is missing application files",
        `Couldn't find the application's built files at:\n${indexPath}\n\nThis copy appears to have been packaged incorrectly — the build step likely didn't complete before packaging. Please reinstall the latest version, or rebuild with "npm run build" completing successfully before packaging.`
      );
      app.exit(1);
      return;
    }
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.mgenerationii.g2pos");
  createWindow();
  configureUpdater();
  // Quietly check on startup (packaged builds only) — this never downloads
  // or installs anything by itself, it only surfaces "an update exists" in
  // Settings so the user can decide.
  if (!isDev) setTimeout(() => { checkForUpdates().catch(() => {}); }, 4000);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
