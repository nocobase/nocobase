# @nocobase/backup

The library creates, verifies, inspects, and restores application database and upload backups. It accepts a resolved target so callers can reuse it in both a running application and an offline command. Each PostgreSQL or MySQL connection requires a dedicated database. A PostgreSQL backup includes all user schemas in that database.

## Library API

```ts
import {
  createBackup,
  inspectBackup,
  restoreBackup,
  verifyBackup,
} from '@nocobase/backup';

const saved = await createBackup(target, { output: '/srv/backups/app.tar.gz' });
const manifest = await inspectBackup(saved.file);
const verified = await verifyBackup(saved.file, {
  target,
  sha256: saved.sha256,
});

if (verified.ok) {
  const restored = await restoreBackup(saved.file, target, {
    sha256: saved.sha256,
  });
  console.log(restored.connections, restored.disks, restored.missingFiles);
}
```

- Supply resolved connections and disks, application identity and version, and the SHA-256 fingerprints of values derived from the application keyring for the backup purpose. Keep any file containing keyring credentials or configuration secrets out of the file payload via `skipPaths`.
- Implement `readMigrations(reader)` and optional `readFileReferences(reader)` using the provided reader's table and column methods. Return migrations in applied order. The reader sees the exported SQLite database, the PostgreSQL transaction shared with `pg_dump`, or the rows in the actual MySQL or MariaDB SQL dump. Implement `readMigrationCatalog()` using the current application's migration sources so a failed upgrade's live migration ledger cannot block restoration of a compatible earlier snapshot.
- Supply `withDeferredDeletes(disks, operation, findCapturedDisk)` when backing up local files online. Hold the Drive deletion deferral from before the first database snapshot through file copying and reference checks. After `operation` succeeds, `findCapturedDisk` identifies which disk contributed an absolute file path to the archive, so the guard can reject replacements of captured files before publication. Supply `withStoppedApp(operation)` when restoring or passing `online: false`. This guard confirms shutdown and prevents application startup for the duration of the operation.
- Use `includeConnections` and `includeDisks` as allowlists, or use `excludeConnections` and `excludeDisks` to remove specific targets from the defaults. The defaults include managed connections and all disks. S3 and OSS disks record bucket and prefix. Supply `remoteFileExists` to check referenced objects on remote disks after restoration.
- Set `skipPaths` to the absolute paths of application runtime directories. SQLite files and their sidecars, nested disk roots, and backup workspace and output directories are skipped automatically. Use a separate output directory when the requested output would sit directly in a disk root.
- Pass an `AbortSignal` to stop a running operation. The CLI should connect SIGINT and SIGTERM to the signal. An operation can remove unpublished scratch owned by an identifiable dead process in the same process namespace. Preserve restore recovery directories if the operator still needs their contents.

`inspectBackup` checks the gzip archive, manifest, inventory, and file digests without needing database clients. `verifyBackup` also checks the native dumps and can check application compatibility with a supplied target. A supplied `sha256` authenticates the complete file against a digest obtained through a trusted channel. Backups contain unencrypted data. Restore archives from trusted sources. SQLite and MySQL record when export started. The source can continue changing during an online export.

Connections are checked before any overwrite. The library exports the current state of every connection it will change, before restoring the first. Restore failures report statuses and retained recovery paths through `BackupError.details`. Explicit partial restore requires `connections` and `allowPartial: true` and restores only the named databases. For `filesOnly: true`, restore the database to the requested recovery point externally first.

## Database clients and permissions

- **SQLite.** Use a file-backed database. The executing user needs read access for backup and write access to the database and its directory for restore.
- **PostgreSQL.** Install a matching `pg_dump`, `pg_restore`, and `psql`. Give the backup account access to the database, its schemas, and the objects being dumped. Use an owner role with permission to recreate those objects on restore. The restore clears user schemas and applies the generated `pg_restore --clean` script in a single transaction. [PostgreSQL documentation](https://www.postgresql.org/docs/16/app-pgrestore.html)
- **MySQL.** Install Oracle's `mysqldump` and `mysql`. Grant the export account `SELECT`, `SHOW VIEW`, `TRIGGER`, `EVENT`, and access to routine definitions. Offline backup of non-InnoDB tables also needs `LOCK TABLES`. For restore, grant the account the privileges required to drop and recreate the dumped objects and apply their data, including privileges to restore other accounts' definers when applicable. [MySQL 8.4 documentation](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html)
- **MariaDB.** Install `mariadb-dump` and `mariadb`. Use the corresponding MySQL object permissions and `SELECT` on `mysql.proc` for routine definitions on MariaDB 10.11. [MariaDB documentation](https://mariadb.com/docs/server/clients-and-utilities/backup-restore-and-import-clients/mariadb-dump)
- **Managed PostgreSQL and MySQL.** Set `hosting: 'managed'` to allow automatic external recovery-point mode when the server denies logical export permissions. Ensure the operator has point-in-time recovery enabled. The manifest records `recovery-point` and the server timestamp, plus the PostgreSQL WAL position when available. Fix local client, transport, cancellation, and integrity failures before retrying.

For a deployed app, use matched tools available on `PATH` or pass the executable paths via `target.tools`. The native tool processes receive credentials via private files in the operation's temporary directory.

## Verification

SQLite tests run through `pnpm --filter @nocobase/backup test`. Run the PostgreSQL and MySQL integration suites through `pnpm test:db <dialect> --filter @nocobase/backup -- tests/integration/server-roundtrip.test.ts`. For a separately provisioned local PostgreSQL, MySQL, or MariaDB test server with matching native clients on `PATH`, set `BACKUP_TEST_DIALECT`, `POSTGRES_PORT` or `MYSQL_PORT`, `BACKUP_TEST_USER`, and `BACKUP_TEST_PASSWORD` and run `pnpm --filter @nocobase/backup test tests/integration`. Use a disposable server because the tests create and drop databases.

Application and CLI integration is covered by the [application backup Skill](skills/nocobase-app-backup/SKILL.md).
