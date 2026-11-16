# Versions of a process

A lifecycle definition lives in source. The target main branch determines when its behavior is frozen; user confirmation determines when a frozen version may be deleted. Records keep their concrete definition binding. This page covers the edit decision, creating and deleting versions, entry points and delivery. [Record lifecycles](lifecycle.md) covers the definition itself; `packages/libs/lifecycle/docs/design.md#versions-of-a-process` in the NocoBase repository has the runtime contract.

## Identity

| Property          | Meaning                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | One definition, for good. Records, the transition log, effect runs and parameter snapshots refer to it. Never rename it.                                                                                                  |
| `key`             | The process the definition is a version of. Every version of a process has the same key; the first version's key is normally its name. Plugins use a namespaced key so two processes never group by accident.             |
| `version`         | A positive integer, unique within the key. The largest is the latest, which says nothing about which version new records start with.                                                                                      |
| `collection`      | The business table. Every version of a key uses the same one; write it explicitly in a copy, since it defaults to the name.                                                                                               |
| `definitionField` | The record field holding the name of the definition that created the record. The same field in every version of a key; one field per lifecycle when a record carries several (`approvalDefinition`, `paymentDefinition`). |
| `versionField`    | `lifecycleVersion`, the record's concurrency counter. It is unrelated to the definition's `version`.                                                                                                                      |

Once merged into the target main branch, a definition permanently reserves its `name` and `key` + `version`, even after its code is deleted. Never reuse either identity for a new definition. Removing an entire process does not release its `key` for a different process. These source-maintenance rules protect retained records, logs, effect runs and snapshots from being interpreted by a new definition; runtime registration checks only the currently registered definitions.

A definition without `key` or `version` registers as its name and 1, and one without `definitionField` registers while its key has one version; both print a warning in this release and become required in the next minor release. Write all three in source anyway.

## Before changing behavior

1. Identify the current branch's target main branch from available Git refs, the PR target and repository conventions. Compare definitions by `key`, `version` and `name` against that target branch's current contents and history, including local plugins. A filename, an uncommitted diff or an old merge-base snapshot alone does not establish version ownership. If the target or ownership remains uncertain after those checks, ask the user before changing behavior; do not assume an in-place edit is allowed.
2. A version already present in the target main branch is frozen. Changing execution requires a new definition version beside it, retaining the old definition and its original behavior. Execution includes states, transition conditions and destinations, guards, `route`, `validate`, `set`, `accept`, hooks, triggers, effects and their failure/retry behavior, and parameter contracts (fields, types, meaning, units, validation and defaults).
3. A version introduced on the current branch and not yet merged into the target main branch can be edited repeatedly in place. Further edits, commits, restarts and resumed development do not require another version. This also applies to the first version of a new process. Once merged into the target main branch, that version freezes and its next behavior change needs another version.
4. If the working tree already changes a frozen version's behavior, move only those behavior changes into a new version and restore the frozen version's original behavior. Preserve unrelated working-tree changes.
5. Titles, descriptions, translations and metadata used only for display can be edited in place. Inspect shared guards, effects, services and helpers too: preserve behavior for every frozen version that calls them, using a separate implementation or an explicit new-version argument where needed. Copying the outer definition while changing a shared dependency does not preserve old behavior.
6. Editing values of already-declared parameters follows the existing configuration and instance snapshot mechanism; it is not a parameter contract change. Never rewrite existing snapshots. See [parameter contracts and snapshots](lifecycle-parameters.md).

Git merge is the development boundary for freezing a version. Local execution records and guesses about production usage do not decide whether to increment it. An unmerged version may already have been deployed or used; permission to edit it is no claim of data compatibility, and existing instance snapshots remain immutable. Check actual compatibility where such data is known, and follow the deletion confirmation rule below when removing a deployed or used version.

For example, the target main branch contains v1. The first behavior change on a feature branch creates v2; v2 can be revised throughout that branch without creating v3 for each commit or resumed session. After v2 merges into the target main branch, the next behavior change creates v3.

## Creating a version

1. Find every current definition with this key, including those in local plugins, and inspect the target main branch's history for every version of that key, including deleted definitions. Take the largest `version` across both the current definitions and that history, plus one; use 1 for a new process only when neither contains a version of that key. Choose a `name` unused by current definitions and never reserved by a merged definition, and never reuse a merged `key` + `version`, even after deletion. If history is insufficient to establish these identities, inspect available Git refs, PRs and repository conventions, then ask the user if still uncertain; do not assume a deleted version or name is available. Write the number into source; never compute it at runtime from registration order or time. Two branches that both add a version resolve the clash before merging.
2. Copy the definition into a new file with a new `name` (`expenses-v2`), the same `key`, the new `version`, and the same `collection`, `stateField`, `changedAtField`, `versionField` and `definitionField`. Reuse unchanged transitions and hooks by reference rather than duplicating them.
3. Register the new definition on the same runtime, with the same effects, in every process and worker that may run it. Keep the old one registered.
4. Follow the parameter rules below.
5. Check the copy's own references: hooks and effects that name the definition, child processes it creates, permission bindings, scheduled jobs, notification scenarios and services that read its states. Each of these either keeps naming the old version or moves deliberately.
6. Decide the entry points as described below.
7. Test both versions: an old record still follows the old graph, a new record follows the new one, each version's trigger handles only its own records, and a record of one version is refused by the other with `DEFINITION_MISMATCH`.

