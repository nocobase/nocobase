# ACL

ACL 为权限管理类，系统中的角色与资源都可以在 ACL 中进行注册。

## 成员变量

### `availableActions: Map<string, AclAvailableAction>`

ACL 内的 `AclAvailableAction` 名称映射。

### `availableStrategy: Map<string, ACLAvailableStrategy>`

ACL 内的 [`ACLAvailableStrategy`](#ACLAvailableStrategy) 名称映射。

### `middlewares`

ACL 鉴权中间件。

### `roles: Map<string, ACLRole>`

ACL 内的 `ACLRole` 名称映射。

### `actionAlias: Map<string, string>`

Action 别名映射。

### `configResources: Array<string>`

配置资源列表。

## 类方法

### `constructor()`

构造函数，创建一个 `ACL` 实例。

```typescript
import { ACL } from '@nocobase/database';

const acl = new ACL();
```
### `define(options: DefineOptions)`

定义系统角色

**DefineOptions 参数**

* `role` - 角色名称

```typescript
// 定义一个名称为 admin 的角色
acl.define({
  role: 'admin',
});
```

* `allowConfigure` - 是否允许配置权限
* `strategy` - 角色的权限策略
  * 可以为 `string`，为要使用的策略名，表示使用已定义的策略。
  * 可以为 `AvailableStrategyOptions`，为该角色定义一个新的策略。
* `actions` - 定义角色时，可传入角色可访问的 `actions` 对象，
  之后会依次调用 `aclRole.grantAction` 授予资源权限。详见 [`ResourceActionsOptions`](#ResourceActionsOptions)

```typescript
acl.define({
  role: 'admin',
  actions: {
    'posts:edit': {}
  },
});
// 等同于
const role = acl.define({
  role: 'admin',
});

role.grantAction('posts:edit', {});
```

### `getRole(name: string): ACLRole`

根据角色名称返回角色对象

### `removeRole(name: string)`

根据角色名称移除角色

### `can({ role, resource, action }: CanArgs): CanResult | null`

鉴权函数，调用返回为`null`时，表示角色无权限，反之返回`CanResult`对象，表示角色有权限。

`can` 方法首先会判断角色是否有注册对应的 `Action` 权限，如果没有则会去判断角色的 `strategy` 是否匹配.

**CanArgs 参数**

* role - 角色名称
* resource - 资源名称
* action - 操作名称

**CanResult 参数**

* role - 角色名称
* resource - 资源名称
* action - 操作名称
* params - 鉴权结果参数

### `use(fn: any)`

向 middlewares 中添加中间件函数。

### `middleware()`

返回一个中间件函数，用于在 `@nocobase/server` 中使用。使用此 `middleware` 之后，`@nocobase/server` 在每次请求处理之前都会进行权限判断。

### `setAvailableStrategy(name: string, options: AvailableStrategyOptions)`

注册一个可用的权限策略

### `registerConfigResource(name: string)`

将传入的资源名称设置为**配置资源**。配置资源是指这样的一种资源，这些资源的改动会调用`ACL`中的角色、权限注册相关方法，例如用户、权限、角色等，这些资源就需要被设置为配置资源。

### `registerConfigResources(names: string[])`

`registerConfigResource` 的批量方法

### `isConfigResource(name: string)`

判断传入的资源名称是否为配置资源

### `setAvailableStrategy(name: string, options: AvailableStrategyOptions)`

设置可用的权限策略，详见 [`AvailableStrategyOptions`](#AvailableStrategyOptions)

### `allow(resourceName: string, actionNames: string[] | string, condition?: any)`

在不指定角色的情况下，开放资源的访问权限。
举例来说，例如登录操作，可以被公开访问：

```typescript
// users:login 可以被公开访问
acl.allow('users', 'login');
```

**参数**
* resourceName - 资源名称
* action - 资源动作名
* condition? - 配置生效条件
  * 传入 `string`，表示使用已定义的条件，注册条件使用 `acl.allowManager.registerCondition` 方法。
    ```typescript
    acl.allowManager.registerAllowCondition('superUser', async () => {
      return ctx.state.user?.id === 1;
    });
    
    // 开放 users:list 的权限，条件为 superUser
    acl.allow('users', 'list', 'superUser');
    ```
  * 传入 function，可接收 `ctx` 参数，返回 `boolean`，表示是否生效。
    ```typescript
    // 当用户ID为1时，可以访问 user:list 
    acl.allow('users', 'list', (ctx) => {
      return ctx.state.user?.id === 1;
    });
    ```
