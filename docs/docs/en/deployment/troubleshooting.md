---
title: Troubleshooting
description: Log locations, common symptoms and their resolution for deployment and access failures.
---

# Troubleshooting

This page collects the common failures of the deployment and access stages. Locate the log by stage first, then match the symptom in the tables.

## Locate the log

| Stage                              | Log location                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| The service fails to start         | `docker compose logs --tail=100 crm`, `journalctl -u nocobase-crm -n 100` or `pm2 logs nocobase-crm`            |
| A deployment on Hub fails          | The log of that deployment record in Hub                                                                        |
| Errors after startup               | The application log; for a Hub-hosted application, `apps/volumes/<appId>/storage/logs/` under `APP_STORAGE_DIR` |
| Domain, HTTPS or forwarding faults | The reverse proxy log, combined with the service log                                                            |

For an application installed with app-installer, the output collected by pm2 is also stored in `logs/app.out.log` and `logs/app.err.log` under the installation directory. Hub's own logs are located in `hub/logs/` under `APP_STORAGE_DIR`; deployment logs are stored per application and deployment ID under `hub/logs/deployments/`.

## Startup and data

| Symptom                                                                                    | Check and resolution                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native modules fail to load; the log contains `ERR_DLOPEN_FAILED` or `NODE_MODULE_VERSION` | The build target does not match the runtime environment. Check the server's or the Hub container's architecture, libc and Node major version, and rebuild with the correct `--target` and `--node-version` |
| Existing data is not visible after startup                                                 | Stop the application and check the database connection, the SQLite path and the persistent mount; confirm whether a newly created empty database was connected                                             |
| The database file, uploads or logs cannot be written                                       | Check the service account's write permission on the persistent directory; in Docker, the `node` user has UID 1000                                                                                          |
| Startup reports a secret error                                                             | `auth.secret` or `session.secret` is still the template placeholder                                                                                                                                        |
| The application still fails to start after a rollback                                      | The old version is incompatible with the current database; restore the matching backup taken before the upgrade, then start again                                                                          |

## Access

| Symptom                                                                         | Check and resolution                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The home page works, but refreshing a nested page or loading assets returns 404 | `APP_BASE_PATH` differs from the path forwarded by the reverse proxy, or the reverse proxy does not preserve the path prefix                                                                                         |
| The page opens but sign-in fails                                                | Under `NODE_ENV=production` the cookie is sent only over HTTPS or localhost; check `APP_PUBLIC_ORIGIN` and the forwarded headers                                                                                     |
| WebSocket connections fail                                                      | The reverse proxy does not forward the `Upgrade` and `Connection` headers                                                                                                                                            |
| The Hub domain root returns 404                                                 | Hub is located at `/hub/`, not at the domain root                                                                                                                                                                    |
| Hub is reachable, but a business application returns 502 or 503                 | Check the status and logs of that application and of the Host; the application may still be starting or may have failed to start. An application configured to start on first access starts only when it is accessed |

## Publishing to Hub

| Symptom                                                    | Check and resolution                                                                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| The CLI cannot find the archive                            | Run `pnpm build --tar` first; specify another path with `--file`                                                                                   |
| The `hub deploy` command does not exist                    | The project does not depend on `@nocobase/hub-cli`; run `pnpm add -D @nocobase/hub-cli`. The command is available only in the source project       |
| The upload returns 413                                     | The reverse proxy's request size limit; add `client_max_body_size 260m;` in Nginx. A Release itself is limited to 256 MiB                          |
| 401 or 403 is returned                                     | The API key is invalid, not bound to this application, lacks the upload or deploy permission, or its creator has lost the corresponding permission |
| 409 is returned                                            | The same idempotency key was submitted with different content, or the Release is already uploaded; use `hub deploy --release-id` instead           |
| The CLI exits with code 3                                  | The result is unconfirmed. Review the deployment record in Hub first, then retry with the same `--idempotency-key`                                 |
| The deployment succeeds but the application fails to start | Usually a build target mismatch; see the native modules row above                                                                                  |
| Existing fields are lost after `--config`                  | `--config` replaces the whole configuration; a complete configuration must be submitted                                                            |
