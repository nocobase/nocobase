# [Feature name] design

Use this as a temporary design document only for the full workflow; durable design records may reuse individual sections when needed. Keep applicable decisions and acceptance criteria; omit irrelevant sections and link existing contracts, shared patterns and design records instead of duplicating them. A routine CRUD page needs no separate design document. Internal review does not imply a user approval step.

| Item          | Details                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status        | Draft / Pending review / Ready for implementation                                                                                                                                                                                                                                                                                         |
| Routes        | `/<path>`; child routes: `/<path>/:id` (detail drawer), and on a page with tabs `/<path>/:id/<tab>/edit` under every tab for each overlay its header opens …                                                                                                                                                                              |
| Navigation    | Sidebar menu "[name]", icon `<LucideIcon>`; or: not shown in navigation                                                                                                                                                                                                                                                                   |
| Permissions   | All signed-in users (`authz: 'skip'`) / App page: the page grant `page:<id>`, and the business action `composite:<id>` `<action>` its endpoints check (a page grant authorizes no endpoint) / settings page: the settings item `settings:<id>` (`read`; writes check `update`), registered on the server and checked by its endpoints too |
| Page template | [`ui-guidelines.md`](../ui-guidelines.md) T1 list page / T2 detail view / T3 form / T4 settings page / T5 dashboard                                                                                                                                                                                                                       |

## 1. Goals

Summarize the requested user operations and scope, including subsequent user decisions and any explicit exclusions. Identify who uses the feature and in what situation. For a full application or feature, include both the pages and the backend behavior they require.

For a cross-module change, link the existing business journey and name the affected roles, record states, entry points, return context and refresh behavior. Scope this to the requested change.

### Design inputs and reference agreement

Read [the shared design contract](../design-contract.md). Link the application's existing global design record and the page's existing exceptions (or record that none exist). Name the owning application/plugin and target host. For a plugin, include the plugin-owned implementation paths and the host's theme and layout contract.

| Reference ID | Original source and version/screen | Mode: faithful / structure / style | Must-preserve detail | Allowed difference | Viewport/state | Acceptance criterion |
| ------------ | ---------------------------------- | ---------------------------------- | -------------------- | ------------------ | -------------- | -------------------- |
| V1           |                                    |                                    |                      |                    |                | D1                   |

If there is no UI reference, say so and use the current system design and defaults. If a reference is inaccessible or its intended use is unresolved, state that; do not invent its contents. Give each required detail its own stable V ID. Name where confirmed decisions will be retained after this task, such as `docs/ui/pages/<feature>.md`.

## 2. Data and endpoints

### Fields

| Field | Type | Required | Validation rules | Shown in list | Edited in form |
| ----- | ---- | -------- | ---------------- | ------------- | -------------- |
|       |      |          |                  |               |                |

### Endpoints

| Method and path | Parameters | Response | Errors |
| --------------- | ---------- | -------- | ------ |
|                 |            |          |        |

If an endpoint already exists, link its contract and record only the gaps needed by the page; if it does not, this is the contract the backend implements. Plan the required data, permissions, validation and error behavior before either side is implemented.

## 3. Page structure

Sketch only structure that established patterns and references do not already explain. For example:

```text
┌ PageHeader ─────────────────────────────────────┐
│ <Title>                     [+ Primary action]  │
│ <One-sentence description>                      │
└─────────────────────────────────────────────────┘
[Search…] [Filter ▾] [Clear filters]
┌ Table ──────────────────────────────────────────┐
│ Column 1 │ Column 2 │ Column 3 │ ⋯              │
└─────────────────────────────────────────────────┘
                                   [Pagination]
```

## 4. Component list

| Area / interaction | Component and underlying primitive | Source file / public import / registry item | Reused / Added / Composed / Custom | Custom gap, alternatives and verification |
| ------------------ | ---------------------------------- | ------------------------------------------- | ---------------------------------- | ----------------------------------------- |
|                    |                                    |                                             |                                    |                                           |

Follow [component selection](../component-selection.md): reuse existing business components, then installed primitives, then add missing registry items. List the source of local wrappers and their underlying primitives. For custom/native interactions, explain why reuse or composition cannot satisfy the requirement (or cite the explicit user instruction), and map their behavior to acceptance criteria. Use the owning plugin's paths for plugin UI.

## 5. States

| State         | Trigger | What is shown |
| ------------- | ------- | ------------- |
| Loading       |         |               |
| Empty         |         |               |
| No results    |         |               |
| Load failed   |         |               |
| Submitting    |         |               |
| Submit failed |         |               |

## 6. Interactions

Write each one as "trigger → result", with success and failure written separately:

- I-1 Click "[primary action]" → …
  - Success: …
  - Failure: …
- I-2 …

Also state which states are written to the URL, which actions need confirmation, and whether keyboard behavior has any special requirements.

## 7. Copy

Link existing copy keys for reused patterns; specify new or changed wording in every language in `client/locales/index.ts` (the template offers these two):

| key | zh-CN | en-US |
| --- | ----- | ----- |
|     |       |       |

## 8. Adaptation

How the page looks and behaves in the dark theme and on narrow screens (375px).

## 9. Acceptance criteria

Each one must be checkable by an action or a screenshot. Cover the requested user operation across the UI and real endpoints, including saved results, refresh, permissions and failure handling. For a deliberately narrower deliverable, check that scope instead:

- [ ] D1 …
- [ ] D2 …

When the design changes, keep existing numbers unchanged and append new criteria at the end.

Every required reference detail, route, navigation entry (including its icon), permission, component and state must map to a criterion above. Review the whole design as well; a missing criterion does not exempt a declared requirement. For an overlay, specify its footer placement, responsive button order, long-content scrolling and pending/error states, using the actual installed component behavior. Include affected cross-module or host integration checks.

## 10. Open questions

Record reasonable assumptions and unresolved material business or scope decisions. For each necessary question, name the affected work and any prior user answer; do not ask again about resolved decisions. If the user explicitly requested review before implementation, record that here. Otherwise routine design choices and internal review do not require confirmation.

## 11. Change log

Record changes made after the design review.

| Date | Change | Reason | Affected acceptance criteria | Decision / handling |
| ---- | ------ | ------ | ---------------------------- | ------------------- |
|      |        |        |                              |                     |

## 12. Guideline trade-offs

Give a reason for each Should departure. A replacement for a Must product default needs its scope, reason, exact replacement and authorization under the shared design contract. Record interpretations and deliberate fixed sizes (F7) here too. Usability, correctness and host integration outcomes remain required. Mark unresolved proposals as Pending; do not treat them as approved exceptions.

| Guideline | Default and replacement | Scope and reason | Authorization: user instruction / confirmed design / Pending | Acceptance criterion |
| --------- | ----------------------- | ---------------- | ------------------------------------------------------------ | -------------------- |
|           |                         |                  |                                                              |                      |

## 13. Review responses

Record how each comment from the design review (`review-design.md`) was handled, and summarize the resolutions when presenting the design.

| ID  | Type                  | Handling                                                | Where changed |
| --- | --------------------- | ------------------------------------------------------- | ------------- |
|     | Blocking / Suggestion | Changed / Not adopted (reason) / For the user to decide |               |
