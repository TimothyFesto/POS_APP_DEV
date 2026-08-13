const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let SQL = null;
let db = null;
let dbPath = null;

// Database migrations are deliberately kept separate from the POS UI.
// Increase this when the database schema changes. Each migration must be
// idempotent in the sense that it is only executed once and is recorded.
const DATABASE_SCHEMA_VERSION = 1;

const MIGRATIONS = [
  {
    version: 1,
    name: 'create-kv-storage',
    up(database) {
      database.run(`CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
    },
  },
];

function assertReady() {
  if (!db) throw new Error('Database is not initialized');
}

function persist() {
  assertReady();
  const bytes = db.export();
  const temp = `${dbPath}.tmp`;
  fs.writeFileSync(temp, Buffer.from(bytes));
  fs.renameSync(temp, dbPath);
}

function ensureMigrationTable() {
  db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

function getAppliedVersions() {
  const result = db.exec('SELECT version FROM schema_migrations ORDER BY version');
  if (!result.length) return new Set();
  return new Set(result[0].values.map(([version]) => Number(version)));
}

function createMigrationBackup(version) {
  if (!fs.existsSync(dbPath)) return null;
  const backupDir = path.join(path.dirname(dbPath), 'migration-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupDir, `pos-before-migration-v${version}-${timestamp}.sqlite`);
  fs.copyFileSync(dbPath, target);
  return target;
}

function runMigrations() {
  ensureMigrationTable();
  const applied = getAppliedVersions();
  const pending = MIGRATIONS.filter((migration) => !applied.has(migration.version))
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    const backupPath = createMigrationBackup(migration.version);
    try {
      db.run('BEGIN');
      migration.up(db);
      const stmt = db.prepare('INSERT INTO schema_migrations(version, name) VALUES(?, ?)');
      stmt.run([migration.version, migration.name]);
      stmt.free();
      db.run('COMMIT');
      persist();
    } catch (error) {
      try { db.run('ROLLBACK'); } catch {}
      const backupNote = backupPath ? ` A pre-migration backup was created at: ${backupPath}` : '';
      throw new Error(`Database migration v${migration.version} failed.${backupNote} ${error.message}`);
    }
  }

  if (pending.length) persist();
}

async function initDatabase(filePath) {
  dbPath = filePath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  SQL = await initSqlJs({
    locateFile: (file) => require.resolve(`sql.js/dist/${file}`),
  });

  if (fs.existsSync(dbPath)) {
    const bytes = fs.readFileSync(dbPath);
    db = new SQL.Database(bytes);
  } else {
    db = new SQL.Database();
  }

  runMigrations();

  const current = getSchemaVersion();
  if (current > DATABASE_SCHEMA_VERSION) {
    throw new Error(`Database schema v${current} is newer than this POS supports (v${DATABASE_SCHEMA_VERSION}). Please update the application.`);
  }
}

function getSchemaVersion() {
  assertReady();
  const result = db.exec('SELECT MAX(version) AS version FROM schema_migrations');
  if (!result.length || !result[0].values.length) return 0;
  return Number(result[0].values[0][0] || 0);
}

function get(key) {
  assertReady();
  const stmt = db.prepare('SELECT value FROM kv WHERE key = ?');
  stmt.bind([key]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row ? row.value : null;
}

function set(key, value) {
  assertReady();
  const stmt = db.prepare(`INSERT INTO kv(key, value, updated_at) VALUES(?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`);
  stmt.run([key, value]);
  stmt.free();
  persist();
}

function remove(key) {
  assertReady();
  const stmt = db.prepare('DELETE FROM kv WHERE key = ?');
  stmt.run([key]);
  stmt.free();
  persist();
}

function listKeys() {
  assertReady();
  const result = db.exec('SELECT key, updated_at FROM kv ORDER BY key');
  if (!result.length) return [];
  return result[0].values.map(([key, updatedAt]) => ({ key, updatedAt }));
}

function validateDatabase(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    const testDb = new SQL.Database(fs.readFileSync(filePath));
    const result = testDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='kv'");
    testDb.close();
    return result.length > 0 && result[0].values.length > 0;
  } catch {
    return false;
  }
}

function backup(targetPath) {
  assertReady();
  persist();
  fs.copyFileSync(dbPath, targetPath);
  return targetPath;
}

async function restore(sourcePath) {
  assertReady();
  if (!validateDatabase(sourcePath)) throw new Error('The selected file is not a valid M Generation II POS database backup.');
  const bytes = fs.readFileSync(sourcePath);
  const replacement = new SQL.Database(bytes);
  db.close();
  db = replacement;
  // A restored database may be from an older release, so run any available migrations.
  runMigrations();
  persist();
}

function getDatabasePath() {
  return dbPath;
}

function getDatabaseInfo() {
  assertReady();
  return {
    path: dbPath,
    schemaVersion: getSchemaVersion(),
    supportedSchemaVersion: DATABASE_SCHEMA_VERSION,
    migrationBackupsDirectory: path.join(path.dirname(dbPath), 'migration-backups'),
  };
}

module.exports = {
  initDatabase,
  get,
  set,
  remove,
  listKeys,
  backup,
  restore,
  validateDatabase,
  getDatabasePath,
  getDatabaseInfo,
};
