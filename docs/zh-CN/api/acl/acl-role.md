# ACL Role

ACLRole，ACL 系统中的用户角色类。在 ACL 系统中，通常使用 `acl.define` 定义角色。

## 类方法

### `constructor(public acl: ACL, public name: string)`

* acl - ACL 实例
* name - 角色名称

### `grantAction(path: string, options?: RoleActionParams)`

为角色授予 Action 权限

* path - 资源Action路径，如 `posts:edit`，表示 `posts` 资源的 `edit` Action, 资源名称和 Action 之间使用 `:` 冒号分隔。
* options? - 配置参数，见 [`RoleActionParams`](#RoleActionParams)。

