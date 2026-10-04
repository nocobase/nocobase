# Build a business module with authorization

Use a quote submission workflow as the reference: engineers prepare quotes; project responsibility determines whether they can submit them; a delegated engineer can receive an explicit handover. Orders have separate delivery responsibilities; submitting a quote does not create an order. The same design applies to approvals, service tickets and project work. Implement these patterns in the App's own feature files.

## 1. Write the responsibility matrix

| Job                 | Entry            | Action                   | Record boundary                                  | Data capability                                  |
| ------------------- | ---------------- | ------------------------ | ------------------------------------------------ | ------------------------------------------------ |
| Sales assistant     | Projects, Quotes | View                     | Public/assigned materials                        | Read business fields                             |
| Sales engineer      | Quotes           | Edit draft               | Prepared by current user or explicitly delegated | Write amount and notes                           |
| Sales engineer      | Quotes           | Submit                   | Both accessible quote and responsible project    | Read parent; update quote status                 |
| Project manager     | Projects         | Maintain                 | Owned projects                                   | Write project details                            |
| Delivery specialist | Orders           | Arrange/confirm delivery | Owned/assigned orders                            | Relation operations or delivery status/reference |

Resolve unclear cases before granting access: may users consult colleagues' quotes, may a delegate submit as well as edit, and does confidentiality apply to every access path? Prefer meaningful action names to exposing all CRUD operations of every table.

## 2. Model and declare

Model ownership and preparer ids, project relations, region membership and any team or department membership as business data. Make membership changes an authorized business API. Keep credentials and fixture accounts out of production feature seeds.

