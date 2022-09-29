# ACLResource

ACLResource，ACL 系统中的资源类。在 ACL 系统中，为用户授予权限时会自动创建对应的资源。

## 基础数据结构

### `RoleActionParams`
RoleActionParams 为授权时，对应 action 的可配置参数，用以实现更细粒度的权限控制。

* fields - 可访问的字段
* filter - 可访问的过滤条件
* own - 是否只能访问自己的数据
* whitelist - 白名单，只有在白名单中的字段才能被访问
* blacklist - 黑名单，黑名单中的字段不能被访问

### `ResourceActions`

Action 集合对象：

* key 表示 action 的名称
* value 表示 action 的配置参数，见 [`RoleActionParams`](#RoleActionParams)。

**定义**
```typescript
type ResourceActions = { [key: string]: RoleActionParams };
```

## 类方法

### `constructor(options: AclResourceOptions)`

创建 `ACLResource` 实例

**AclResourceOptions 参数**

* options - 资源配置参数
  * name - 资源名称
  * role - 资源所属角色
  * actions - ResourceActions 对象，定义资源的 Action

### `getActions()`

获取资源的所有 Action，返回结果为 `ResourceActions` 对象。

### `getAction(name: string)`

根据名称返回 Action 的参数配置，返回结果为 `RoleActionParams` 对象。

## `setAction(name: string, params: RoleActionParams)`

在资源内部设置一个 Action 的参数配置，返回结果为 `RoleActionParams` 对象。

**参数**

* name - 要设置的 action 名称
* params - [`RoleActionParams`](#RoleActionParams)

## `setActions(actions: ResourceActions)`

批量调用 `setAction` 的便捷方法

**参数**

* actions: [RoleActionParams](#RoleActionParams)
