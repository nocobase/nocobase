---
title: Troubleshooting
description: Log locations, common symptoms and their resolution for deployment and access failures.
---

# Troubleshooting

This page collects the common failures of the deployment and access stages. Locate the log by stage first, then match the symptom in the tables.

## Locate the log

| Stage                              | Log location                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| The service fails to start         | `docker compose logs --tail=100 crm`, `journalctl -u nocobase-crm -n 100` or `pm2 logs nocobase-crm` |
| Errors after startup               | The application log                                                                                  |
| Domain, HTTPS or forwarding faults | The reverse proxy log, combined with the service log                                                 |

For an application installed with app-installer, the output collected by pm2 is also stored in `logs/app.out.log` and `logs/app.err.log` under the installation directory.

## Startup and data

| Symptom                                                                                    | Check and resolution                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Native modules fail to load; the log contains `ERR_DLOPEN_FAILED` or `NODE_MODULE_VERSION` | The build target does not match the runtime environment. Check the server's architecture, libc and Node major version, and rebuild with the correct `--target` and `--node-version`              |
| Existing data is not visible after startup                                                 | Stop the application and check the database connection, the SQLite path and the persistent mount; confirm whether a newly created empty database was connected                                   |
| The database file, uploads or logs cannot be written                                       | Check the service account's write permission on the persistent directory; in Docker, the `node` user has UID 1000                                                                                |
| Startup reports a secret error                                                             | `secrets.keys` is missing, holds the template placeholder or a key shorter than 32 bytes, or `auth.secret` or `session.secret` is still the template placeholder; `config check` names the field |
| The application still fails to start after a rollback                                      | The old version is incompatible with the current database; restore the matching backup taken before the upgrade, then start again                                                                |

## Access

| Symptom                                                                         | Check and resolution                                                                                                             |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| The home page works, but refreshing a nested page or loading assets returns 404 | `APP_BASE_PATH` differs from the path forwarded by the reverse proxy, or the reverse proxy does not preserve the path prefix     |
| The page opens but sign-in fails                                                | Under `NODE_ENV=production` the cookie is sent only over HTTPS or localhost; check `APP_PUBLIC_ORIGIN` and the forwarded headers |
| WebSocket connections fail                                                      | The reverse proxy does not forward the `Upgrade` and `Connection` headers                                                        |
