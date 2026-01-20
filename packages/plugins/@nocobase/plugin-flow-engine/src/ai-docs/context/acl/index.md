# ctx.acl / ctx.can

`ctx.acl` exposes the access-control layer inside a flow runtime. Use `ctx.acl.can(options)` (or `ctx.can`) to evaluate whether the current principal can perform an action on a collection or field-level resource.

## Usage Patterns

- **Collection permissions** (`@nocobase/plugin-flow-engine/src/ai-docs/context/acl/basic.ts`):
  - `canListUsers`: `action: 'list'`
  - `canGetUser`: `action: 'get'` with `filterByTk`
  - `canCreateUser`: `action: 'create'`
  - `canUpdateUser`: `action: 'update'`
  - `canDestroyUsers`: `action: 'destroy'` (bulk or single record)
- **Field-level permissions** (`@nocobase/plugin-flow-engine/src/ai-docs/context/acl/basic.ts`):
  - `canReadFields`: set `fields` for read checks
  - `canWriteFields`: set `fields` for write checks

Each helper returns the Promise from `ctx.acl.can`, so callers can `await` and branch on the boolean result. Use consistent `resource` names (e.g., `users`) plus `filterByTk` to scope to a specific row.
