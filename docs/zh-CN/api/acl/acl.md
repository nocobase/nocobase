# ACL

ACL 为权限管理类，系统中的角色与资源都可以在 ACL 中进行注册。

## 基础数据结构

### `AvailableStrategyOptions`

策略定义参数，用以描述一组权限配置规则。

* displayName - 策略名称
* actions - 策略内的 actions 列表，支持通配符 `*`
* resource - 策略内的 resource 定义，支持通配符 `*`

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

**CanArgs 参数**

* role - 角色名称
* resource - 资源名称
* action - 操作名称

**CanResult 参数**

* role - 角色名称
* resource - 资源名称
* action - 操作名称
* params - 鉴权结果参数
