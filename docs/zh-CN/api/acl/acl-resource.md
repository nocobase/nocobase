# ACLResource

ACLResource，ACL 系统中的资源类。在 ACL 系统中，为用户授予权限时会自动创建对应的资源。


## 类方法

### `constructor()`
构造函数

**签名**
* `constructor(options: AclResourceOptions)`

**类型**
```typescript
type ResourceActions = { [key: string]: RoleActionParams };

interface AclResourceOptions {
  name: string; // 资源名称
  role: ACLRole; // 资源所属角色
  actions?: ResourceActions;
}
```

**详细信息**

`RoleActionParams`详见 [`aclRole.grantAction`](./acl-role.md#grantaction)

### `getActions()`

获取资源的所有 Action，返回结果为 `ResourceActions` 对象。

### `getAction()`
根据名称返回 Action 的参数配置，返回结果为 `RoleActionParams` 对象。

**详细信息**

`RoleActionParams`详见 [`aclRole.grantAction`](./acl-role.md#grantaction)

### `setAction()`

在资源内部设置一个 Action 的参数配置，返回结果为 `RoleActionParams` 对象。

**签名**
* `setAction(name: string, params: RoleActionParams)`

**详细信息**

* name - 要设置的 action 名称
* `RoleActionParams`详见 [`aclRole.grantAction`](./acl-role.md#grantaction)

### `setActions()`

**签名**
* `setActions(actions: ResourceActions)`

批量调用 `setAction` 的便捷方法
