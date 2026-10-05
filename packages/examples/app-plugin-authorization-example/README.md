# @nocobase/app-plugin-authorization-example

Runnable examples of sales collaboration and order delivery permissions. They demonstrate realistic independent responsibilities, not a complete quote-to-order workflow. For production API contracts, use the [authorization README](../../plugins/app-plugin-authorization/README.md) and [development Skill](../../plugins/app-plugin-authorization/skills/nocobase-app-plugin-authorization/SKILL.md).

## Run the examples

Register this package's default client/server plugins with authentication, authorization and the three optional rule plugins (default access, sharing rules and restriction rules, with their factories in the application's `server/config/authorization.ts`), then run the application's normal migrations and seeds. The Examples application includes this composition. Open `/authorization-example` for the guide and `/authorization-example/projects`, `/authorization-example/quotes`, `/authorization-example/orders` for the independently authorized pages; paths are relative to the application mount. Each page route declares `authz: { resource: { type: 'page', id }, action: 'access' }` with the ids `example.sales.projects`, `example.sales.quotes` and `example.sales.orders`; the guide declares `authz: 'skip'` and is open to every signed-in user.

The rule plugins are optional peers: without one, the seed skips its rules and the example runs on permission sets alone, so the exercises that depend on that plugin do not apply. Use the seeded demo accounts shown in the guide. Keep demo credentials and practice reset out of a production feature. The seed runs once, in one transaction, and skips entirely when the example's sales membership table already has rows, so it never overwrites permissions an administrator changed. An unrestricted administrator (`snapshot().unrestricted`) can reset the fixed business practice records; this preserves permissions and additional user-created orders. Restore authorization changes separately before repeating baseline exercises.

## Responsibilities demonstrated

| Account             | Job source                 | Business example                                                  |
| ------------------- | -------------------------- | ----------------------------------------------------------------- |
| `sales_assistant`   | Direct sales assistant     | Consult public and explicitly shared materials                    |
| `sales_engineer`    | Direct sales engineer      | Edit prepared quotes; submit only with responsible-project access |
| `sales_manager`     | Direct project manager     | Maintain owned projects and consult related work                  |
| `sales_delivery`    | Direct delivery specialist | Arrange and confirm eligible order delivery                       |
| `sales_proposal`    | Direct sales engineer      | Take over an explicitly delegated quote                           |
| `sales_coordinator` | Direct project manager     | Manage an owned project outside the home region                   |

Engineers can edit their own out-of-region drafts without being allowed to submit them. The proposal engineer can edit/submit quote-7 through explicit quote and project-3 sharing. Sharing alone does not grant Submit. The coordinator manages owned project-8 in another region; direct confidentiality restrictions remain in force. Orders reference accepted historical quotes, separate from the draft exercises; submitting a practice quote does not create an order.

Every account holds its job directly. For permission sets inherited through an organisation, such as a set assigned to a department that reaches its members, see the [departments example](../app-plugin-departments-example/README.md).

## Source map

| Source                                                                                             | Reuse the pattern for                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [sales-resources.ts](server/sales-resources.ts)                                                    | Composite resources: `example.sales.projects` in object form, quotes and orders with `defineCompositeResource`; fields, relations, data scopes, and the `example.sales` and `example.delivery` subsections each is placed in |
| [sales-record-access.ts](server/sales-record-access.ts), [sales-scopes.ts](server/sales-scopes.ts) | Preparer, ownership, region and public-record access, resolved through the parent project                                                                                                                                    |
| [sales-authorization.ts](server/sales-authorization.ts)                                            | Registration: `authz.ui.sections.add`, `authz.database.collections.add`, `authz.compositeResources.define` with `authz.ui.place`, `authz.recordAccess.define`                                                                |
| [authorization-example.ts](server/providers/authorization-example.ts)                              | Registering everything from the provider's `boot`                                                                                                                                                                            |
| [routes](server/routes/index.ts)                                                                   | One business decision, policy-bound repositories, business transitions and transactions                                                                                                                                      |
| [seed data](database/seed-data)                                                                    | `definePermissionSet`, `defineDefaultAccessRule`, `defineSharingRule`, `defineRestrictionRule` and user assignments                                                                                                          |
| [client routes](client/routes.ts)                                                                  | Page access declared on every route, independent from business operations                                                                                                                                                    |
| [tests](tests)                                                                                     | Production routes and persisted allow and deny outcomes                                                                                                                                                                      |

