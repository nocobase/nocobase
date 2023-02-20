# ACLResource

ACLResource is the resource class in ACL system. In ACL systems, the corresponding resource is created automatically when granting permission to user.

## Class Methods

### `constructor()`

Constructor.

**Signature**
* `constructor(options: AclResourceOptions)`

**Type**
```typescript
type ResourceActions = { [key: string]: RoleActionParams };

interface AclResourceOptions {
  name: string; // Name of the resource
  role: ACLRole; // Role to which the resource belongs
  actions?: ResourceActions;
}
```

**Detailed Information**

Refer to [`aclRole.grantAction`](./acl-role.md#grantaction) for details about `RoleActionParams`.

### `getActions()`

Get all actions of the resource, the return is `ResourceActions` object.

### `getAction()`

Get the parameter configuration of the action by name, the return is `RoleActionParams` object.

**Detailed Information**

Refer to  [`aclRole.grantAction`](./acl-role.md#grantaction) for 
`RoleActionParams`.

### `setAction()`

Set the parameter configuration of an action inside the resource, the return is `RoleActionParams` object.

**Signature**
* `setAction(name: string, params: RoleActionParams)`

**Detailed Information**

* name - Name of the action to set
* Refer to [`aclRole.grantAction`](./acl-role.md#grantaction) for details about `RoleActionParams`.

### `setActions()`

**Signature**
* `setActions(actions: ResourceActions)`

A shortcut for calling `setAction` in batches.
