# Rehearse and execute an approved migration

## Isolated rehearsal

Restore a coordinated backup into isolated database and file stores. Keep production webhook/notification credentials and queue consumers disabled. Securely supply compatible keys only where needed to read restored data; never commit or report them.

Capture representative counts, original user IDs and bindings, foreign keys, attachments, grants, settings and migration checksums. Preserve source migration ownership and compiled manifests; never edit history rows or historical files to hide a mismatch.

## External registration

1. Leave original deployment, data, backups and workers under their owner.
2. Register the exact application entry through authorized UI/API using installed plugin guidance; link visibility alone does not secure the direct external URL.
3. If requested, integrate platform SSO using the approved identity/role mapping and callback. Keep local recovery login.
4. Assign explicit membership, read it back, and verify existing business behavior plus denied direct APIs.
5. Do not create managed templates/instances or claim platform disablement stops the external process. Inspect installed rules before changing immutable URL/type fields.

## Host-managed move

1. Build a compatible relocatable child archive with stable package identity and complete production dependencies; exclude runtime data and secrets.
2. Prepare the approved template/version/environment through `nocobase-app-plugin-multi-app` and follow `nocobase-multi-app-deployment`.
3. Determine migration/initialization timing and fence an empty provisioned volume from users/writers before restoring existing state.
4. Use the installed runtime's supported database/files/configuration restore sequence. Preserve Host-controlled placement, volumes and release/control ownership.
5. Deliver instance-specific SSO settings separately; reconcile base paths, callbacks, public origin, cookies and verified account bindings.
6. Start only approved writers/workers; compare retained data and direct authorization behavior before traffic cutover. Fresh sample data is not retained business data.

## In-place platform integration

Install compatible licensed packages and shared peers through supported tooling, preview registrations, and merge rather than replace native auth/user configuration. Add management/identity contributions without changing existing page/permission IDs or colliding routes.

Apply only reviewed migrations against restored data, verify original login and business APIs together with new management rights, and read back each change. Splitting business databases requires a separate approved plan.

## Cutover and recovery

Obtain explicit secondary confirmation naming destination, data scope, backup, change window and recovery owner. Quiesce old writers/workers, drain or record in-flight effects, take a final consistent backup and repeat only the rehearsed steps. Keep one active writer/worker owner for each data/queue scope.

An issuer change needs coordinated callbacks, client settings and verified subject/account mappings. Stop on collisions rather than creating replacement users. A plan file or source rollback does not perform a data migration.

Verify existing ordinary users, local recovery, SSO, revocation, role downgrade, direct API denial, counts/relations/files, worker uniqueness and restart persistence. On failure keep traffic fenced, inspect uncertain effects and follow the approved recovery decision. Restore matching code/database/files/configuration if backward schema compatibility is absent; destructive reset/rollback requires separate approval.

Keep the original deployment recoverable until explicit acceptance and an agreed retention period. Report unsupported/manual steps and unexecuted checks rather than claiming automated migration.
