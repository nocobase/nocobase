# ACL

访问控制

## ACL API

### acl.allow()

```ts
class ACL {
  allow(options?: AllowOptions | AllowOptions[]);
}

interface AllowOptions {
  role: string;
  action: string | string[];
  resource?: string;
  params?: any;
}
```

Examples

role1 角色，不限资源，可以查看列表和详情

```ts
acl.allow({
  role: 'role1',
  action: ['get', 'list'],
});
```

role1 角色，不限资源，什么 action 都可以

```ts
acl.allow({
  role: 'role1',
  action: '*',
});
```

role1 角色，posts 资源，只能查看列表和详情

```ts
acl.allow({
  role: 'role1',
  resource: 'posts',
  action: ['get', 'list'],
});
```

role1 角色，posts 资源，只能查看自己的数据

```ts
acl.allow({
  role: 'role1',
  resource: 'posts',
  action: ['get:own', 'list:own'],
});
```

role1 角色，posts 资源，只能查看公开的的数据

```ts
acl.allow({
  role: 'role1',
  resource: 'posts',
  action: ['get', 'list'],
  scope: { status: 'published' },
});
```

role1 角色，posts 资源，可以创建记录，但只能是白名单里的字段

```ts
acl.allow({
  role: 'role1',
  resource: 'posts',
  action: 'create',
  whitelist: ['field1', 'field2', 'field3'],
});
```

### acl.hasRole()

```ts
class ACL {
  hasRole(roleName: string): Boolean;
}
```

### acl.removeRole()

```ts
class ACL {
  removeRole(roleName: string): void;
}
```

### acl.removeAllow()

```ts
class ACL {
  removeAllow(roleName, resourceName, actionName): void;
}
```

### acl.removeResource()

```ts
class ACL {
  removeResource(resourceName): void;
}
```

### acl.can()

```ts
class ACL {
  can(roleName, resourceName, actionName): PermissionResult | null;
}

interface PermissionResult {

}
```

Examples

角色 role1，posts 资源，是否可以 create，如果可以，返回 create 预设定的权限级别的 action params

```ts
const permission = acl.can('role1', 'posts', 'create');
permission?.whilelist // role1 角色，posts 资源的字段白名单
```

## Context API

### ctx.acl

当前 acl 实例

### ctx.can()

```ts
interface can {
  (resourceName, actionName): PermissionResult | null;
}

interface PermissionResult {

}
```

Examples

```ts
async function (ctx, next) {
  const permission = ctx.can('posts', 'create');
  if (permission) {
    ctx.action.mergeParams({
      whilelist: permission.whilelist,
    });
  }
}
```