Portable declarations perform no database work. The provider registers them; seeds reuse typed references such as `quoteResource.reference().grant({ submit: { quotes: 'example.sales.prepared', projects: 'example.sales.region' } })`. Record access closes over the owning services. A Submit decision on `{ type: 'composite', id: 'example.sales.quotes' }` yields policies for quotes and projects in `conditions.database`; the route consumes both without resolving collection grants again. It separately validates a positive amount, draft state and the actual parent relationship.

The seeded configuration has four permission sets (`example-sales-assistant`, `-engineer`, `-manager`, `-delivery`), each granting page `access` separately from its business actions; direct user assignments; keyed default-access rules for each composite; sharing rules for regional delivery, selected projects and the quote-7 handover; and "public records only" restriction rules on every business action for every example account.

## Business HTTP API

All routes below are under `/api/authorizationExample`, relative to the application mount, and require authentication; an anonymous request is answered `401`. Composite and page ids use the `example.sales.*` names from the declarations. Every success is `{ data }` (a list is `{ data: [...], meta }`), and every failure is the standard error body with domain `authorizationExample` unless the framework reports it (`app`).

| Method and path                                          | Operation                                                      |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `GET /context`                                           | Current roles and their assignment sources                     |
| `GET /sales/projects`, `/sales/quotes`, `/sales/orders`  | Policy-filtered, paged lists and operation eligibility         |
| `POST /salesProjects/{findMany,findOne,count,updateOne}` | Repository data endpoints; `updateOne` edits project details   |
| `PATCH /sales/quotes/:quoteId`                           | Edit draft amount/notes; answers the updated quote             |
| `POST /sales/quotes/:quoteId/submit`                     | Submit an eligible quote after quote and project authorization |
| `GET /sales/orders/:orderId/relations`                   | Read allowed order relations                                   |
| `PATCH /sales/orders/:orderId/relations`                 | Manage the carrier, checks and collaborators                   |
| `POST /sales/orders/:orderId/deliver`                    | Confirm a ready order with a delivery reference                |
| `POST /reset`                                            | Unrestricted administrator restores fixed practice records     |

Errors the example reports itself, branched on by `reason`:

| Status                    | Reason                        | When                                                                                    |
| ------------------------- | ----------------------------- | --------------------------------------------------------------------------------------- |
| `403 PERMISSION_DENIED`   | `FORBIDDEN`                   | The caller may not act on the record, whether or not it exists                          |
| `400 FAILED_PRECONDITION` | `STATE_CONFLICT`              | The quote is not a draft or the order is not ready, including a change during the write |
| `400 INVALID_ARGUMENT`    | `DELIVERY_REFERENCE_REQUIRED` | A blank delivery reference                                                              |
| `400 FAILED_PRECONDITION` | `QUOTE_AMOUNT_REQUIRED`       | A quote submitted while its stored amount is not positive                               |
| `400 FAILED_PRECONDITION` | `EXAMPLE_ACCOUNTS_MISSING`    | A reset before the example accounts were seeded                                         |
| `413 INVALID_ARGUMENT`    | `BODY_TOO_LARGE`              | A body over 4 KiB                                                                       |

The lists page by number: `page` (default 1) and `pageSize` (default 20, at most 100) answer `meta: { page, pageSize, total, navigation }`, where `navigation` says which of the three sales pages the caller may open. The framework reports an unknown or invalid field as `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` (domain `app`) and a `fieldViolations` entry per field.

Every business route decides the caller's composite action in middleware before it validates the path, query or body and before it looks up the record, so a caller without the action is answered `403` whatever its input holds.

The business routes deliberately answer a Repository `RECORD_NOT_FOUND`, `RELATION_TARGET_NOT_FOUND` or `RECORD_OUTSIDE_SCOPE` as `403 FORBIDDEN` rather than `404`, so a response never reveals which records exist outside the caller's scope.

A relations update names only `carrier`, `checks` and `collaborators`, at least one of them; any other key, a foreign key such as `carrierId` included, is refused `400 INVALID_INPUT` before the Policy is consulted. Each value is a Repository relation value:

```json
{ "carrier": { "connect": { "id": "express" } } }
```

```json
{
  "checks": {
    "update": [{ "filter": { "id": "check-1" }, "values": { "done": true } }]
  }
}
```

