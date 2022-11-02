# Collection 模板

<Alert>
📢 Collection 模板计划在 2022 年第四季度提供。
</Alert>

在实际的业务场景中，不同的 collection 可能有自己的初始化规则和业务逻辑，NocoBase 通过提供 Collection 模板来解决这类问题。

## 常规表

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    }
  ],
});
```

## 树结构表

```ts
db.collection({
  name: 'categories',
  tree: 'adjacency-list',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'belongsTo',
      name: 'parent',
      target: 'categories',
      foreignKey: 'parentId',
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'categories',
      foreignKey: 'parentId',
    },
  ],
});
```

## 父子继承表

```ts
db.collection({
  name: 'a',
  fields: [
    
  ],
});

db.collection({
  name: 'b',
  inherits: 'a',
  fields: [
    
  ],
});
```

## 更多模板

如日历表，每个初始化的表都需要初始化特殊的 cron 和 exclude 字段，而这种字段的定义就由模板来完成

```ts
db.collection({
  name: 'events',
  template: 'calendar',
});
```
