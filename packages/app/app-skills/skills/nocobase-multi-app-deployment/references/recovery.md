# Observe failures and recover safely

## Inspect before retry

Record safe operation/instance/deployment IDs, phase, status, expected revision, artifact checksum and error code. Use authorized management and redacted logs. Read the live API document with an existing session or user-supplied key; do not create privileged keys for diagnosis.

A lost response may follow a completed effect. Use the installed multi-app Skill to reconcile the existing operation before retrying. Retain the logical request's submission key for transport retries; a genuinely new approved recovery operation uses its own identity. Never clear locks, state rows or migration checksums manually.

Authorization revocation may legitimately stop further effects. Do not repair it with a hidden privileged caller or broad grants. On a tool/security refusal stop the refused operation, report it and continue only independent authorized work.

## Failure map

| Symptom                                      | Inspect first                                                                                           | Do not do                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Build downloads a missing commercial package | Failing App/dist install, declared versions, approved package source and independent dependency closure | Treat dev installation as a complete archive or bypass tool protection |
| Child enrollment fails                       | Actual callback, issuer, actor rights and persisted environment URL                                     | Weaken HTTPS/callback restrictions or recreate instances blindly       |
| Discovery/provider unavailable               | Child-server DNS, TLS trust, reachability and startup configuration                                     | Repeated browser retries without fixing the provider                   |
| Native module unavailable                    | Artifact target, Node ABI and runtime architecture                                                      | Copy foreign-platform binaries                                         |
| Main works, child fails                      | Forwarding, exact path, runtime state and Host registration                                             | Guess another origin or modify unrelated proxy sites                   |
| SSO denied                                   | Membership, disabled accounts and effective child grants                                                | Grant unrestricted permissions to all users                            |
| Stopped instance receives requests           | Intended stopped state and final Host registration semantics                                            | Wake it silently or delete its volume                                  |
| Migration/checksum error                     | Original task sources/owner, compiled manifests and recovery plan                                       | Edit history or auto-run reset/repair                                  |

If explicit initialization was interrupted, inspect existing instances and intended named-administrator memberships. Preparation skips existing instances; rerunning it is not proof later setup steps will be reconciled. Make only an approved minimal repair through the supported surface and read it back.

## Coordinated backup and recovery

Protect backups like production. Include Main database/configuration, stable encryption/signing keys, artifact/release/control metadata, affected child databases/files/volumes and external object stores as required. Use database-supported backup tools or approved quiesced snapshots; a live file copy is not automatically consistent.

Rehearse restore in isolation before risky changes. Code rollback is safe only if the migrated schema is backward-compatible; otherwise restore matching code/database/files/configuration with explicit approval. Stop affected writers before restore. Do not rotate keys or reset accounts as a substitute for a missing historical encryption-purpose compatibility plan.

## Origin and identity changes

Inventory Main origin/base path, persisted environment URL, registered callbacks/entries, child issuer/navigation settings, proxy routing and verified native bindings. Changing root configuration alone does not migrate these records.

Preserve existing `PLATFORM_SSO_IDENTITY_NAMESPACE` where appropriate; it does not bypass transport checks or authorize silent account linking. Retain user IDs and subject associations. Confirm installed rules for external URL/type immutability and plan replacement registrations deliberately. Stop on collisions, then restart/redeploy only the affected applications after approved configuration changes.

Close recovery only after a real platform session, child business action, denied access after approved revocation, retained data after restart and unchanged intentionally stopped/unrelated services. Keep safe identifiers and pending evidence, never credentials.
