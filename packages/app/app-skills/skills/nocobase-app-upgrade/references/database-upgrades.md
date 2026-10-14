# Database upgrades

Use this procedure when a template or dependency upgrade changes migrations, or when an upgrade reports checksum drift. Read the target versions' changelogs and upgrade notes for the application and its registered plugins. The template source diff alone does not show plugin migrations. Match each instruction to the installed versions, configured dialect, connection, and execution history; do not replay every historical upgrade instruction.

## Before applying migrations

Identify the database the target application will use and whether startup applies migrations or seeds automatically. Finish the applicable checks before starting it against retained data. A source branch, an older archive, or a successful build is not a database backup: have a restorable database backup and coordinate files or object storage when the upgrade affects their references. Record any irreversible migrations and whether the previous runtime can use the resulting schema.

Use the CLI from the target packages with the intended application's configuration and environment. In a source project, invoke `pnpm nocobase`; for a built application, use `node dist/cli/index.js` in its deployment context, preserving its config, environment, and storage paths. Do not run a development checkout against production as a shortcut. For an app-installer installation, retain the installer's lifecycle and configuration handling; if its supported workflow cannot perform a required release-specific preparation, establish that procedure before retrying the upgrade.

Preview pending work with the target CLI:

```bash
pnpm nocobase db apply --dry-run --json
```

The default connection is selected unless `--connection <name>` or `--all` is supplied. Keep preview, repair, and apply scoped to the same intended managed connections; plugins contribute to the default connection. A dry run lists work without executing migration bodies, so it does not prove that existing data satisfies a new bound or constraint. Check documented data prerequisites separately. A strict checksum policy can reject even this preview until the reviewed drift is acknowledged.

## Review checksum drift

Checksum repair is conditional, not a routine upgrade step. If a target release documents a correction to an executed migration, or drift appears during the preview, inspect it first:

```bash
pnpm nocobase db repair --dry-run --json
```

Match every proposed change to its owning package, migration or seed name, and the documented source change. `db repair` updates all mismatching executed migration and seed checksums in the selected connections; it has no per-migration allowlist. An unexplained entry means investigate before repairing that connection, even when other entries are expected. Do not weaken the checksum policy, edit migration sources or history by hand, or use `db reset` or `db redo` to bypass the failure.

Once every proposed checksum change is explained and the operation is within the authorized upgrade scope, acknowledge it with the same target sources and connection selection:

```bash
pnpm nocobase db repair --json
```

The CLI confirms before writing; non-interactive execution requires `--force`. Use that flag only for the reviewed repair already authorized by the user. Repair changes recorded checksums only: it does not rerun migrations, change schema or business data, or make a failed migration count as successful. An upstream fix that changes an old schema still needs its forward migration after repair. This procedure does not authorize editing merged migrations yourself.

## Apply and verify

After any required repair and data preparation, repeat the apply preview and execute `pnpm nocobase db apply --json` for a source application within the authorized upgrade scope. For a deployment, use its migration step or the installer's upgrade operation instead. Check the command result and relevant application behavior, including reads and writes affected by the migration; a running process alone is insufficient. Keep the reviewed checksum changes, migration results, and recovery path in the upgrade report.

If a migration rejects existing data, preserve it and resolve the reported records under a data migration plan before retrying. For example, shortening a stored archive key without moving the corresponding archive breaks downloads. Do not silently truncate data to make a constraint pass.

MySQL DDL can leave partial tables or indexes after a failed migration without a successful history entry. Checksum repair cannot reconcile those objects. Preserve a database containing application data and diagnose the partial schema before retrying. A new empty database is appropriate only when the failed installation is confirmed disposable; never infer that from a missing history entry.

## Recovery after a schema change

A code rollback does not run migration `down()` methods. If the applied correction is irreversible and the old runtime requires the old schema, restore a compatible backup together with the matching runtime, configuration, and file storage. Account for writes since the backup. Do not promise that `db rollback` or `db redo` can reverse an irreversible migration.

app-installer can restore the SQLite databases it backed up. It does not back up or restore external MySQL, PostgreSQL, or SQL Server databases; `--backup-done` acknowledges an operator backup, not automatic restoration. An exit reporting that the previous release is running does not prove an external database was restored. Use `--no-restore` only when retaining the upgraded schema is an intentional, verified compatible choice.

## Known correction: agents and releases MySQL indexes

When the installed plugins cross the index correction described in the [agents upgrade notes](https://github.com/nocobase/nocobase/blob/943a9a8a80cc1f76c7a01ecd4965a2a0c51be1eb/packages/plugins/app-plugin-agents/docs/mysql-installation-upgrade.md) or [releases upgrade notes](https://github.com/nocobase/nocobase/blob/943a9a8a80cc1f76c7a01ecd4965a2a0c51be1eb/packages/plugins/app-plugin-releases/docs/mysql-installation-upgrade.md), check these task identities against the target sources and database history:

| Registered plugin               | Corrected creation migration     | Forward correction                     |
| ------------------------------- | -------------------------------- | -------------------------------------- |
| `@nocobase/app-plugin-agents`   | `202610020003_ag_create_runs`    | `202610260001_ag_drop_directory_index` |
| `@nocobase/app-plugin-releases` | `202610020001_rel_create_tables` | `202610260002_rel_bound_artifact_keys` |

The documented checksum changes apply to installations that executed the old creation sources on any supported dialect, not only MySQL. Only installed plugins are relevant. New databases that run the corrected sources need no checksum acknowledgment; their forward corrections may skip without a history entry. Existing old schemas require the forward corrections, which are irreversible when applied. The releases correction rejects archive keys longer than 172 characters before changing the schema; follow the release notes for data handling rather than rewriting keys independently of stored archives. Treat any other checksum difference as separate evidence to investigate.
