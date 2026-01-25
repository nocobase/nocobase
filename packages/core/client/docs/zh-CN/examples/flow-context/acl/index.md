# ctx.acl & ctx.can

## 数据表（资源）操作权限的判断

### 查看权限

多条记录

```ts
const options = { resource: 'users', action: 'list' };
await acl.can(options);
```

单条记录

```ts
const options = { resource: 'users', action: 'get', filterByTk };
await acl.can(options);
```

### 添加权限

```ts
const options = { resource: 'users', action: 'create' };
await acl.can(options);
```

### 编辑权限

```ts
const options = { resource: 'users', action: 'update', filterByTk };
await acl.can(options);
```

### 删除权限

批量

```ts
const options = { resource: 'users', action: 'destroy' };
await acl.can(options);
```

单条

```ts
const options = { resource: 'users', action: 'destroy', filterByTk };
await acl.can(options);
```

## 数据表字段的权限判断

### 查看字段

用于判断是否可以查看字段

多条记录

```ts
const options = { resource: 'users', action: 'list', fields: ['field1'] };
await acl.can(options);
```

单条记录

```ts
const options = { resource: 'users', action: 'get', filterByTk, fields: ['field1'] };
await acl.can(options);
```

### 编辑字段

用于判断是否可以编辑字段

```ts
const options = { resource: 'users', action: 'update', fields: ['field1'] };
await acl.can(options);
```
