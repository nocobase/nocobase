# ACL Permission Control

ACL (Access Control List) is used to control permissions for resource operations. You can assign permissions to roles, or bypass role restrictions to directly constrain permissions. The ACL system provides a flexible permission management mechanism, supporting various methods such as permission snippets, middleware, and conditional checks.

:::tip Note

The ACL object belongs to a data source (`dataSource.acl`). The ACL for the main data source can be accessed via the `app.acl` shortcut. For information on using ACL with other data sources, see the [Data Source Manager](./data-source-manager.md) chapter.

:::

## Registering Permission Snippets

Permission snippets allow you to register commonly used permission combinations as reusable units. When a role is bound to a snippet, it gains the corresponding set of permissions. This reduces redundant configuration and improves the efficiency of permission management.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // The ui.* prefix indicates permissions configurable in the UI
  actions: ['customRequests:*'], // Corresponds to resource actions, supports wildcards
});
```

## Bypassing Role Constraints (allow)

`acl.allow()` is used to permit certain operations to bypass role constraints. It is suitable for public APIs, scenarios requiring dynamic permission checks, or situations where permissions need to be determined based on the request context.

```ts
// Public access, no login required
acl.allow('app', 'getLang', 'public');

// Accessible to logged-in users only
acl.allow('app', 'getInfo', 'loggedIn');

// Based on a custom condition
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**`condition` parameter:**

- `'public'`: Any user (including unauthenticated users) can access. No authentication is required.
- `'loggedIn'`: Only authenticated users can access. A valid user identity is required.
- `(ctx) => Promise<boolean>` or `(ctx) => boolean`: A custom function that dynamically determines access based on the request context, allowing for complex permission logic.

## Registering Permission Middleware (use)

`acl.use()` registers custom permission middleware, allowing you to insert custom logic into the permission checking process. It is often used with `ctx.permission` to define custom permission rules. This is suitable for unconventional access control scenarios, such as public forms that require custom password validation or dynamic permission checks based on request parameters.

**Typical Use Cases:**

- Public forms: No user or role, but permissions are constrained by a custom password.
- Permission control based on request parameters, IP addresses, etc.
- Custom permission rules to skip or modify the default permission checking process.

**Controlling Permissions with `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Example: A public form requires password validation to skip permission checks
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Validation passed, skip permission check
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Proceed with the permission check (continue the ACL flow)
  await next();
});
```

**`ctx.permission` Properties:**

- `skip: true`: Skips subsequent ACL permission checks, granting access directly.
- Can be set dynamically within the middleware based on custom logic for flexible permission control.

## Adding Fixed Data Constraints for Specific Actions (addFixedParams)

`addFixedParams` can add fixed data scope (filter) constraints to operations on certain resources. These constraints are applied directly, bypassing role restrictions, and are typically used to protect critical system data.

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

// Even if a user has permission to delete roles, they cannot delete the system roles: root, admin, and member.
```

> **Tip:** `addFixedParams` can be used to prevent sensitive data from being accidentally deleted or modified, such as built-in system roles or administrator accounts. These constraints are combined with role permissions, ensuring that protected data cannot be manipulated even by users with the necessary permissions.

## Checking Permissions (can)

`acl.can()` is used to determine if a role has permission to perform a specific action. It returns a permission result object or `null`. It is often used for dynamic permission checks within business logic, such as in middleware or action handlers, to decide whether to allow certain operations based on a role.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Can be a single role or an array of roles
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Role ${result.role} can perform the ${result.action} action`);
  // result.params contains the fixed parameters set by addFixedParams
  console.log('Fixed parameters:', result.params);
} else {
  console.log('Permission denied for this action');
}
```

> **Tip:** If multiple roles are provided, they are checked sequentially, and the result for the first role that has permission is returned.

**Type Definitions:**

```ts
interface CanArgs {
  role?: string;      // A single role
  roles?: string[];   // Multiple roles (checked sequentially; returns the first one with permission)
  resource: string;   // Resource name
  action: string;    // Action name
}

interface CanResult {
  role: string;       // The role that has permission
  resource: string;   // Resource name
  action: string;    // Action name
  params?: any;       // Fixed parameter info (if set via addFixedParams)
}
```

## Registering Configurable Actions (setAvailableAction)

If you want a custom action to be configurable in the UI (e.g., displayed on the role management page), you need to register it using `setAvailableAction`. After registration, the action will appear in the permission configuration interface, allowing administrators to configure its permissions for different roles.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Display name in the UI, supports i18n
  type: 'new-data',               // Action type
  onNewRecord: true,              // Whether it takes effect on new record creation
});
```

**Parameters:**

- **displayName**: The name displayed in the permission configuration UI. It supports internationalization (using the `{{t("key")}}` format).
- **type**: The action type, which determines its category in the permission settings.
  - `'new-data'`: Actions that create new data (e.g., import, add new).
  - `'existing-data'`: Actions that modify existing data (e.g., update, delete).
- **onNewRecord**: Whether the action takes effect when a new record is created. This is only valid for the `'new-data'` type.

After registration, this action will appear in the permission configuration interface, where administrators can configure its permissions on the role management page.