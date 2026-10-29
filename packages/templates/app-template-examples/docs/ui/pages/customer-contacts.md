# Customers and contacts

Status: Ready for implementation. This Examples-only business feature uses the host's existing theme and components. No external visual reference was supplied. The written customer/contact requirements are the structure reference (V1); the existing Examples list, RouteDialog and RouteChildPage are the style/interaction reference (V2), at 1280×800 and 375×812.

## Responsibilities and data

A CRM manager views all customers, edits name/notes/status, assigns active owners and maintains contacts. A CRM representative views and edits only customers owned by their sales-representative record, edits name/notes/status and maintains their contacts, and cannot assign owners. Closed customers remain readable but cannot be edited or have their contacts changed. Assignments are editable in the existing Users and Roles and permissions administration. Demo accounts receive direct business roles; no authenticated/member grants change.

The three collections are exampleSalesReps (id, userId, name, active), exampleCustomers (id, name, status, ownerId, notes) and exampleContacts (id, customerId, name, email, phone, title). Status is active, paused or closed. Names are trimmed, required and at most 100 characters; notes at most 2000, email at most 254, phone/title at most 100. Relation ids are non-empty strings. All writes validate strict bodies. Target reads use the corresponding view Policy and reject inaccessible/missing/inactive targets uniformly. Permissions and business state are independent checks.

| Endpoint under /api/customerContacts      | Input                                                       | Output and errors                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| GET /customers and /customers/options     | search, status, ownerId, page, pageSize (1–20)              | Policy-filtered data and meta {page,pageSize,total}, stable id order                                      |
| GET /customers/:id                        | id                                                          | Latest customer; 403 for hidden or missing row                                                            |
| PATCH /customers/:id                      | name/notes/status or ownerId                                | Updated customer; 400 invalid body, 403 missing action/field/scope/target, 409 closed                     |
| GET /salesReps/options and /salesReps/:id | search, page, pageSize; id                                  | Policy-filtered active options or permitted selected label; 403 hidden/missing                            |
| GET /customers/:id/contacts               | customer id, page/pageSize                                  | Policy-filtered contacts, same paging meta                                                                |
| GET /contacts/:id                         | id                                                          | Latest contact with readable customer label resolved separately                                           |
| POST /contacts                            | customerId,name,email,phone,title                           | Saved contact (201)                                                                                       |
| PATCH /contacts/:id                       | customerId,name,email,phone,title                           | Saved contact; both source and target checked                                                             |
| DELETE /contacts/:id                      | id                                                          | {saved:true}; 403 hidden/missing, 409 closed                                                              |
| POST /customers/batchUpdate               | 1–100 unique ids; values contains exactly status or ownerId | 200 items {id,outcome,reason?}, updated/failed counts; 400/403 before writes; unexpected errors roll back |
| POST /reset                               | none, unrestricted administrator only                       | Restores only this example's business dataset                                                             |

Every endpoint requires native authentication and its business action; the browser page grant alone authorizes no data. Batch and single writes share one permission/field/scope/state implementation. Batch selects only current-page ids, validates the whole input/action/fields/target before writes, marks hidden/missing ids FORBIDDEN and closed rows STATE_CONFLICT, and commits eligible assignments in one transaction. No operation keys, receipts or automatic retry/recovery. Unexpected write failure rolls back all eligible writes. A failed transport leaves the draft and explains that the result is unknown: refresh to inspect before explicitly submitting again.

## Routes and structure

Sidebar: Customers and contacts / 客户与联系人, UsersRound icon, page permission customer-contacts. The route /customer-contacts is a T1 customer list. Child :customerId uses RouteChildPage for T2 detail with a contacts sub-table; child edit uses RouteDialog for the customer form; contacts/new and contacts/:contactId/edit under that detail use RouteDialog for the contact form. The parent list remains mounted and retains search, filters and pagination. Closing returns to its exact parent URL with search preserved. Batch is a child-route RouteDialog at batch over the selected list, snapshots the current selection and rejects an empty/direct selection; reset/delete use named AlertDialog confirmations.

```text
PageHeader Customers and contacts                         [Reset (admin)] [Refresh]
Search by customer name | Status | Owner | Clear filters
Selected N on this page             [Change status] [Assign owner (manager)]
DataTable: selection | Customer (RecordLink) | Status (StatusBadge) | Owner
Server pagination

Customer detail: BackButton, PageHeader customer name [Edit]
Label/value customer particulars
Contacts section                                               [New contact]
DataTable name | email | phone | title | actions menu

RouteDialog edit/contact: fixed title, scrolling body, fixed Cancel/Save footer
Relation picker: selected label; search; status filter (customers); options that load the next server page on scroll
Batch RouteDialog: count + field/value; Cancel/Apply; result summary + per-id failures
```

## Components and sources

