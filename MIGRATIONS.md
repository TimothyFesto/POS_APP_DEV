# M Generation II POS database migrations

The production POS keeps its SQLite database outside the installed application, under Electron's `userData` directory.

## Rules

1. Never delete or replace `pos.sqlite` during an application update.
2. Increase `DATABASE_SCHEMA_VERSION` in `electron/database.cjs` when the schema changes.
3. Add a new migration to `MIGRATIONS` with a unique integer version and descriptive name.
4. Migrations run in ascending order at startup.
5. A pre-migration copy is created under `data/migration-backups/` before each pending migration when a database already exists.
6. Each migration is wrapped in a SQLite transaction. If it fails, the transaction is rolled back.
7. Restoring an older valid POS backup also runs pending migrations.
8. If a database is newer than the application supports, startup stops with an explicit error rather than downgrading or destroying the database.

## Example future migration

```js
{
  version: 2,
  name: 'add-audit-log',
  up(database) {
    database.run(`CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  },
},
```

Do not edit an already released migration. Add a new version instead.