```json
{
  "collaborators": {
    "connect": [
      { "where": { "id": "freight" }, "through": { "note": "Review" } }
    ]
  }
}
```

Only active carrier targets are allowed. Carrier data, direct ownership/association foreign keys and internal join attributes are not writable through this operation. Nested create/update/upsert/delete and connect/disconnect/set are declared explicitly; a failed nested operation must roll back. Completed orders remain readable but cannot be rearranged.

## Exercises and acceptance

1. As the assistant, read the public and selected shared records without acquiring edit rights.
2. As the engineer, edit/submit quote-2; read but do not edit colleague quote-5; edit but do not submit out-of-region quote-6. Confidential quote-4 stays excluded.
3. As the proposal user, edit/submit delegated quote-7. Remove the handover sharing and verify both stop; remove only the parent-project submit scope and verify submission stops.
4. As the delivery user, arrange eligible order relations and confirm delivery. Verify read-only users, inactive targets and protected fields are denied.

Reset business state before repeating transitions and restore changed rule/assignment configuration. Verify using ordinary accounts and direct API requests as well as UI. The tests cover page/action separation, field and row boundaries, multi-scope sharing, restrictions, relation rollback, seed/reset behavior and migration reversal. Use the inspector to explain sources; it does not replace execution tests.

## Route organization and Repository CRUD suitability

`server/routes/index.ts` is the only route contribution: it resolves dependencies, installs authentication, authorization and the request body limit, mounts the internal routers and maps errors. Internal router factories are composed under this protected boundary; they are not independent public contributions. `practice.ts` owns context/reset, `lists.ts` owns the three enriched business lists, `projects.ts` owns generated project queries/editing with business-action middleware, `quotes.ts` owns editing/submission, and `orders.ts` owns delivery relations/confirmation. `mutations.ts` shares input validation and writable-record lookup; `errors.ts` preserves the HTTP error mapping. Declare each endpoint explicitly, including all three lists; keep authorization, business validation, writes and responses visually separated. Shared query helpers should not hide route/action selection behind a loop.

Every hand-written route also declares itself for the application's API document, which a signed-in user reads at `/api/swagger/docs`. `describeRoute()` from `@nocobase/app-server/router` goes after the composite-action middleware and before `apiValidator()`, so the document lists what the route checks first: the `AuthorizationExample` tag, a summary, an `operationId` such as `authorizationExampleSubmitQuote`, and the responses, with the shared `403` (`forbiddenResponse`) and `413` (`bodyTooLargeResponse`) from `mutations.ts` and each route's own `400` reasons. The response schemas live in `schemas.ts` with `.meta({ ref })`. The generated `salesProjects` data endpoints need no declaration: the framework documents them from their Collection.

| Existing endpoint            | Suitability for generated Repository CRUD                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Project edit                 | Uses generated `updateOne`, bound to project `edit`, with independent input validation                                                     |
| Project/quote/order lists    | Custom presentation: include page navigation and per-record operation reasons; quote/order lists also include authorized project summaries |
| Quote edit                   | Keep a business handler: draft-only validation and an expected-state update predicate                                                      |
| Quote submit                 | Keep a business handler: consume both quote and actual parent-project policies, validate amount/state and conditionally update             |
| Order relation read          | Custom presentation: returns current relations, permitted operations and scoped target options                                             |
| Order relation write/deliver | Keep business handlers: state validation, relation policy enforcement or delivery-reference validation                                     |
| Context/reset                | Demonstration-specific logic, not generic CRUD                                                                                             |

The project router exposes `POST /salesProjects/findMany`, `/salesProjects/findOne`, `/salesProjects/count` and `/salesProjects/updateOne` through `defineRepositoryApiRoutes`; `authz.database.authorizeRepository` binds query methods to the `view` action of `example.sales.projects` and updates to `edit`. The existing GET list retains enriched display data. Project edit sends `{ filter: { id }, values }` and receives the Repository response; hidden targets return 404, and a value other than a text `title` or `notes` is refused `400 INVALID_INPUT` before the Repository runs. Do not replace the existing enriched lists with raw Repository responses or use collection-aggregated grants for business operations. Read the main authorization Skill’s bundled `references/repository-routes.md` for a complete integration example. Multi-scope authorization remains explicit in business handlers.
