# Light Extension

`@nocobase/plugin-light-extension` adds repository-backed, multi-file RunJS authoring to NocoBase. It keeps source management separate from plugin packages while reusing the shared RunJS compiler, artifact format, runtime, and standard client-v2 JS models.

## Domain boundaries

- A light extension repository is not a NocoBase plugin package and has no plugin lifecycle hooks
- Entries cannot define collections, migrations, server resources, middleware, ACL rules, app providers, or package dependencies
- The local repository is the source of truth for source files, Entry metadata, runtime artifacts, settings, and references
- Repository creation and source changes are compile-gated and atomic
- Runtime resolution is available to logged-in page users; authoring and repository management require `pm.light-extension`
- The legacy admin shell only provides the settings-page bridge needed during the client-v2 transition

Light Extension does not create repositories or move inline code automatically. Both operations require an explicit authoring action.

## Entry and UI contract

Light Extension supports five Entry kinds:

| Entry kind | JS surface | Source root |
| --- | --- | --- |
| `js-block` | JS Block | `src/client/js-blocks/<entry-name>/` |
| `js-page` | JS Page | `src/client/js-pages/<entry-name>/` |
| `js-field` | JS Field, editable JS Field, and JS Column | `src/client/js-fields/<entry-name>/` |
| `js-action` | JS Action families | `src/client/js-actions/<entry-name>/` |
| `js-item` | JS Item families | `src/client/js-items/<entry-name>/` |

JS Column reuses `js-field`; `category: "js-column"` provides column-specific presentation. Generic JavaScript in defaults, assignment rules, linkage rules, custom variables, workflow nodes, charts, and similar nested settings remains inline-only.

Selecting an Entry creates the standard JS model shape with a source binding. The plugin does not add parallel Light Extension model classes. Direct-create menus cover blocks, supported actions, form/details fields, and table columns.

`entry.json.key` is the stable source identity. It must be a lowercase slug and unique within the repository target and kind. Renaming a directory while keeping the key preserves `entryId`, runtime bindings, and references; changing the key creates a new identity.

## Inline and repository source

Existing JS surfaces remain compatible:

- Missing `sourceMode` means `inline`
- `sourceMode: "inline"` executes the owner's inline code
- `sourceMode: "light-extension"` resolves the bound Entry artifact
- A bound owner retains its previous inline `code`, `version`, and `sourceRef` as a compatibility fallback
- Editing the retained fallback does not change the active runtime while the external binding remains active

Inline RunJS workspaces use `runJSSources:open` or `runJSSources:openLatest`, followed by delta `runJSSources:saveChanges`. Omitted paths remain unchanged, deletions require `operation: "delete"`, and updates carry the opened file's `blobHash`.

Repository-backed source uses the light-extension domain APIs. Raw `runJSSources`, VSC resources, direct artifact writes, and ZIP round-trips are not alternate save paths for an active repository.

## Check and Save

The repository authoring flow is:

1. Pull the repository or bound Entry and retain its Head as `expectedHeadCommitId`
2. Send the complete working copy to `lightExtensions:compileWorkspacePreview`
3. Stop on HTTP 207 or 422; Check never persists source or executes the returned artifact
4. Send only the reviewed delta to `lightExtensionFiles:saveSource` with the unchanged `expectedHeadCommitId`
5. On HTTP 409, pull again and rebuild the candidate from the new Head

Save materializes the complete candidate before validating and compiling it. The publish transaction rechecks the Head, then commits source, Entry rows, immutable artifacts, references, and audit state together.

| Result | Contract |
| --- | --- |
| Valid delta | Source Head and affected runtime artifacts advance together |
| Validation or compile failure | Returns HTTP 422 and rolls back source, Head, artifacts, entries, and references |
| Stale Head | Returns HTTP 409 without reusing the stale candidate |
| Empty delta | Returns the VSC `NO_CHANGES` error |
| Archived repository | Returns `LIGHT_EXTENSION_REPO_ARCHIVED` |

The CLI follows the same pull, Check, and delta Save contract:

```bash
nb light pull --repo <repo-id> --entry <entry-id> --dir ./workspace
nb light check --dir ./workspace --json-output
nb light save --dir ./workspace --yes --json-output
```

## Move RunJS source

