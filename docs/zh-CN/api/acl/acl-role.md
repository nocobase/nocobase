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


## 参数

### `RoleActionParams`

RoleActionParams 为授权时，对应 action 的可配置参数，用以实现更细粒度的权限控制。

* fields - 可访问的字段
  ```typescript
  acl.define({
    role: 'admin',
    actions: {
      'posts:view': {
        // admin 用户可以请求 posts:view action，但是只有 fields 配置的字段权限
        fields: ["id", "title", "content"], 
      },
    },
  });
  ```
* filter - 权限资源过滤配置
  ```typescript
  acl.define({
    role: 'admin',
    actions: {
      'posts:view': {
        // admin 用户可以请求 posts:view action，但是列出的结果必须满足 filter 设置的条件。
        filter: {
          createdById: '{{ ctx.state.currentUser.id }}', // 支持模板语法，可以取 ctx 中的值，将在权限判断时替换
        },
      },
    },
  });
  ```
* own - 是否只能访问自己的数据
  ```typescript
  const actionsWithOwn = {
    'posts:view': {
      "own": true // 
     }
  }
  
  // 等价于
  const actionsWithFilter =  {
    'posts:view': {
      "filter": {
        "createdById": "{{ ctx.state.currentUser.id }}"
      }
    }
  }
  ```
* whitelist - 白名单，只有在白名单中的字段才能被访问
* blacklist - 黑名单，黑名单中的字段不能被访问
