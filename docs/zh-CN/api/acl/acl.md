# ACL

## 概览

ACL 为 Nocobase 中的权限控制模块。在 ACL 中注册角色、资源以及配置相应权限之后，即可对角色进行权限判断。

### 基本使用

```javascript
const { ACL } = require('@nocobase/acl');

const acl = new ACL();

// 定义一个名称为 member 的角色
const memberRole = acl.define({
  role: 'member',
});

// 使 member 角色拥有 posts 资源的 list 权限
memberRole.grantAction('posts:list');

acl.can('member', 'posts:list'); // true
acl.can('member', 'posts:edit'); // null
```

### 概念解释

* 角色 (`ACLRole`)：权限判断的对象
* 资源 (`ACLResource`)：在 Nocobase ACL 中，资源通常对应一个数据库表，概念上可类比为 Restful API 中的 Resource。
* Action：对资源的操作，如 `create`、`read`、`update`、`delete` 等。
* 策略 (`ACLAvailableStrategy`): 通常每个角色都有自己的权限策略，策略中定义了默认情况下的用户权限。
* 授权：在 `ACLRole` 实例中调用 `grantAction` 函数，为角色授予 `Action` 的访问权限。
* 鉴权：在 `ACL` 实例中调用 `can` 函数，函数返回结果既为用户的鉴权结果。


## 类方法

### `constructor()`

构造函数，创建一个 `ACL` 实例。

```typescript
import { ACL } from '@nocobase/database';

const acl = new ACL();
```

### `define()`

定义一个 ACL 角色

**签名**
* `define(options: DefineOptions): ACLRole`

**类型**

```typescript
interface DefineOptions {
  role: string;
  allowConfigure?: boolean;
  strategy?: string | AvailableStrategyOptions;
  actions?: ResourceActionsOptions;
  routes?: any;
}
```

**详细信息**

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
  * 可以为 `AvailableStrategyOptions`，为该角色定义一个新的策略，参考[`setAvailableActions()`](#setavailableactions)。
* `actions` - 定义角色时，可传入角色可访问的 `actions` 对象，
  之后会依次调用 `aclRole.grantAction` 授予资源权限。详见 [`aclRole.grantAction`](./acl-role.md#grantaction)

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

### `getRole()`

根据角色名称返回已注册的角色对象

**签名**
* `getRole(name: string): ACLRole`

### `removeRole()`

根据角色名称移除角色

**签名**
* `removeRole(name: string)`

### `can()`
鉴权函数

**签名**
* `can(options: CanArgs): CanResult | null`

**类型**

```typescript
interface CanArgs {
  role: string; // 角色名称
  resource: string; // 资源名称
  action: string; //操作名称
}

interface CanResult {
  role: string; // 角色名称
  resource: string; // 资源名称
  action: string; // 操作名称
  params?: any; // 注册权限时传入的参数 
}

```

**详细信息**

`can` 方法首先会判断角色是否有注册对应的 `Action` 权限，如果没有则会去判断角色的 `strategy` 是否匹配。
调用返回为`null`时，表示角色无权限，反之返回 `CanResult`对象，表示角色有权限。

**示例**
```typescript
// 定义角色，注册权限
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

**签名**
* `use(fn: any)`
向 middlewares 中添加中间件函数。

### `middleware()`

返回一个中间件函数，用于在 `@nocobase/server` 中使用。使用此 `middleware` 之后，`@nocobase/server` 在每次请求处理之前都会进行权限判断。

### `allow()`

设置资源为可公开访问

**签名**
* `allow(resourceName: string, actionNames: string[] | string, condition?: string | ConditionFunc)`

**类型**
```typescript
type ConditionFunc = (ctx: any) => Promise<boolean> | boolean;
```

**详细信息**

* resourceName - 资源名称
* actionNames - 资源动作名
* condition? - 配置生效条件
  * 传入 `string`，表示使用已定义的条件，注册条件使用 `acl.allowManager.registerCondition` 方法。
    ```typescript
    acl.allowManager.registerAllowCondition('superUser', async () => {
      return ctx.state.user?.id === 1;
    });
    
    // 开放 users:list 的权限，条件为 superUser
    acl.allow('users', 'list', 'superUser');
    ```
  * 传入 ConditionFunc，可接收 `ctx` 参数，返回 `boolean`，表示是否生效。
    ```typescript
    // 当用户ID为1时，可以访问 user:list 
    acl.allow('users', 'list', (ctx) => {
      return ctx.state.user?.id === 1;
    });
    ```

**示例**

```typescript
// 注册 users:login 可以被公开访问
acl.allow('users', 'login');
```

### `setAvailableActions()`

**签名**

* `setAvailableStrategy(name: string, options: AvailableStrategyOptions)`

注册一个可用的权限策略

**类型**

```typescript
interface AvailableStrategyOptions {
  displayName?: string;
  actions?: false | string | string[];
  allowConfigure?: boolean;
  resource?: '*';
}
```

**详细信息**

* displayName - 策略名称
* allowConfigure - 此策略是否拥有 **配置资源** 的权限，设置此项为`true`之后，请求判断在 `ACL` 中注册成为 `configResources` 资源的权限，会返回通过。
* actions - 策略内的 actions 列表，支持通配符 `*`
* resource - 策略内的 resource 定义，支持通配符 `*`