**Move to light extension** moves the complete current workspace, including unsaved files, into a new or existing repository. The server derives the Entry kind from trusted owner metadata, checks the owner fingerprint and destination Head, relocates relative imports, validates and compiles the candidate, then updates the destination and host binding atomically.

**Move to inline** copies the current reachable Entry files back to the owner and clears the external binding. It copies current repository source; it does not silently restore the older fallback snapshot.

Both directions support `flowModel.step` owners for JS Block, JS Page, JS Field/Column, JS Action, and JS Item. Unsupported or permission-denied hosts do not expose the move action. A failed move rolls back destination source, artifacts, host state, and references together.

## Workspace ZIP safety

ZIP export packages the current working copy, including unsaved editor content. Entry-scoped export includes only writable paths.

ZIP import is inspected before editor state changes. Inspection rejects traversal, absolute paths, symlinks, duplicate paths, invalid UTF-8, excessive file counts or byte sizes, and unsafe compression ratios. It is read-only and never creates a commit, changes Head, compiles artifacts, or saves automatically.

Repository imports replace the local working copy. Entry-scoped imports preserve other managed entries and reject archives that omit the current Entry or contain another managed Entry.

## Git synchronization safety

`lightExtensionSync` is the public Git synchronization facade. Its only provider is `git`; GitHub, GitLab, Gitea, Bitbucket, Azure DevOps, and self-hosted Git services are addressed through standard HTTPS, `ssh://`, or scp-like SSH URLs. It supports configuration, connection tests, Plan, Pull, Push, disconnect, and repository creation from Git without exposing internal VSC records or job state.

The ACL actions are independent:

- `manageSyncSource` controls configuration, connection tests, disconnect, and Plan visibility
- `pullFromSyncSource` controls Pull and Plan visibility
- `pushToSyncSource` controls Push and Plan visibility
- `createFromGit` requires repository creation, sync management, and Pull permissions

Push and Pull require the exact local Head, remote revision, target version, and plan fingerprint returned by the latest Plan. Configuration changes, archive, disconnect, and delete are blocked while a sync job is active. Push uses an explicit lease and refuses to overwrite a branch that changed after Plan.

Git credentials are optional. Private HTTPS accepts either a complete `{{ $env.NAME }}` reference to a secret JSON value containing `kind`, `username`, and `password`, or a literal token string. Literal tokens are stored in the remote record but are masked in logs, source summaries, and API responses. SSH accepts a secret JSON value containing `kind`, `privateKey`, optional `passphrase`, and required trusted `knownHosts`; when omitted, Git uses the NocoBase process user's SSH configuration, default keys, and SSH Agent. The transport and secret kind must match, and strict host-key checking cannot be disabled for supplied SSH credentials.

Git Remote reuses `SERVER_REQUEST_WHITELIST` for outbound host policy. It rejects local paths, `file://`, `git://`, custom remote helpers, symlinks, gitlinks/submodules, Git LFS pointers, binary files, and invalid UTF-8. Repository content is handled as source snapshots and is never checked out or executed.

Official runtime images include Git and OpenSSH clients. Non-Docker deployments must provide `git` and `ssh` in the NocoBase service user's `PATH`.

## Asynchronous repository creation

Template, ZIP, and Git creation are accepted as durable background jobs. `lightExtensionRepos:create` handles template or ZIP input, and `lightExtensionSync:createFromGit` handles Git input; both return HTTP 202 with a safe creation-job summary.

`lightExtensionCreateJobs:list` and `lightExtensionCreateJobs:dismiss` are the public job facade. A visible job is `pending`, `running`, or `failed`. Acceptance only confirms persistence; a successful job disappears after the repository, source, compiled artifacts, and runtime are ready.

The UI closes the creation dialog after acceptance and shows the job in a separate creation-status area. Success refreshes the repository table; failure offers removal. Public summaries never expose source payloads or credentials.

## Compatibility, rollback, and rollout

- Existing inline JS surfaces require no migration
- Enable `plugin-light-extension` before using repository or workspace APIs
- Keep persisted `sourceBinding` data during rollback so disabling and re-enabling the plugin does not destroy bindings
- Failed saves and moves roll back transactionally
- Revert a successful source version by saving the desired historical source as a new commit
- Roll out authoring ACL separately from runtime access, then verify Check, Save, Move, ZIP, Git, and bound runtime resolution
