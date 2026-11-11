---
"@nocobase/lifecycle": minor
"@nocobase/app-plugin-lifecycle-example": minor
"@nocobase/app-template-examples": minor
"@nocobase/app-skills": patch
---

`useLifecycle()` and the hooks `createLifecycleHook()` returns draw a record with the definition it is bound to rather than the latest version: with a record id they read the record first and describe `view.lifecycle`. `LifecycleClient.describe()` takes an optional definition name, sent as the `definition` query parameter.

The lifecycle example adds a second expense version, `expenses-v2`, on the same table: reports above a new audit limit wait for an audit step. It reuses the first version's parameter groups and keeps its new `auditLimit` in a new `expenseAudit` group, so first-version reports resolve the same values as before. New reports start the second version; the sample data keeps reports of both. The expense list filters by the union of both versions' states (`GET /expenses?status=`), its metadata lists those states, and each report's page draws the version it runs.

Workflow management in the Examples template lists each process once, by key, described by its latest version, with execution counts over every version. `GET /workflows/definitions/{workflowId}` takes `version`, and an id naming a version by its own definition name, as older links do, describes that version. `GET /workflows/executions` takes `version` with `workflowId`, and every execution carries its `definition` and `version`; records of several versions on one table are counted and paged by their binding. An execution detail describes the record's own version. The pages add a version switch kept in the URL, a version column and filter for executions, and a link from an execution to its version. A key registered by two workflow sources is refused at startup.

The application development Skill explains when a change becomes a new version, how to copy a definition, the frozen parameter groups versions share, which entry points move and what to list at delivery, and how management pages show versions. The upgrade Skill adds the checklist for giving existing definitions a key, a version and a backfilled binding field, with a conflict list for records whose definition cannot be determined.