| Need                               | Reuse/composition and underlying source                                                                                                                                                   | Acceptance |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Page, detail and modal             | #components/page-container, page-header, route-child-page, route-dialog, back-button; route-overlay.tsx composes Base UI Dialog with fixed footer                                         | D1,D4,D7   |
| Lists and selection                | #components/data-table (TanStack v8, Table and pagination), #components/ui/checkbox (Base UI); controlled page-scoped id selection                                                        | D1,D3      |
| Names/status                       | #components/record-link; #components/status-badge                                                                                                                                         | D1         |
| Inputs and filters                 | #components/ui/input, textarea, label, select (Base UI), button                                                                                                                           | D2,D4      |
| Relation selector                  | Feature-owned composition of InputGroup, ToggleGroup, Popover (Base UI), Button, Spinner and TanStack Query infinite results; no existing remote paged relation picker fits this contract | D2,D5,D7   |
| Feedback                           | Existing list loading/feedback support, Alert, Skeleton and useToaster; no raw server errors                                                                                              | D4,D6      |
| Batch and destructive confirmation | Existing Dialog and AlertDialog (Base UI); no new primitive                                                                                                                               | D3,D6,D7   |

Inspect these source components before implementation. SelectContent uses the guideline's growing/wrapping popup classes. No shared primitive edits or new library are required. All copy lives in feature locales, merged into English/Chinese resources, including aria labels, unknown-label placeholders, validation, failure reasons and toasts.

## Interaction and state

Search is debounced 300 ms and supports IME composition. Search/filter/page state is URL-backed. Changing any list query or beginning a refresh clears the current selection synchronously; only displayed, current-query rows can be selected. Selection is also cleared after a completed batch. List and relation responses from obsolete requests are discarded. Empty and no-results use distinct single-line feedback; retry/clear remain in the toolbar. Loading shows no stale actionable rows from another query; same-query refresh may retain rows with delayed feedback but disables selection until settled. Access errors discard previous data.

Forms read fresh records before editing, show a skeleton in a stable dialog while reading, validate on submit, focus the first invalid field and revalidate corrected fields. Pending writes lock submit, Cancel, close, navigation and unload. Failure keeps the draft. Successful save updates the current view, refreshes its parent and shows a localized toast; a later refresh failure does not negate save success. Unauthorized selected associations display only an unavailable-record placeholder, never a cached name, and block save until a new permitted association is selected. Picker search and scroll loading do not erase the selected label. Target access is always checked again on save.

Batch confirmation displays the exact selected count and one assignable field. No permission means no button. The result remains visible until dismissed and reports updated/failed counts and each selected customer's name with FORBIDDEN or STATE_CONFLICT translated. Names are captured from the visible selected rows when the dialog opens, with an id fallback; it never looks up a hidden customer's name. A request-level rejection says nothing was changed; transport/5xx uncertainty says to refresh and inspect before resubmitting. Reset deletes/restores only these three example collections and preserves users, grants and other examples. Delete confirmation names the contact and describes removal.

## Acceptance

- D1 (V1,V2): Authenticated menu/list/detail routes render English and Chinese customer/contact data; direct detail links work; Back returns to the filtered, paged list; name links and status badges use host components.
- D2 (V1): Customer and representative pickers search on the server and append the next server page on scroll until the last page, customer status filters work, selected values survive paging, stale responses cannot replace a newer query, and hidden selected labels show only the placeholder.
- D3 (V1): Selection is current-page only and clears on query/page/refresh; batch buttons follow permissions; confirmation names count/field; total success and mixed results match saved rows exactly.
- D4 (V2): Forms have required labels, submit-only validation, correction feedback, fresh reads, pending locks and retained drafts on error; successful writes refresh parent data and announce success.
- D5 (V1): Normal users cannot read/select hidden targets or move contacts across scope; both source/target are rechecked; reps cannot assign owners or inject forbidden fields; closed customers report conflicts.
- D6 (V1,V2): Empty/no-results/loading/401/403/network errors have localized feedback and useful recovery; transport failure never claims a confirmed no-write result; deletes and reset require confirmation.
- D7 (V2): At 375px/desktop, both themes and presets, dialogs fit with internally scrolling body and reachable fixed footer, controls wrap, long values contain/wrap, keyboard focus enters/restores and IME editing works.
- D8: Real database/API tests cover scope, fields, relations, partial batch results, persisted outcomes and migration up/down; client tests cover picker/selection/results; source synchronization keeps both existing and new examples byte-identical.

## Trade-offs and open questions

None require user input. Stable ascending immutable id order replaces newest-first because these learning tables have no timestamps and deterministic option pagination is part of the example. T2.5 inline particulars editing is deferred in favor of one explicit Edit dialog, so permission and relation boundaries are visible together. Batch assignments intentionally have no durable recovery protocol, per the confirmed scope. Independent Default business-object adaptation remains a separate acceptance step; this delivery supplies runnable references and a checklist.

## Design review resolutions

The single independent design review requested a route-backed batch editor (B1), now specified above. Picker Popovers are viewport-bounded with a scrolling options region and fixed search/paging controls (S1); RouteDialogs retain the installed default two-column width. A surviving opener receives focus after close, with the parent header/search as fallback for direct links and removed rows (S2). Selection is feature-owned state rendered through existing Checkbox primitives because DataTable has no controlled selection props (S3). Notes use the installed LongText composition, preserving copy and expansion (S4).

## Acceptance corrections

Homepage discovery uses a distinct Customer relations and batch editing card to distinguish this scenario from the older repository CRM demonstration. Reset/delete confirmations show failures inside their open modal and use destructive actions. Relation validation connects the trigger to its error and explicitly focuses it when it is the first invalid field. Long owner labels expose their full value on hover only when truncated. Owner-label reads share the host query cache with native-user and permission-revision keys; changing permissions recreates the view to discard old rows, labels and selection. Server validation violations map to localized field messages without displaying backend exceptions.
