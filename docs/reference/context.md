---
toc: menu
---

# Context

## ctx.db

##### Definition

```ts
interface Context {
  db: Database;
}
```

##### Examples

```ts
async (ctx, next) {
  const User = ctx.db.getCollection('users');
}
```

## ctx.resourcer

## ctx.action <Badge>待完善</Badge>

## ctx.i18n

app.i18n 的 cloneInstance。详情见 [I18next API](https://www.i18next.com/overview/api)

##### Definition

```ts
interface Context {
  i18n: I18next.I18n;
}
```

##### Examples

```ts
async (ctx, next) {
  await ctx.i18n.changeLanguage('zh-CN');
}
```

## ctx.t()

