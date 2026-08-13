# M Generation II POS — Production Architecture

React + Vite + Electron + SQLite with database migrations, backup/restore, and a production-ready update framework.

## Development

### macOS

```bash
npm install
npm run dev
```

### Windows

```bat
npm install
npm run dev
```

## Production builds

```bash
npm run dist:mac:universal
```

```bat
npm run dist:win
```

## Data location

The SQLite database is stored under Electron's per-user application-data directory, not inside the installed application. This prevents application updates from overwriting POS data.

## Database migrations

See `MIGRATIONS.md`. Schema migrations execute automatically when the application starts. A pre-migration database copy is created before each pending migration.

## Updates

See `UPDATE-PLAN.md`. The updater is prepared for `electron-updater` with a generic HTTPS feed. Configure the real feed URL before production release; the placeholder URL in `package.json` must not be used in production.
