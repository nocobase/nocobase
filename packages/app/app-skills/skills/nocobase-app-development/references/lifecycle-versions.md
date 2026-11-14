# Versions of a process

A lifecycle definition lives in source. Records created by one definition keep running it after the code changes, so a change to what a process does is never an edit of the definition records already run: it is a new version of the process, registered beside the old one. This page says when to create one, how, which entry points start using it and what to report. [Record lifecycles](lifecycle.md) covers the definition itself; `packages/libs/lifecycle/docs/design.md#versions-of-a-process` in the NocoBase repository has the runtime contract.

## Identity

| Property          | Meaning                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | One definition, for good. Records, the transition log, effect runs and parameter snapshots refer to it. Never rename it.                                                                                                  |
| `key`             | The process the definition is a version of. Every version of a process has the same key; the first version's key is normally its name. Plugins use a namespaced key so two processes never group by accident.             |
| `version`         | A positive integer, unique within the key. The largest is the latest, which says nothing about which version new records start with.                                                                                      |
| `collection`      | The business table. Every version of a key uses the same one; write it explicitly in a copy, since it defaults to the name.                                                                                               |
| `definitionField` | The record field holding the name of the definition that created the record. The same field in every version of a key; one field per lifecycle when a record carries several (`approvalDefinition`, `paymentDefinition`). |
| `versionField`    | `lifecycleVersion`, the record's concurrency counter. It is unrelated to the definition's `version`.                                                                                                                      |

A definition without `key` or `version` registers as its name and 1, and one without `definitionField` registers while its key has one version; both print a warning in this release and become required in the next minor release. Write all three in source anyway.

## When to create a version

Create one when a change alters execution: a state, a transition's `from` or `to`, a guard, `route`, `validate`, `set`, `accept`, a state hook, `onTransition`, a trigger, an effect or its `onFailure`, or a parameter group's fields. Every registered version is equal and may already have records in some environment, so the rule is the same for every definition, whatever its history. A change to titles, descriptions, metadata used only for display, or translations alters no behavior and edits the definition in place.

Shared code counts as part of a version. A guard, effect, service or helper that both versions call keeps its old behavior for the old version: change it only through a new function the new version calls, or a parameter only the new version passes. Copying the outer definition while editing a shared guard changes the old version too.

## Creating a version

1. Find every definition with this key, including those in local plugins, and take the largest `version` plus one. Write the number into source; never compute it at runtime from registration order or time. Two branches that both add a version resolve the clash before merging.
2. Copy the definition into a new file with a new `name` (`expenses-v2`), the same `key`, the new `version`, and the same `collection`, `stateField`, `changedAtField`, `versionField` and `definitionField`. Reuse unchanged transitions and hooks by reference rather than duplicating them.
3. Register the new definition on the same runtime, with the same effects, in every process and worker that may run it. Keep the old one registered.
4. Follow the parameter rules below.
5. Check the copy's own references: hooks and effects that name the definition, child processes it creates, permission bindings, scheduled jobs, notification scenarios and services that read its states. Each of these either keeps naming the old version or moves deliberately.
6. Decide the entry points as described below.
7. Test both versions: an old record still follows the old graph, a new record follows the new one, each version's trigger handles only its own records, and a record of one version is refused by the other with `DEFINITION_MISMATCH`.

## Parameters belong to the definition version

Each definition version freezes its contract, including meaning, units, validation and defaults, and stores configuration independently by concrete definition name. A group can evolve independently in a new version; there is no cross-version group freezing rule. Administrators edit values only. An explicit copy from a previous version must validate against the target contract and becomes independent. When the runtime creates a record, including a business draft, it atomically saves complete effective values, revision and fixed time. All later execution uses that immutable instance snapshot. Return, withdrawal and resubmission of the same instance retain it. Use runtime creation for every configured entry, seed, import, batch and child record; see [parameter contracts and snapshots](lifecycle-parameters.md).

## Entry points

Records start through entry points: a user creating a record, an event subscriber, a scheduled creation, an outside API or webhook, an import, a batch, a command, or another process creating a child process. Each names the definition it starts; there is no "latest version" default, and the runtime never routes creation to the largest version.

Move the entry points that should start the new behavior, and only those. Keep the choice in one place where possible, such as the business service that creates records, rather than scattering names. An old version that deliberately creates an old child process keeps doing so: moving the current entry point is not a rewrite of what a released version does. Rolling back means pointing the entry points at the old definition again; records already created by the new version keep running it.

Everything about an existing record follows its binding, never the entry points: viewing, firing, retrying or continuing an effect, a callback, a trigger and a child process the record's version creates. Routes and pages address the process by key and let the server resolve the record's definition with `boundLifecycle()`.

At delivery, list every entry point of the process: those that now start the new version, those that keep the old one and why, and any you could not find an owner for. Check imports, batches, commands and background services explicitly.

## Pages for several versions on one table

- A business list filters and labels states by the union of every version's states (`runtime.groupStates(key)`), so a filter offers states only one version has. The status column's options and labels cover the union too.
- A record's actions, diagram and history come from the record's own version: the record view's `lifecycle` and `definitionVersion` say which, and `useLifecycle` describes that definition rather than the latest.
- Management lists show one row per key, described by the latest version, with execution counts over every version and a version switch on the detail page; follow [Lifecycle UI](lifecycle-ui.md#versions).

## Deployment

A new version is available in every process and worker before any entry point starts it: deploy the definition first, move the entry points in a later release or behind a coordinated switch, so an old worker never receives an effect run of a definition it does not register. A version stays registered while any record is bound to it or any of its effect runs is queued, running or waiting on a continuation. Schema changes a new version needs are compatible with the old version's code.
