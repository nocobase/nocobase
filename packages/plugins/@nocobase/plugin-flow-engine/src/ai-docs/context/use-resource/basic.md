# Basic

## Use Multi Record Resource

Use this snippet to use multi record resource.

```ts
const resource = ctx.useResource('MultiRecordResource');
resource.setCollectionName('users');
return resource;
```

## List Users

Use this snippet to list users.

```ts
const resource = ctx.useResource('MultiRecordResource');
resource.setCollectionName('users');
return resource.list({ filter: { status: 'active' } });
```

## Get Record

Use this snippet to get record.

```ts
const resource = ctx.useResource('SingleRecordResource');
resource.setCollectionName('users');
return resource.get({ filterByPk: id });
```
