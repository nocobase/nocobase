# 关系字段

在关系数据库里，标准的建表关系的方式是添加一个外键字段，然后设置上个外键约束。例如 Knex 建表的例子：

```ts
knex.schema.table('posts', function (table) {
  table.integer('userId').unsigned();
  table.foreign('userId').references('users.id');
});
```

这个过程会在 posts 表里创建一个 userId 字段，并且设置上外键约束 posts.userId 引用 users.id。而在 NocoBase 的 Collection 中，是通过配置关系字段来建立上这样一种关系约束，如：

```ts
{
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
    },
  ],
}
```
