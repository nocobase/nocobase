---
title: Backup, recovery and troubleshooting
description: Preserve data and configuration and diagnose deployment failures.
---

# Backup, recovery and troubleshooting

## Backup and recovery

For a standalone App, retain the exact artifact or image digest, runtime configuration and stable secrets, database, uploaded files, and service/proxy configuration. For Hub, also retain its database, Release storage, desired configuration files, and application volumes. External databases and object storage require their own coordinated backups.

Expanded Host revisions are caches, but current startup recovery expects installed revisions to exist. Restoring only the Hub database can require explicit redeployment of the corresponding Release. Preserve Hub's `auth.secret`: recoverable publishing credentials depend on it.

Use a consistent database backup mechanism. Do not copy only a live SQLite main file while writers are active. Restore matching code, database, files and secrets with services stopped, then verify permissions and start. Code rollback does not reverse database migrations.

An application or Hub installed with [app-installer](./app-installer) is backed up automatically before every upgrade: every SQLite database `config.yml` declares, plus `config.yml` and `app.env`, goes into `backups/` in the installation directory. A failed upgrade rolls back by itself, and `rollback` returns to the previous release later, restoring those databases when the upgrade migrated them. That backup leaves out uploaded files and external databases and exists for rolling back; it does not replace the regular backups above.

## Troubleshooting

| Symptom                                                            | Check                                                                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Missing artifact                                                   | Current build output is storage/exports/dist.tar.gz                                                                                                                |
| Native module failure (`ERR_DLOPEN_FAILED`, `NODE_MODULE_VERSION`) | Compare `nocobase.buildTarget` in the artifact's `dist/package.json` with the environment that runs it, then rebuild with matching `--target` and `--node-version` |
| Empty database after deployment                                    | SQLite database path and persistent mounts                                                                                                                         |
| Static assets or callbacks fail                                    | Build/runtime base paths, public origin and forwarded headers                                                                                                      |
| Hub root returns 404                                               | Use the configured Hub path, commonly /hub/                                                                                                                        |
| Hosted App returns 503 or 502                                      | Host readiness, connectivity and runtime logs                                                                                                                      |
| Upload returns 413                                                 | Proxy limit and Hub's 256 MiB artifact limit                                                                                                                       |
| Publishing returns 401 or 403                                      | Key scope, expiry, App binding and creator permissions                                                                                                             |
| Timeout or conflict                                                | Inspect the original deployment before submitting another operation                                                                                                |

Read proxy logs, service/container output, deployment journals, Host logs and App runtime logs in that order. An app-installer installation also keeps pm2's output in `logs/app.out.log` and `logs/app.err.log`, readable with `pm2 logs <name>`. Under the Hub storage root, `APP_STORAGE_DIR`, defaults include `hub/logs/deployments`, `host/logs/host` and `apps/volumes/<appId>/storage/logs`.

## Acceptance

Verify login, authorization, page refresh, APIs, WebSocket connections and actual business operations. Change initial administrator credentials. Check records and uploaded files after service restart and container replacement. For Hub, verify each App after platform restart: Hub readiness does not mean every eager App is already ready. Record exact versions and perform a backup restoration exercise before treating recovery as validated.
