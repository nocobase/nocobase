# ACL 权限管理

ACL 为 Nocobase 中的权限控制模块。在 ACL 中注册角色、资源以及配置相应权限之后，即可对角色进行权限判断。

## 概念解释

* 角色 (`ACLRole`)：权限判断的对象
* 资源 (`ACLResource`)：在 Nocobase ACL 中，资源通常对应一个数据库表，概念上可类比为 Restful API 中的 Resource。
* Action：对资源的操作，如 `create`、`read`、`update`、`delete` 等。
* 授权：在 `AclRole` 实例中调用 `grantAction` 函数，为角色授予 `Action` 的访问权限。
* 鉴权：在 `ACL` 实例中调用 `can` 函数，函数返回结果既为用户的鉴权结果。


## ACL

ACL 为权限管理类，系统中的角色与资源都可以在 ACL 中进行注册。

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
* `actions` - 定义角色时，可传入一个角色可访问的 `actions` 对象， 
之后会依次调用 `aclRole.grantAction` 授予资源权限。

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

**CanArgs 参数**

* role - 角色名称
* resource - 资源名称
* action - 操作名称

**CanResult 参数**

* role - 角色名称
* resource - 资源名称
* action - 操作名称
* params - 鉴权结果参数

## ACLRole

ACLRole，ACL 系统中的用户角色类。在 ACL 系统中，通常使用 `acl.define` 定义角色。

### `constructor(public acl: ACL, public name: string)`

* acl - ACL 实例
* name - 角色名称 

### `grantAction(path: string, options?: RoleActionParams)`

为角色授予 Action 权限

* path - 资源Action路径，如 `posts:edit`，表示 `posts` 资源的 `edit` Action, 资源名称和 Action 之间使用 `:` 冒号分隔。
* options?: RoleActionParams - 配置参数
  * fields - 可访问的字段
  * filter - 可访问的过滤条件
  * own - 是否只能访问自己的数据
  * whitelist - 白名单，只有在白名单中的字段才能被访问
  * blacklist - 黑名单，黑名单中的字段不能被访问


### ACLResource

