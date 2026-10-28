# [Feature name] design

| Item          | Details                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status        | Draft / Pending review / Confirmed                                                                                                                                                                                                                                                                                                        |
| Routes        | `/<path>`; child routes: `/<path>/:id` (detail drawer), and on a page with tabs `/<path>/:id/<tab>/edit` under every tab for each overlay its header opens …                                                                                                                                                                              |
| Navigation    | Sidebar menu "[name]", icon `<LucideIcon>`; or: not shown in navigation                                                                                                                                                                                                                                                                   |
| Permissions   | All signed-in users (`authz: 'skip'`) / App page: the page grant `page:<id>`, and the business action `composite:<id>` `<action>` its endpoints check (a page grant authorizes no endpoint) / settings page: the settings item `settings:<id>` (`read`; writes check `update`), registered on the server and checked by its endpoints too |
| Page template | [`ui-guidelines.md`](../ui-guidelines.md) T1 list page / T2 detail view / T3 form / T4 settings page / T5 dashboard                                                                                                                                                                                                                       |
| Confirmation  | Confirmed by the user on [date] / the user authorized skipping confirmation in advance                                                                                                                                                                                                                                                    |

## 1. Goals

Who uses this page and in what situation, and which tasks they need to complete (no more than 3).

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

If an endpoint already exists, note its source (file path); if it does not, this is the contract the backend implements.

## 3. Page structure

Wireframe:

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

| Area | Component | Notes |
| ---- | --------- | ----- |
|      |           |       |

Components come from `client/components/ui/` or `client/components/`; for a component that has to be added, mark it "New" and give its source (the shadcn registry name).

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

One column per language in `client/locales/index.ts` (the template offers these two):

| key | zh-CN | en-US |
| --- | ----- | ----- |
|     |       |       |

## 8. Adaptation

How the page looks and behaves in the dark theme and on narrow screens (375px).

## 9. Acceptance criteria

Each one must be checkable by an action or a screenshot:

- [ ] D1 …
- [ ] D2 …

When the design changes, keep existing numbers unchanged and append new criteria at the end.

Every required reference detail, route, navigation entry (including its icon), permission, component and state must map to a criterion above. Review the whole design as well; a missing criterion does not exempt a declared requirement. For an overlay, specify its footer placement, responsive button order, long-content scrolling and pending/error states, using the actual installed component behavior. Include affected cross-module or host integration checks.

## 10. Open questions

Points the user needs to decide; if there are none, write "None".

## 11. Change log

Record here any changes made after the design was confirmed.

| Date | Change | Reason | Affected acceptance criteria | Confirmed by the user |
| ---- | ------ | ------ | ---------------------------- | --------------------- |
|      |        |        |                              |                       |

## 12. Guideline trade-offs

Give a reason for each Should departure. A replacement for a Must product default needs its scope, reason, exact replacement and authorization under the shared design contract. Record interpretations and deliberate fixed sizes (F7) here too. Usability, correctness and host integration outcomes remain required. Mark unresolved proposals as Pending; do not treat them as approved exceptions.

| Guideline | Default and replacement | Scope and reason | Authorization: user instruction / confirmed design / Pending | Acceptance criterion |
| --------- | ----------------------- | ---------------- | ------------------------------------------------------------ | -------------------- |
|           |                         |                  |                                                              |                      |

## 13. Review responses

Record how each comment from the design review (`review-design.md`) was handled, and cover them when you ask the user to confirm the design.

| ID  | Type                  | Handling                                                | Where changed |
| --- | --------------------- | ------------------------------------------------------- | ------------- |
|     | Blocking / Suggestion | Changed / Not adopted (reason) / For the user to decide |               |
