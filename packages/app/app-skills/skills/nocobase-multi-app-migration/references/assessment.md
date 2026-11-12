# Assess an existing application

## Inventory without mutation

Record exact source/destination deployments, revisions, package versions and ownership. Inspect configuration declarations and safe metadata without dumping secrets. Inventory:

- Business routes/page IDs, permission resources, plugins, shell customizations and integrations.
- Executed migrations, original sources, owner/name/checksums and database drivers/schema.
- Local user IDs, native/provider account bindings, sessions, grants and inherited grant sources.
- Business foreign keys, representative record counts, attachments and external object stores.
- Encryption/signing compatibility and secure key references, never key values.
- Schedules, workers, queues, callbacks, origin/base path and hard-coded URL assumptions.
- Artifacts, persistent paths, backup/restore tooling, process ownership and change window.

The Main-only template is a new application starting point, not a migration tool. Do not copy either App over a populated installation or assume newer package versions are compatible. Use the installed application upgrade Skill when framework/template alignment is necessary.

## Choose one primary route

| Route                     | Changes                                             | Retains                                                       | Principal gate                                                   |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| External registration     | Catalog entry and optional SSO                      | Existing hosting, database, files and releases                | Exact entry, explicit admission and reviewed account mapping     |
| Host-managed child        | Independent artifact and approved runtime/data move | Business code, user IDs, required migration history and data  | Restored-data rehearsal, mount paths and unique worker ownership |
| Existing App becomes Main | Compatible management/identity composition          | Existing App and business database unless a split is approved | No auth/route/config conflict and original business still works  |

Recommend external registration for a unified entry with minimal deployment change, but obtain the user's choice before mutation. Do not choose it when managed lifecycle is required, or migrate a database just to add a link.

An archive delivers code and production dependencies, not an existing database or volume. Determine and rehearse a supported restore/connect sequence for the installed Host/runtime; do not promise a universal volume importer.

For in-place integration merge public registrations, auth plugins, configuration, providers, routes, locales and permission declarations. Existing business pages and users remain unless the user explicitly approves a domain split.

## Decide identity and compatibility

Determine whether users remain child-local with platform bindings or become the platform identity population. Map original business user IDs to verified subjects through an approved application-owned migration/service; platform SSO does not silently merge by email.

Preserve native account associations, business relations and unrelated roles. Admission/membership and business permissions are separate. Record reader/editor meanings against the installed contract, not as universal replacements for existing roles.

Preserve stable `PLATFORM_SSO_IDENTITY_NAMESPACE` values used by existing same-platform bindings. A changed issuer, namespace, package owner or encryption purpose requires explicit compatibility analysis; none authorizes deleting old accounts or encrypted records.

Stop before cutover if original migration sources, readable secrets, account mappings, compatible artifacts or coordinated backup/recovery evidence are missing. Return the selected route, retained assets, mappings, version alignment, downtime, rehearsal and unresolved gates for approval.
