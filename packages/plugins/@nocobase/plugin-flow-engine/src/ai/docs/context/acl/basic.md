---
title: "Can List Users"
description: "Use ctx.acl.can to can list users."
---

# Basic

## Can List Users

Use this snippet to can list users.

```ts
return ctx.acl.can({
  resource: 'users',
  action: 'list',
});
```

## Can Get User

Use this snippet to can get user.

```ts
return ctx.acl.can({
  resource: 'users',
  action: 'get',
  filterByTk: userId,
});
```

## Can Create User

Use this snippet to can create user.

```ts
return ctx.acl.can({
  resource: 'users',
  action: 'create',
});
```

## Can Update User

Use this snippet to can update user.

```ts
return ctx.acl.can({
  resource: 'users',
  action: 'update',
  filterByTk: userId,
});
```

## Can Destroy Users

Use this snippet to can destroy users.

```ts
return ctx.acl.can({
  resource: 'users',
  action: 'destroy',
  ...(userId ? { filterByTk: userId } : {}),
});
```

## Can Read Fields

Use this snippet to can read fields.

```ts
return ctx.acl.can({
  resource: 'users',
  action: 'get',
  fields,
});
```

## Can Write Fields

Use this snippet to can write fields.

```ts
return ctx.acl.can({
  resource: 'users',
  action: 'update',
  fields,
});
```