For example, if v3 was merged and later deleted while v1 and v2 remain, the next new version is v4 with an unused name; the deleted v3's name and `key` + `version` stay reserved. This numbering step applies when creating a new version, not when continuing to edit an unmerged version.

## Parameters belong to the definition version

A definition version's contract, including meaning, units, validation and defaults, freezes when it reaches the target main branch, following the decision above. Configuration is stored independently by concrete definition name. A group can evolve independently in a new version; there is no cross-version group freezing rule. Editing an unmerged contract still requires checking any saved configuration and existing snapshots for compatibility; it never authorizes changing instance snapshots.

Administrators edit values only. An explicit copy from a previous version must validate against the target contract and becomes independent. When the runtime creates a record, including a business draft, it atomically saves complete effective values, revision and fixed time. All later execution uses that immutable instance snapshot. Return, withdrawal and resubmission of the same instance retain it. Use runtime creation for every configured entry, seed, import, batch and child record; see [parameter contracts and snapshots](lifecycle-parameters.md).

## Entry points

Records start through entry points: a user creating a record, an event subscriber, a scheduled creation, an outside API or webhook, an import, a batch, a command, or another process creating a child process. Each names the definition it starts; there is no "latest version" default, and the runtime never routes creation to the largest version.

Move the entry points that should start the new behavior, and only those. Keep the choice in one place where possible, such as the business service that creates records, rather than scattering names. An old version that deliberately creates an old child process keeps doing so: moving the current entry point must preserve the behavior of a frozen version. Rolling back means pointing the entry points at the old definition again; records already created by the new version keep running it.

Everything about an existing record follows its binding, never the entry points: viewing, firing, retrying or continuing an effect, a callback, a trigger and a child process the record's version creates. Routes and pages address the process by key and let the server resolve the record's definition with `boundLifecycle()`.

At delivery, list every entry point of the process: those that now start the new version, those that keep the old one and why, and any you could not find an owner for. Check imports, batches, commands and background services explicitly.

## Pages for several versions on one table

- A business list filters and labels states by the union of every version's states (`runtime.groupStates(key)`), so a filter offers states only one version has. The status column's options and labels cover the union too.
- A record's actions, diagram and history come from the record's own version: the record view's `lifecycle` and `definitionVersion` say which, and `useLifecycle` describes that definition rather than the latest.
- Management lists show one row per key, described by the latest version, with execution counts over every version and a version switch on the detail page; follow [Lifecycle UI](lifecycle-ui.md#versions).

## Deployment

A new version is available in every process and worker before any entry point starts it: deploy the definition first, move the entry points in a later release or behind a coordinated switch, so an old worker never receives an effect run of a definition it does not register. Retain old definitions and their behavior dependencies for bound records, history, recovery and pending work until the retirement confirmation in [Deleting versions](#deleting-versions) permits removal. Schema changes a new version needs are compatible with the old version's code.

## Deleting versions

Freezing behavior does not prohibit deletion. Before deleting a version already merged into the target main branch, obtain the user's explicit confirmation in the conversation that, in all relevant deployment environments, the version is no longer used, there are no instances, historical records or pending execution/continuation tasks that need to be retained, executed, viewed or recovered, and deleting its definition code is allowed. A local database cannot establish retirement across those environments.

A suitable question is: "Please confirm: in all relevant deployment environments, this workflow version is no longer used; there are no instances, historical records or pending execution or continuation tasks that need to be retained, processed, viewed or recovered; and you allow deletion of its definition code."

An equivalent explicit confirmation already given in the conversation is sufficient. Once confirmed, proceed with deletion; do not require production access, database query results or another confirmation. If inspection reveals a concrete fact contradicting that confirmation, or another version still has a valid dependency, explain and resolve the conflict before removing the dependency.

- Remove the selected definition code, its registration, creation entry points and related references. Check pages, APIs, scheduled jobs, event subscribers, webhooks, imports, batches, commands, background services and child-process entry points so no path still targets the deleted version.
- Preserve other versions and shared code they still depend on. Preserve merged database migrations. Permission to delete definition code does not authorize production database cleanup or historical data deletion.
- Deleting a previously merged version never releases its `name` or `key` + `version` for reuse by a new definition. Include deleted versions when choosing the next version from current definitions and the target main branch's history. If the entire process is removed, never assign its `key` to a different process.
- A version added on the current branch and not yet merged can be removed as a development undo. If the user says it has been deployed or used, apply the same retirement confirmation rule.
- For a single-version deletion, retain the other versions. For removal of an entire process, apply these checks and confirmation to all its versions and entry points.
