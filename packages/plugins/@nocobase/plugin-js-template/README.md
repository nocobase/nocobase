# JS Templates

`@nocobase/plugin-js-template` is the sole implementation package for project-backed, multi-file RunJS authoring in NocoBase.

## Domain boundaries

- A JS Template project is not a NocoBase plugin package and has no plugin lifecycle hooks
- Templates cannot define collections, migrations, server resources, middleware, ACL rules, app providers, or package dependencies
- The project source tree is the source of truth for source files, Template metadata, runtime artifacts, settings, and usages
- Project creation and source changes are compile-gated and atomic
- Runtime resolution is available to logged-in page users; authoring and project management require `pm.js-template`
- The legacy admin shell only provides the settings-page bridge needed during the client-v2 transition

JS Templates does not create projects or move inline code automatically. Both operations require an explicit authoring action.

## Template and UI contract

JS Template supports five Template kinds:

| Template kind | JS surface | Source root |
| --- | --- | --- |
| `js-block` | JS Block | `src/client/js-blocks/<entry-name>/` |
| `js-page` | JS Page | `src/client/js-pages/<entry-name>/` |
| `js-field` | JS Field, editable JS Field, and JS Column | `src/client/js-fields/<entry-name>/` |
| `js-action` | JS Action families | `src/client/js-actions/<entry-name>/` |
| `js-item` | JS Item families | `src/client/js-items/<entry-name>/` |

JS Column reuses `js-field`; `category: "js-column"` provides column-specific presentation. Generic JavaScript in defaults, assignment rules, linkage rules, custom variables, workflow nodes, charts, and similar nested settings remains inline-only.

Selecting a Template creates the standard JS model shape with a source binding. The plugin does not add parallel JS Template model classes. Direct-create menus cover blocks, supported actions, form/details fields, and table columns.

`entry.json.key` is the stable source identity. It must be a lowercase slug and unique within the project and kind. Renaming a directory while keeping the key preserves `templateId`, runtime bindings, and usages; changing the key creates a new identity.

## Inline and project source

Existing inline JS behavior remains unchanged:

- Missing `sourceMode` means `inline`
- `sourceMode: "inline"` executes the owner's inline code
- `sourceMode: "js-template"` resolves the bound Template artifact
- A bound owner retains its previous inline `code`, `version`, and `sourceRef` as an inactive fallback snapshot
- Editing the retained snapshot does not change the active runtime while the Template binding remains active

Inline RunJS workspaces use `runJSSources:open` or `runJSSources:openLatest`, followed by delta `runJSSources:saveChanges`. Omitted paths remain unchanged, deletions require `operation: "delete"`, and updates carry the opened file's `blobHash`.

Project-backed source uses the JS Template domain APIs. Raw `runJSSources`, VSC resources, direct artifact writes, and ZIP round-trips are not alternate save paths for an active project.

## Check and Save

The project authoring flow is:

1. Pull the project or bound Template and retain its Head as `expectedHeadCommitId`
2. Send the complete working copy to `jsTemplates:compileWorkspacePreview`
3. Stop on HTTP 207 or 422; Check never persists source or executes the returned artifact
4. Send only the reviewed delta to `jsTemplateFiles:saveSource` with the unchanged `expectedHeadCommitId`
5. On HTTP 409, pull again and rebuild the candidate from the new Head

Save materializes the complete candidate before validating and compiling it. The publish transaction rechecks the Head, then commits source, Template rows, immutable artifacts, usages, and audit state together.

| Result | Contract |
| --- | --- |
| Valid delta | Source Head and affected runtime artifacts advance together |
| Validation or compile failure | Returns HTTP 422 without changing source, Head, artifacts, Templates, or usages |
| Stale Head | Returns HTTP 409 without reusing the stale candidate |
| Empty delta | Returns the VSC `NO_CHANGES` error |
| Archived project | Returns `JS_TEMPLATE_PROJECT_ARCHIVED` |

The canonical CLI follows the same pull, Check, and delta Save contract:

```bash
nb js-template pull --project <project-id> --template <template-id> --dir ./workspace
nb js-template check --dir ./workspace --json-output
nb js-template save --dir ./workspace --yes --json-output
```

## Move RunJS source

**Move to JS Template** moves the complete current workspace, including unsaved files, into a new or existing project. The server derives the Template kind from trusted owner metadata, checks the owner fingerprint and destination Head, relocates relative imports, validates and compiles the candidate, then updates the destination and host binding atomically.