Create `server/sales-resources.ts` using the complete `quotes` declaration in [runtime integration](runtime-api.md#declare-a-business-operation). `defineDatabasePermission` declares fields and relation capabilities; `defineCompositeResource` binds them to data scope keys. A `submit` action binds `quotes` to quote read and status update and `projects` to parent read. Give independently controlled collections separate keys even when a workflow edits only one of them.

Keep portable declarations free of database queries so seeds and provisioning can reuse `quotes.reference().grant(...)`. Return fluent builders from callbacks. Define translations in the owning package and use `{ key, ns }` for persisted titles. Do not repeat resource and action strings in permission sets when a typed reference is available.

## 3. Register record access

Resolve `authorizationToken` and the database in the owning provider. Register collections and composites there, add the workspace subsection with `authz.ui.sections.add` and place each composite with `authz.ui.place`, and register record access with `authz.recordAccess.define`.

The following application-owned `server/sales-record-access.ts` implements the two selections the engineer set needs. Its migrations must define `quotes.preparedById`, `projects.region` and a trusted `salesMembers` table with user id and region; membership is maintained by authorized business code. A resolver receives `{ principal, collection, action, params }` and returns `true`, `false` or a filter on the collection's own columns. Answer no memberships with `false`, never with all records. Declare `.collections(...)` accurately and type optional parameters with `.params<P>(schema)`.

```ts
import { defineRecordAccess } from '@nocobase/authorization/core';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseManager } from '@nocobase/db';
import { buildFilter } from '@nocobase/repository-input';

export function registerSalesRecordAccess(
  authz: AppAuthorization,
  database: DatabaseManager,
): void {
  authz.recordAccess.define(
    defineRecordAccess('sales.prepared', (access) =>
      access
        .title('Prepared by me')
        .collections('quotes')
        .resolver(({ principal }) =>
          principal.type === 'user'
            ? buildFilter((f) => f.string('preparedById').eq(principal.id))
            : false,
        ),
    ),
  );
  authz.recordAccess.define(
    defineRecordAccess('sales.region', (access) =>
      access
        .title('My sales region')
        .collections('projects')
        .resolver(async ({ principal }) => {
          if (principal.type !== 'user') return false;
          const member = await database
            .connection()
            .query.selectFrom('salesMembers')
            .select('region')
            .where('id', '=', principal.id)
            .executeTakeFirst();
          return member
            ? buildFilter((f) => f.string('region').eq(String(member.region)))
            : false;
        }),
    ),
  );
}
```

Call `registerSalesRecordAccess` from the same provider boot that registers the composites. For public or owned quote and order selections, first select project ids with the trusted confidentiality or ownership predicate, then return a filter on the child collection's `projectId`; return `false` when no projects match. The following helper supplies the public quote selection used by the optional rule examples:

```ts
export function registerPublicQuoteAccess(
  authz: AppAuthorization,
  database: DatabaseManager,
): void {
  authz.recordAccess.define(
    defineRecordAccess('sales.public', (access) =>
      access
        .title('Public projects')
        .collections('quotes')
        .resolver(async () => {
          const projects = await database
            .connection()
            .query.selectFrom('projects')
            .select('id')
            .where('confidential', '=', false)
            .execute();
          return projects.length
            ? buildFilter((f) =>
                f.or(
                  projects.map((p) => f.string('projectId').eq(String(p.id))),
                ),
              )
            : false;
        }),
    ),
  );
}
```

This is a resolver's trusted lookup, not a public list endpoint. The model needs `projects.confidential`. When one record access applies to several collections, pass each to `.collections(...)` and branch on `collection` to map the right parent, instead of treating every collection's id as a project id. For large datasets, implement a database-backed parent lookup and measure it; a list of ids is not a universal scaling design.

Reuse the built-in `recordAccess.recordsIOwn` and `recordAccess.recordsICreated` when the collection has the corresponding column (default `ownerId` and `createdById`, configurable with `params.field`), `recordAccess.customFilter` for a fixed filter and `recordAccess.allRecords` for everything. Use custom record access when ownership follows a parent. Do not assume an id from a team subject is a user id; user-dependent resolvers must check the principal type.

## 4. Enforce at the endpoint

Use an App-owned `defineApiRoutes` factory that creates a Hono router, resolves services, and installs authentication, authorization and input limits. Business code accepts the resolved policy rather than unrestricted repositories.

The following service function accepts the request's authorization context. Its caller authenticates first, installs `authz.middleware()`, and calls `await submitQuote(database, c.var.authz, c.req.param('id'))`. Keep it in an App-owned module, then return the route's success response only after it resolves.

```ts
import type { AuthorizationContext } from '@nocobase/app-plugin-authorization/server';
import { ApiError } from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';

const forbidden = (): ApiError =>
  new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'QUOTE_SUBMIT_DENIED',
    domain: 'sales',
    message: 'Submitting this quote is not allowed.',
  });

export async function submitQuote(
  database: DatabaseManager,
  authorization: AuthorizationContext,
  quoteId: string,
): Promise<void> {
  const decision = await authorization.authorize({
    resource: { type: 'composite', id: 'sales.quotes' },
    action: 'submit',
  });
  const policies = decision.conditions?.database;
  if (decision.effect === 'deny' || !policies?.quotes || !policies.projects)
    throw forbidden();
  const quotePolicy = policies.quotes;
  const projectPolicy = policies.projects;

  await database.transaction(async (connection) => {
    const quotes = connection.repository('quotes').withPolicy(quotePolicy);
    const quote = await quotes.findOne({ filter: { id: quoteId } });
    if (!quote || typeof quote.projectId !== 'string')
      throw new ApiError({
        status: 'NOT_FOUND',
        reason: 'QUOTE_NOT_FOUND',
        domain: 'sales',
        message: `Quote ${quoteId} was not found.`,
      });

    const project = await connection
      .repository('projects')
      .withPolicy(projectPolicy)
      .findOne({ filter: { id: quote.projectId } });
    if (!project) throw forbidden();
    if (quote.status !== 'draft')
      throw new ApiError({
        status: 'FAILED_PRECONDITION',
        reason: 'QUOTE_NOT_DRAFT',
        domain: 'sales',
        message: 'Only a draft quote can be submitted.',
      });
    if (typeof quote.amount !== 'number' || quote.amount <= 0)
      throw new ApiError({
        status: 'FAILED_PRECONDITION',
        reason: 'QUOTE_AMOUNT_REQUIRED',
        domain: 'sales',
        message: 'A quote needs a positive amount before it is submitted.',
      });

    await quotes.updateOne({
      // Preserve the parent and business state actually checked above.
      filter: {
        id: quoteId,
        projectId: quote.projectId,
        status: 'draft',
        amount: quote.amount,
      },
      values: { status: 'submitted' },
    });
  });
}
```

Each `ApiError` is answered in the standard error body; clients branch on `reason`. Repository errors that propagate are rendered by the application (a refused read or write is 403, `RECORD_NOT_FOUND` 404); a route that must not disclose which records exist translates `RECORD_NOT_FOUND` into its own 403 `ApiError` in its `onError` before delegating to `apiErrorHandler`. It does not expose database errors. A concurrent change that invalidates the update predicate must fail; never retry it as an unconditional write. If a workflow requires a parent state to remain unchanged until commit, add appropriate locking or version checks for that parent too; a transaction alone does not supply that guarantee.

Do not fetch unrestricted data and filter it in JavaScript. Do not query only the parent ID supplied by the client. Do not call `require` or `authz.database.policyFor` after this decision; the business decision already includes every underlying check and policy. Resolve authorization once per request and bind its results to the repositories on the transaction connection.

For collection CRUD without an operation boundary, use `authz.database.policyFor` and bind the result. For simple business Repository API routes, use [business-action middleware](repository-routes.md) while retaining static route policies. Mount it on all exposed actions. An endpoint policy is a maximum, not a source of grants.

## 5. Configure roles and scope rules

Complete this configuration as part of delivering the permission feature, for both new modules and changes to existing ones. Determine which declarations need development and which existing configurations need adjustment from the responsibility matrix. Use installation seeds for a fresh App or authorized provisioning for an existing App; keep administrator-owned configuration editable and preserve unrelated choices.

Create the engineer set with page access and quote actions as separate grants. Configure edit with the preparer selection; submit with the preparer and region selections. Do not use project ownership as an edit default if that would reopen a colleague's quote.

The following rule-based extensions require the corresponding installed Skills; follow [capability discovery](optional-capabilities.md) first. Without them, describe the missing capability as separate development rather than assuming it is available. Add default access only for an intentional baseline. Add sharing for the delegation exception: the delegated quote's edit and submit scopes plus its actual parent project's submit scope, assigned to the delegated engineer. Sharing the quote does not automatically grant its parent or the submit action. Add restrictions for confidential records at the appropriate boundary; a collection restriction covers all operation branches when the invariant must apply everywhere.

Use the three optional rule Skills for implementation. Follow [code declarations and seeds](code-and-seeds.md) for an executable permission-set declaration, persistence row shapes and initialization rules. Migrations contain schema operations only. Keep demonstration account creation and practice reset out of production features.

## 6. Relations and transitions

An order's carrier, checks and collaborating carriers have different capabilities. The delivery role may connect an active carrier, create/update/delete checks, and set collaborators with a public `note`; that does not permit editing carrier records or an internal join-table note. Declare each through the fluent relation API and keep protected foreign keys out of root writable fields.

Read expansion and relation mutation need separate allowlists. Test nested create/update/upsert/delete and connect/disconnect/set only where the feature offers them. Upsert requires both create and update grants. A denied nested operation must roll back the entire mutation. The complete relation declaration pattern is in [fluent declarations](fluent-registration.md).

Business state remains an independent rule: completed orders can be read while delivery arrangement is closed. Checking an authorization capability does not override that state restriction.

## 7. Client and verification

Declare `authz` on every entry client route, which nested pages inherit; a business page uses `{ resource: { type: 'page', id }, action: 'access' }` with a stable id. Follow [client development](client-development.md), including a complete action component. Use `useCan({ resource, action })` for action visibility and the server's per-record eligibility for row controls. Show useful loading/error/retry behavior. Invalidate affected lists and relationship controls after mutation while preserving the current selection when appropriate.

Verify using the real route factory and database: an engineer can edit an out-of-region draft but cannot submit it; a colleague's quote remains unwritable; a delegated quote still needs parent access; confidential rows remain excluded despite sharing; when a job is inherited through a team or department, removing that source leaves unrelated direct responsibilities intact. Verify page-only permission cannot read data and action-only permission cannot open the page. Use ordinary accounts, not root, and inspect decisions for both success and denial.
