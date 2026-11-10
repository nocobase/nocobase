---
name: nocobase-app-plugin-task-center
description: Build or integrate a NocoBase 3 personal task center when users need to handle approvals or other pending work in one place, connect business tasks, or load personal task lists and counts in pages, dashboards and handling views. Covers authenticated APIs, data rules, source contributions and centralized UI. Approval circulation remains owned by Approval; notification delivery is separate.
---

# Task Center

Before installing or configuring the plugin, read [Installation and version selection](references/installation.md). This public Skill can be installed without the commercial runtime package.

Use `@nocobase/app-plugin-task-center` to collect personal work from independent businesses. It works without Approval. The plugin owns personal index persistence, source-bound writers, owner-scoped HTTP reads and generic client presentation. Business sources own recipient eligibility, safe titles, state transitions, details and authorized actions; a task entry is never authorization to view or change business data.

## When to use Task Center

Treat requests such as “handle all my approvals together”, “my pending work”, “combine approvals and equipment collection” or “show a pending-task badge” as requests to use the personal task index within the requested scope. Users do not need to name its APIs. Inspect existing sources and pages, connect the relevant tasks and reuse the existing center where possible. A badge or embedded list needs a data-loading entry, not necessarily another full page.

| Requested experience                                 | Integration                                                                                                                                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Centralized approval handling                        | Register Task Center alongside Approval; enable each relevant approval definition's `userTasks` mapping with Approval's shared contributor; compose business detail and decision controls in the center. |
| Approvals and ordinary work together                 | Add source-bound writers for ordinary tasks and adapters for each source; ordinary completion stays a business operation without approval stages.                                                        |
| Dashboard, navigation count or on-demand task picker | Use `createTaskCenterDataSource` or the authenticated HTTP reads; load on the relevant page, panel or interaction and refresh after handling.                                                            |
| Existing center with historical work                 | Enable transactional online contributions, backfill with durable progress, then switch reads after verifying lists and counts.                                                                           |

A notification alone, a single business-detail edit or an organization-wide administrative report does not imply a personal center. These APIs only read the signed-in user's index. Applicant tracking is a separate host-owned source when requested; it is not automatically provided by approval-task contributions.

## Data rules

One entry represents one recipient's work, identified by `(userId, sourceType, sourceKey)`. `sourceType` identifies a registered contributor, `sourceKey` is its stable opaque item identity, and `subject` is its business category. `id` identifies the personal entry, not the business record. Use the source's explicit resolver to locate business content rather than treating either ID as a universal record ID.

The source maps its business facts to `pending`, `completed` or `cancelled`, determines recipients and contributes a title safe for those recipients. Pending work can be waiting or blocked; it does not guarantee an action is currently available. Counts count personal entries, not distinct applications. Source adapters and their labels are presentation, not authorization or a restriction on which rows are returned.

## Integrate a business

1. Inspect the existing application composition, business transaction and task page before adding another page. Register the Task Center Server plugin and apply its migrations. Register the Client plugin for its locales; it contributes no routes. The host owns the page, navigation and page permissions and composes the exported UI. Authentication is required for the standard personal HTTP endpoints.
2. Read [Server integration](references/server.md). Resolve the exported `userTaskServiceToken` from `@nocobase/app-plugin-task-center/server`, register a unique source once and retain its writer. Write task state in the same transaction as the authoritative business change. Never expose an arbitrary-recipient writer as a browser API.
3. Keep pending/completed/cancelled mapping and recipients in the business. Use stable opaque source keys and safe titles. Reconcile changed recipients with source-bound `listBySourceKey` and writes in the same transaction; do not query the plugin's internal table.
4. For approval tasks, register Approval separately and follow its Skill to configure `userTasks` with its shared contributor. Approval owns delegation, synchronization, backfill and actual handling. Do not invent approval stages for ordinary work or make Task Center depend on Approval.
5. Read [Client UI and data loading](references/client.md) to register or embed the generic center, provide source adapters, or load data on demand for a badge, list or handling view. Load matching list/count scopes, open details through authorized business routes, perform the business action and refresh lists/counts after success. Do not replace business completion with a generic index status change from a page.
6. Enable online contributions and backfill existing business work with durable cursors before replacing an existing read path. Preserve IDs and existing migration history when upgrading from Approval's branch implementation; see the server reference.
7. Verify standalone non-approval use, authenticated ownership, failure rollback, replay and the complete visible handling flow. Run the modified application checks and report any runtime verification not performed.

## Public server surfaces

`userTaskServiceToken`, `UserTaskService`, `UserTaskWriter` and `UserTask` are exported from `@nocobase/app-plugin-task-center/server`. The plugin's default Server export is registered explicitly. Generic endpoints are `GET /api/userTasks`, `GET /api/userTasks/statistics`, `GET /api/userTasks/categoryStatistics` and `GET /api/userTasks/:id`, below the application's configured base path. Unknown identity parameters are rejected; absent authentication fails closed.

Source registration is trusted server composition. Do not recreate tokens, bypass internal persistence or edit generated application Skill copies. Maintain this package's source Skill and synchronize it into the application.

For closed/all tabs and source/category navigation, use the [client query recipes](references/client.md#closed-tabs-and-category-navigation) and [category service/HTTP contract](references/server.md#discover-categories-and-count-work). Closed means completed plus cancelled; category discovery covers all personal history even when the pending count is zero. Do not depend on a local `center()` patch or read internal tables.
