# ACLRole

ACLRole is the user role class in ACL system. In ACL systems, roles are usually defined by `acl.define`.

## Class Methods

### `constructor()`

Constructor.

**Signature**
* `constructor(public acl: ACL, public name: string)`

**Detailed Information**
* acl - ACL instance
* name - Name of the role

### `grantAction()`

Grant the action permission to the role. 

**Signature**
* `grantAction(path: string, options?: RoleActionParams)`

**Type**
```typescript
interface RoleActionParams {
  fields?: string[];
  filter?: any;
  own?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  [key: string]: any;
}
```

**Detailed Information**

* path - Action path of the resource, such as `posts:edit`, which means the `edit` action of the `posts` resource. Use colon `:` to separate the name of resource and action.

When RoleActionParams is to grant permission, the corresponding action can be configured with parameters to achieve finer-grained permission control.

* fields - Accessible fields
  ```typescript
  acl.define({
    role: 'admin',
    actions: {
      'posts:view': {
        // admin user can request posts:view action, but limited to the configured fields
        fields: ["id", "title", "content"], 
      },
    },
  });
  ```
* filter - Permission resource filtering configuration
  ```typescript
  acl.define({
    role: 'admin',
    actions: {
      'posts:view': {
        // admin user can request posts:view action, but the listed results is filtered by conditions in the filter
        filter: {
          createdById: '{{ ctx.state.currentUser.id }}', // Template syntax is supported to take the value in ctx, and will be replaced when checking permissions
        },
      },
    },
  });
  ```
* own - Whether to access only your own data
  ```typescript
  const actionsWithOwn = {
    'posts:view': {
      "own": true // 
     }
  }
  
  // Equivalent to
  const actionsWithFilter =  {
    'posts:view': {
      "filter": {
        "createdById": "{{ ctx.state.currentUser.id }}"
      }
    }
  }
  ```
* whitelist - Whitelist, only the fields in whitelist can be accessed
* blacklist - Blacklist, fields in blacklist cannot be accessed
