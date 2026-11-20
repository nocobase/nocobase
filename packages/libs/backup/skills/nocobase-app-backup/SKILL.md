---
name: nocobase-app-backup
description: Create, inspect, verify, and restore NocoBase 3 application database and upload backups. Use for app-level backups in code, deployment rollback, or offline database and file recovery.
---

# Back up and restore a NocoBase application

Use the same application version and secrets key versions for backup and restore. For rollback, switch the deployment back to the version in the backup manifest before restoring. Keep the app and its supervisor stopped during restore. Use the same application storage volume for the app and the command so they share startup and Drive coordination. Stop replicas on other volumes and keep them stopped for the full operation.

Backups are unencrypted. Restrict access to the archive and to the directory used for temporary work. Keep the SHA-256 separately so it can be checked before restore.

## CLI

In source use `pnpm nocobase`. In a built deployment use `node dist/cli/index.js` from the application directory or `node cli/index.js` from the deployment directory. Use `commands --json` on the installed CLI to confirm that it exposes the four backup commands.

```sh
pnpm nocobase backup create --output ./backups/app.tar.gz --json
pnpm nocobase backup inspect ./backups/app.tar.gz --json
pnpm nocobase backup verify ./backups/app.tar.gz --sha256 "$BACKUP_SHA256" --json
pnpm nocobase backup restore ./backups/app.tar.gz --sha256 "$BACKUP_SHA256" --json
```

Create the output directory first. Keep the output directory separate from a disk root. The CLI checks the current target in `verify`. Use `verify --archive-only` to check integrity independently of the target. Use `--offline` on `create` to require a stopped application.

- Backup defaults to managed connections and configured disks. Use repeatable `--include-connection`, `--exclude-connection`, `--include-disk` and `--exclude-disk` to select targets. For example, `--exclude-disk deployment-artifacts` preserves the artifacts disk when that is its configured name.
- Restore only named databases with repeatable `--connection <name>` and `--allow-partial`. Use `--files-only` to restore local files and leave database recovery to the operator.
- Provision versioning for S3 or OSS and restore objects through that service. The archive records remote disk references.
- Read each connection's mode and the archive's limitations. `partial-success` on create means at least one database requires external recovery. Restore reports missing file references and includes per-connection rollback status on failure.
- SIGINT and SIGTERM abort the operation and clean working files. A later backup can remove unpublished scratch owned by an identifiable dead process in the same process namespace. Keep retained pre-restore database exports and disk recovery directories after a forced termination or rollback failure until recovery is complete.

## Library integration

```ts
import { resolveAppBackupTarget } from '@nocobase/app-server';
import { createBackup, inspectBackup, verifyBackup } from '@nocobase/backup';

const target = await resolveAppBackupTarget(app);
const saved = await createBackup(target, {
  output: '/srv/backups/app.tar.gz',
  excludeDisks: ['deployment-artifacts'],
});
const manifest = await inspectBackup(saved.file);
const verified = await verifyBackup(saved.file, {
  target,
  sha256: saved.sha256,
});
```

Store `saved.sha256` and the per-connection modes with the backup record. Pass an `AbortSignal` when cancellation is available. Run restore through the stopped application's CLI.

The app resolver reads migration history and file references from the exported snapshot. It detects tables with physical `disk` and `key` columns. Configure other layouts in `backup.fileReferences` with `table`, `keyColumn`, and either `disk` or `diskColumn`. Set `connection` for a non-default connection and `schema` when needed. Add `keyPrefix` when the database stores keys relative to a subdirectory of the disk. Set `backup.excludePaths` to paths relative to each fs disk root for additional runtime directories or configuration files to preserve.

Declare a dedicated database per PostgreSQL or MySQL connection. Use standard Drive filesystem disk definitions to include their bytes and coordinate deletion. Use local or shared filesystems that support atomic hard links for publishing archives and SQLite filesystem locks for coordination.

## Database clients and recovery

The command invokes clients on the application host. Install compatible binaries in its environment or set `backup.tools` with `pgDump`, `pgRestore`, `psql`, `mysqlDump`, `mysql`, `mariadbDump`, and `mariadb` as applicable. Relative executable paths and CA files resolve from the deployment root. Provide `backup.connections.<name>.tls` with `mode` and a `caFile` when the clients require explicit TLS settings. Use `verify-full` for certificate and host verification or `require` for TLS encryption. The library passes passwords through private temporary client files.

| Database   | Clients and privileges                                                                                                                                                                                                                                                                                                                                                                                   | Recovery                                                                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQLite     | Filesystem read for create, write for restore.                                                                                                                                                                                                                                                                                                                                                           | Stop the app and restore the database and files through the CLI.                                                                                                     |
| PostgreSQL | Compatible `pg_dump`, `pg_restore` and `psql`. Export needs read access to schemas and objects. Restore needs ownership or privileges to drop and recreate application schemas, objects, grants and extensions.                                                                                                                                                                                          | Stop the app and restore through the CLI. PostgreSQL applies the dump and schema cleanup in one transaction.                                                         |
| MySQL      | Oracle `mysqldump` and `mysql` for the server version. Export needs `SELECT`, `SHOW VIEW`, `TRIGGER`, `EVENT`, access to stored routine definitions, and `LOCK TABLES` for offline backup of non-InnoDB tables. Restore needs privileges to drop and recreate the dumped objects, write data and preserve definers where applicable. `PROCESS` lets the stop check see sessions owned by other accounts. | Stop the app and restore through the CLI. The library captures the current database before executing nontransactional DDL and imports that capture if restore fails. |
| MariaDB    | `mariadb-dump` and `mariadb` for the server version. Apply the corresponding object privileges above. On 10.11 routine export also needs `SELECT` on `mysql.proc`.                                                                                                                                                                                                                                       | Stop the app and restore through the CLI. The library detects MariaDB from the server version and uses its clients.                                                  |

For a managed database that supports point-in-time recovery, set `backup.connections.<name>.hosting: managed` to allow a recovery point if SQL export is denied. Inspect the archive for the timestamp and, where available, PostgreSQL WAL position. Restore the database through the provider before running `backup restore <file> --files-only`. In a mixed archive, restore other databases separately using the explicit partial options as needed.

## Integration versions

| Consumer                        | Candidate versions from the current Changesets plan                  | Confirmation                                                          |
| ------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Platform daily or manual backup | `@nocobase/backup@0.1.0-beta.0`, `@nocobase/app-server@5.0.0-beta.9` | Pending release PR and published packages.                            |
| Tenant deployment rollback      | `@nocobase/app-cli@1.0.0-beta.38` in the tenant build                | Pending release PR and a tenant build that exposes all four commands. |

Candidates come from `pnpm exec changeset status --since origin/v3` in the source workspace. Use the release PR and published deployment manifest to confirm the exact versions before pinning a consumer.
