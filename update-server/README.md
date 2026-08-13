# M Generation II POS update server

1. Build a release with electron-builder.
2. Copy the generated update metadata and installer artifacts into `update-server/releases/`.
3. Serve this folder over HTTPS in production.
4. Set `MGEN_POS_UPDATE_URL` when packaging the application, or replace the generic publish URL in `package.json` with your permanent HTTPS update URL.

The POS updater expects electron-builder metadata such as `latest.yml` for Windows and `latest-mac.yml` for macOS.

Do not put the SQLite database on this server. The update server contains application releases only.
