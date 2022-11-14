# 关系字段配置

在关系数据库里，标准的建表关系的方式是添加一个外键字段，然后再加一个外键约束。例如 Knex 建表的例子：

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

## 关系参数说明

### BelongsTo

```ts
interface BelongsTo {
  type: 'belongsTo';
  name: string;
  // 默认值为 name 复数
  target?: string;
  // 默认值为 target model 的主键，一般为 'id'
  targetKey?: any;
  // 默认值为 target + 'Id'
  foreignKey?: any;
}

// authors 表主键 id 和 books 表外键 authorId 相连
{
  name:  'books',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'authors',
      targetKey: 'id',         // authors 表主键
      foreignKey: 'authorId',  // 外键在 books 表
    }
  ],
}
```

### HasOne

```ts
interface HasOne {
  type: 'hasOne';
  name: string;
  // 默认值为 name 复数
  target?: string;
  // 默认值为 source model 的主键，一般为 'id'
  sourceKey?: string;
  // 默认值为 source collection name 的单数形态 + 'Id'
  foreignKey?: string;
}

// users 表主键 id 和 profiles 外键 userId 相连
{
  name:  'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles',
      sourceKey: 'id',      // users 表主键
      foreignKey: 'userId', // 外键在 profiles 表
    }
  ],
}
```

### HasMany

```ts
interface HasMany {
  type: 'hasMany';
  name: string;
  // 默认值为 name
  target?: string;
  // 默认值为 source model 的主键，一般为 'id'
  sourceKey?: string;
  // 默认值为 source collection name 的单数形态 + 'Id'
  foreignKey?: string;
}

// posts 表主键 id 和 comments 表 postId 相连
{
  name:  'posts',
  fields: [
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      sourceKey: 'id',          // posts 表主键
      foreignKey: 'postId',     // 外键在 comments 表
    }
  ],
}
```

### BelongsToMany

```ts
interface BelongsToMany {
  type: 'belongsToMany';
  name: string;
  // 默认值为 name
  target?: string;
  // 默认值为 source collection name 和 target 的首字母自然顺序拼接的字符串
  through?: string;
  //默认值为 source collection name 的单数形态 + 'Id'
  foreignKey?: string;
  // 默认值为 source model 的主键，一般为 id
  sourceKey?: string;
  //默认值为 target 的单数形态 + 'Id'
  otherKey?: string;
  // 默认值为 target model 的主键，一般为 id
  targetKey?: string;
}

// tags 表主键、posts 表主键和 posts_tags 两个外键相连
{
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'posts_tags', // 中间表
      foreignKey: 'tagId',   // 外键1，在 posts_tags 表里
      otherKey: 'postId',    // 外键2，在 posts_tags 表里
      targetKey: 'id',       // tags 表主键
      sourceKey: 'id',       // posts 表主键
    }
  ],
}
```
