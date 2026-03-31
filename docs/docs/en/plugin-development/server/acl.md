# ACL

ACL (Access Control List) is used to control resource operation permissions. You can grant permissions to roles, or skip role restrictions and directly constrain permissions. The ACL system provides a flexible permission management mechanism, supporting permission snippets, middleware, conditional judgment, and other methods.

:::tip Note

ACL objects belong to data sources (`dataSource.acl`). The main data source's ACL can be accessed via `app.acl`. For usage of other data sources' ACL, see the [Data Source Management](./data-source-manager.md) chapter.

:::

## Register Permission Snippets

Permission snippets (Snippet) can register commonly used permission combinations as reusable permission units. After a role is bound to a snippet, it obtains the corresponding set of permissions, reducing duplicate configuration and improving permission management efficiency.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // ui.* prefix indicates permissions that can be configured on the interface
  actions: ['customRequests:*'], // Corresponding resource operations, supports wildcards
});
```

## Permissions That Skip Role Constraints (allow)

`acl.allow()` is used to allow certain operations to bypass role constraints, suitable for public APIs, scenarios requiring dynamic permission evaluation, or cases where permission judgment needs to be based on request context.

```ts
// Public access, no login required
acl.allow('app', 'getLang', 'public');

// Accessible to logged-in users
acl.allow('app', 'getInfo', 'loggedIn');

// Based on a custom condition
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**condition parameter description:**

- `'public'`: Any user (including unauthenticated users) can access without any authentication
- `'loggedIn'`: Only logged-in users can access, requires valid user identity
- `(ctx) => Promise<boolean>` or `(ctx) => boolean`: Custom function that dynamically determines whether access is allowed based on request context, can implement complex permission logic

## Register Permission Middleware (use)

`acl.use()` is used to register custom permission middleware, allowing custom logic to be inserted into the permission check flow. Usually used together with `ctx.permission` for custom permission rules. Suitable for scenarios requiring unconventional permission control, such as public forms needing custom password verification, dynamic permission checks based on request parameters, etc.

**Typical application scenarios:**

- Public form scenarios: No user, no role, but permissions need to be constrained through custom passwords
- Permission control based on request parameters, IP addresses, and other conditions
- Custom permission rules, skipping or modifying the default permission check flow

**Control permissions through `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Example: Public form needs password verification to skip permission check
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verification passed, skip permission check
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Execute permission check (continue ACL flow)
  await next();
});
```

**`ctx.permission` property description:**

- `skip: true`: Skip subsequent ACL permission checks and directly allow access
- Can be dynamically set in middleware based on custom logic to achieve flexible permission control

## Add Fixed Data Constraints for Specific Operations (addFixedParams)

`addFixedParams` can add fixed data scope (filter) constraints to certain resource operations. These constraints bypass role restrictions and are directly applied, usually used to protect critical system data.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Even if a user has permission to delete roles, they cannot delete system roles like root, admin, member
```

> **Tip:** `addFixedParams` can be used to prevent sensitive data from being accidentally deleted or modified, such as system built-in roles, administrator accounts, etc. These constraints work in combination with role permissions, ensuring that even with permissions, protected data cannot be manipulated.

## Check Permissions (can)

`acl.can()` is used to check whether a role has permission to execute a specified operation, returning a permission result object or `null`. Commonly used to dynamically check permissions in business logic, such as determining whether certain operations are allowed based on roles in middleware or operation handlers.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Can pass a single role or role array
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Role ${result.role} can execute ${result.action} operation`);
  // result.params contains fixed parameters set through addFixedParams
  console.log('Fixed parameters:', result.params);
} else {
  console.log('No permission to execute this operation');
}
```

> **Tip:** If multiple roles are passed, each role will be checked sequentially, and the result for the first role that has permission will be returned.

**Type definitions:**

```ts
interface CanArgs {
  role?: string;      // Single role
  roles?: string[];   // Multiple roles (checked sequentially, returns the first role with permission)
  resource: string;   // Resource name
  action: string;    // Operation name
}

interface CanResult {
  role: string;       // Role with permission
  resource: string;   // Resource name
  action: string;    // Operation name
  params?: any;       // Fixed parameter information (if set through addFixedParams)
}
```

## Register Configurable Operations (setAvailableAction)

If you want custom operations to be configurable on the interface (such as displaying in the role management page), you need to use `setAvailableAction` to register them. Registered operations will appear in the permission configuration interface, where administrators can configure operation permissions for different roles.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Interface display name, supports internationalization
  type: 'new-data',               // Operation type
  onNewRecord: true,              // Whether to take effect when creating new records
});
```

**Parameter description:**

- **displayName**: Name displayed in the permission configuration interface, supports internationalization (using `{{t("key")}}` format)
- **type**: Operation type, determines the classification of this operation in permission configuration
  - `'new-data'`: Operations that create new data (such as import, create, etc.)
  - `'existing-data'`: Operations that modify existing data (such as update, delete, etc.)
- **onNewRecord**: Whether to take effect when creating new records, only valid for `'new-data'` type

After registration, this operation will appear in the permission configuration interface, where administrators can configure the operation's permissions in the role management page.