**Move to inline** copies the current reachable Template files back to the owner and clears the external binding. It copies current project source; it does not silently restore the older fallback snapshot.

Both directions support `flowModel.step` owners for JS Block, JS Page, JS Field/Column, JS Action, and JS Item. Unsupported or permission-denied hosts do not expose the move action. A failed move leaves destination source, artifacts, host state, and usages unchanged.

## Workspace ZIP safety

Project workspace ZIP export packages the current working copy, including unsaved editor content. Template-scoped export includes only writable paths. Inline RunJS workspace export packages the repository Head, or the legacy inline source when no repository exists, so it does not include unsaved editor changes.

ZIP import is inspected before editor state changes. Inspection rejects traversal, absolute paths, symlinks, duplicate paths, invalid UTF-8, excessive file counts or byte sizes, and unsafe compression ratios. It is read-only and never creates a commit, changes Head, compiles artifacts, or saves automatically.

Project imports replace the local working copy. Template-scoped imports preserve other managed Templates and reject archives that omit the current Template or contain another managed Template.

## Git synchronization safety

`jsTemplateSync` is the public Git synchronization API. Its only provider is `git`; GitHub, GitLab, Gitea, Bitbucket, Azure DevOps, and self-hosted Git services are addressed through standard HTTPS, `ssh://`, or scp-like SSH URLs. It supports configuration, connection tests, Plan, Pull, Push, disconnect, and project creation from Git without exposing internal VSC records or job state.

The ACL actions are independent:

- `manageSyncSource` controls configuration, connection tests, disconnect, and Plan visibility
- `pullFromSyncSource` controls Pull and Plan visibility
- `pushToSyncSource` controls Push and Plan visibility
- `createFromGit` requires project creation, sync management, and Pull permissions

Push and Pull require the exact local Head, remote revision, target version, and plan fingerprint returned by the latest Plan. Configuration changes, archive, disconnect, and delete are blocked while a sync job is active. Push uses an explicit lease and refuses to overwrite a branch that changed after Plan.

Git credentials are optional. Private HTTPS requires a complete `{{ $env.NAME }}` reference to a Secret JSON value containing `kind: "https"`, `username`, and `password`; literal credentials are rejected and only the Secret reference is stored in the remote record. SSH accepts a Secret JSON value containing `kind: "ssh"`, `privateKey`, optional `passphrase`, and required trusted `knownHosts`; when omitted, Git uses the NocoBase process user's SSH configuration, default keys, and SSH Agent. The transport and Secret kind must match, and strict host-key checking cannot be disabled for supplied SSH credentials.

Branch is optional while configuring or creating from a non-empty Git repository. When omitted, the remote symbolic `HEAD` is resolved and the resulting branch is persisted. An empty repository has no default branch, so its branch must be supplied explicitly; NocoBase does not guess `main` or another branch name.

Git Remote reuses `SERVER_REQUEST_WHITELIST` for outbound host policy. It rejects local paths, `file://`, `git://`, custom remote helpers, symlinks, gitlinks/submodules, Git LFS pointers, binary files, and invalid UTF-8. Repository content is handled as source snapshots and is never checked out or executed.

Official runtime images include Git and OpenSSH clients. Non-Docker deployments must provide `git` and `ssh` in the NocoBase service user's `PATH`.

## Asynchronous project creation

Starter, ZIP, and Git creation are accepted as durable background jobs. `jsTemplateProjects:create` handles starter or ZIP input, and `jsTemplateSync:createFromGit` handles Git input; both return HTTP 202 with a safe creation-job summary.

`jsTemplateCreateJobs:list` and `jsTemplateCreateJobs:dismiss` are the public job API. A visible job is `pending`, `running`, or `failed`. Acceptance only confirms persistence; a successful job disappears after the project, source, compiled artifacts, and runtime are ready.

The UI closes the creation dialog after acceptance and shows the job in a separate creation-status area. Success refreshes the project table; failure offers removal. Public summaries never expose source payloads or credentials.

## Operational guarantees

- Failed saves and moves are transactional
- Revert a successful source version by saving the desired historical source as a new commit
- Grant authoring ACL separately from runtime access, then verify Check, Save, Move, ZIP, Git, and bound runtime resolution
