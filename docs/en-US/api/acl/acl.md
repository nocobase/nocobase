# ACL

## Overview

ACL is the permission control module in NocoBase. After registering roles and resources in ACL and configuring corresponding permissions, you can authenticate permissions for roles.

### Basic Usage

```javascript
const { ACL } = require('@nocobase/acl');

const acl = new ACL();

// Define a role named member
const memberRole = acl.define({
  role: 'member',
});

// Grant the role of member list permission of the posts resource
memberRole.grantAction('posts:list');

acl.can('member', 'posts:list'); // true
acl.can('member', 'posts:edit'); // null
```

### Concepts

* Role (`ACLRole`): Object that needs permission authentication.
* Resource (`ACLResource`)：In NocoBase ACL, a resource usually corresponds to a database table; it is conceptually analogous to the Resource in Restful API.
* Action: Actions to be taken on resources, such as `create`, `read`, `update`, `delete`, etc.
* Strategy (`ACLAvailableStrategy`): Normally each role has its own permission strategy, which defines the default permissions of the role.
* Grant Action: Call the `grantAction` function in `ACLRole` instance to grant access to `Action` for the role.
* Authentication: Call the `can` function in `ACL` instance, and return the authentication result of the user.

## Class Methods

### `constructor()`

To create a `ACL` instance.

```typescript
import { ACL } from '@nocobase/database';

const acl = new ACL();
```

### `define()`

Define a ACL role.

**Signature**

* `define(options: DefineOptions): ACLRole`

**Type**

```typescript
interface DefineOptions {
  role: string;
  allowConfigure?: boolean;
  strategy?: string | AvailableStrategyOptions;
  actions?: ResourceActionsOptions;
  routes?: any;
}
```

**Detailed Information**

* `role` - Name of the role

```typescript
// Define a role named admin
acl.define({
  role: 'admin',
});
```

* `allowConfigure` - Whether to allow permission configuration
* `strategy` - Permission strategy of the role
  * It can be a name of strategy in `string`, means to use a strategy that is already defined.
  * Or `AvailableStrategyOptions` means to define a new strategy for this role, refer to [`setAvailableActions()`](#setavailableactions).
* `actions` - Pass in the `actions` objects accessible to the role when defining the role, then call `aclRole.grantAction` in turn to grant resource permissions. Refer to [`aclRole.grantAction`](./acl-role.md#grantaction) for details

```typescript
acl.define({
  role: 'admin',
  actions: {
    'posts:edit': {}
  },
});
// Equivalent to
const role = acl.define({
  role: 'admin',
});

role.grantAction('posts:edit', {});
```

### `getRole()`

Get registered role objects by role name.

**Signature**

* `getRole(name: string): ACLRole`

### `removeRole()`

Remove role by role name.

**Signature**

* `removeRole(name: string)`

### `can()`

Authentication function.

**Signature**

* `can(options: CanArgs): CanResult | null`

**Type**

```typescript
interface CanArgs {
  role: string; // Name of the role
  resource: string; // Name of the resource
  action: string; // Name of the action
}

interface CanResult {
  role: string; // Name of the role
  resource: string; // Name of the resource
  action: string; // Name of the action
  params?: any; // Parameters passed in when registering the permission
}

```

**Detailed Information**

The `can` method first checks if the role has the corresponding `Action` permission registered; if not, it checks if the `strategy` and the role matches. It means that the role has no permissions if it returns `null`; else it returns the `CanResult` object, which means that the role has permissions.

**Example**

```typescript
// Define role and register permissions
acl.define({
  role: 'admin',
  actions: {
    'posts:edit': {
      fields: ['title', 'content'],
    },
  },
});

const canResult = acl.can({
  role: 'admin',
  resource: 'posts',
  action: 'edit',
});
/**
 * canResult = {
 *   role: 'admin',
 *   resource: 'posts',
 *   action: 'edit',
 *   params: {
 *     fields: ['title', 'content'],
 *   }
 * }
 */

acl.can({
  role: 'admin',
  resource: 'posts',
  action: 'destroy',
}); // null
```

### `use()`

**Signature**

* `use(fn: any)`
Add middleware function into middlewares.

### `middleware()`

Return a middleware function to be used in `@nocobase/server`. After using this `middleware`, `@nocobase/server` will perform permission authentication before each request is processed.

### `allow()`

Set the resource as publicly accessible.

**Signature**

* `allow(resourceName: string, actionNames: string[] | string, condition?: string | ConditionFunc)`

**Type**

```typescript
type ConditionFunc = (ctx: any) => Promise<boolean> | boolean;
```

**Detailed Information**

* resourceName - Name of the resource
* actionNames - Name of the resource action
* condition? - Configuration of the validity condition
  * Pass in a `string` to use a condition that is already defined; Use the  `acl.allowManager.registerCondition` method to register a condition.
    ```typescript
    acl.allowManager.registerAllowCondition('superUser', async () => {
      return ctx.state.user?.id === 1;
    });

    // Open permissions of the users:list with validity condition superUser
    acl.allow('users', 'list', 'superUser');
    ```
  * Pass in ConditionFunc, which can take the `ctx` parameter; return `boolean` that indicate whether it is in effect.
    ```typescript
    // user:list accessible to user with ID of 1
    acl.allow('users', 'list', (ctx) => {
      return ctx.state.user?.id === 1;
    });
    ```

**Example**

```typescript
// Register users:login to be publicly accssible
acl.allow('users', 'login');
```

### `setAvailableActions()`

**Signature**

* `setAvailableStrategy(name: string, options: AvailableStrategyOptions)`

Register an available permission strategy.

**Type**

```typescript
interface AvailableStrategyOptions {
  displayName?: string;
  actions?: false | string | string[];
  allowConfigure?: boolean;
  resource?: '*';
}
```

**Detailed Information**

* displayName - Name of the strategy
* allowConfigure - Whether this strategy has permission of **resource configuration**; if set to `true`, the permission that requests to register as `configResources` resource in `ACL` will return pass
* actions - List of actions in the strategy, wildcard `*` is supported
* resource - Definition of resource in the strategy, wildcard `*` is supported
