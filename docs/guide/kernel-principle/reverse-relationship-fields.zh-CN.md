---
order: 999
---

# Reverse relationship fields

## 关系字段类型

目前内置的关系字段有：

- hasOne
- hasMany
- belongsTo
- belongsToMany

配置 Collection 的时候可以这样写：

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'hasOne', name: 'profile' },
    { type: 'hasMany', name: 'posts' },
  ],
});

db.collection({
  name: 'posts',
  fields: [
    { type: 'belongsTo', name: 'user' },
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    { type: 'belongsToMany', name: 'posts' },
  ],
});
```

以上配置关系字段时，只填写了 type 和 name 两个参数，但是实际上，完整的参数如下：

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      target: 'posts', // 缺失时，取 name 当 target
      foreignKey: 'userId', // 缺失时，取 SourceModel 的 name 的单数形态 + Id
      sourceKey: 'id', // 缺失时，取 SourceModel 的 primaryKeyAttribute
    },
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // 缺失时，取 name 的复数形态
      foreignKey: 'userId', // 缺失时，取 SourceModel 的 name 的单数形态 + Id
      sourceKey: 'id', // 缺失时，取 SourceModel 的 primaryKeyAttribute
    },
  ],
});

db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users', // 缺失时，取 name 的复数形态
      foreignKey: 'userId', // 缺失时，取 TargetModel 的 name 的单数形态 + Id
      targetKey: 'id',  // 缺失时，取 TargetModel 的 primaryKeyAttribute
    },
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // 缺失时，取 name
      through: 'posts_tags', // 缺失时，取 SourceModel 的 name 和 TargetModel 的 name 首字母自然顺序拼接的字符串
      foreignKey: 'postId', // 缺失时，取 SourceModel 的 name 的单数形态 + Id
      sourceKey: 'id', // 缺失时，取 SourceModel 的 primaryKeyAttribute
      otherKey: 'tagId', // 缺失时，取 TargetModel 的 name 的单数形态 + Id
      targetKey: 'id', // 缺失时，取 TargetModel 的 primaryKeyAttribute
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      target: 'posts', // 缺失时，取 name
      through: 'posts_tags', // 缺失时，取 SourceModel 的 name 和 TargetModel 的 name 首字母自然顺序拼接的字符串
      foreignKey: 'tagId', // 缺失时，取 SourceModel 的 name 的单数形态 + Id
      sourceKey: 'id', // 缺失时，取 SourceModel 的 primaryKeyAttribute
      otherKey: 'postId', // 缺失时，取 TargetModel 的 name 的单数形态 + Id
      targetKey: 'id',  // 缺失时，取 TargetModel 的 primaryKeyAttribute
    },
  ],
});
```

## 反向关系字段

每个关系字段都存在一个对应的反向关系字段，如上面例子 `posts.tags` 和 `tags.posts` 是一对。例如：

posts 里的关系字段：

```ts
{
  type: 'belongsToMany',
  name: 'tags',
  target: 'tags',
  through: 'posts_tags',
  foreignKey: 'postId',
  sourceKey: 'id',
  otherKey: 'tagId',
  targetKey: 'id',
}
```

反向关系字段为（在 tags 里）：

```ts
{
  type: 'belongsToMany',
  name: 'posts',
  target: 'posts',
  through: 'posts_tags',
  foreignKey: 'tagId',
  sourceKey: 'id',
  otherKey: 'postId',
  targetKey: 'id',
}
```

必须符合以下条件：

- type 都是 belongsToMany
- target 等于 sourcemodel.name
- through 相同
- foreignKey 等于 otherKey
- sourceKey 等于 targetKey
- otherKey 等于 foreignKey
- targetKey 等于 sourceKey

也就是说，除了 name 以外，其他的几个核心参数都要对应上。

### 判断条件

为了方便理解，设定了三个变量。

- field 表是某个关系字段的参数配置
- reverse 表示反向关系字段的参数配置
- field.model.name 表示 field 所在 model 的 name

#### hasOne

- reverse.type === 'belongsTo',
- reverse.target === field.model.name
- reverse.foreignKey === field.foreignKey
- reverse.targetKey === field.sourceKey

#### hasMany

- reverse.type === 'belongsTo',
- reverse.target === field.model.name
- reverse.foreignKey === field.foreignKey
- reverse.targetKey === field.sourceKey

#### belongsTo

- reverse.type === 'hasMany'
- reverse.target === field.model.name
- reverse.foreignKey === field.foreignKey
- reverse.targetKey === field.sourceKey

注：belongsTo 的情况较为特殊，默认按 hasMany 处理，但可能不是，还需要一个参数来判断（反向关系字段是否可以关联多条数据）。

#### belongsToMany

- reverse.type === 'belongsToMany'
- reverse.target === field.model.name
- reverse.through === field.through
- reverse.foreignKey === field.otherKey
- reverse.sourceKey === field.targetKey
- reverse.otherKey === field.foreignKey
- reverse.targetKey === field.sourceKey

### 缺失补齐逻辑

当反向关系字段缺失时，自动补齐。例如：

如果 posts 不存在，不做任何处理

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'hasMany', name: 'posts' },
  ],
});
```

如果 posts 里显式的声明了反向关系字段，不需要自动生成

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'hasMany', name: 'posts' },
  ],
});

db.collection({
  name: 'posts',
  fields: [
    { type: 'belongsTo', name: 'user' },
  ],
});
```

如果 posts 里缺失，自动生成

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'hasMany', name: 'posts' },
  ],
});

db.collection({
  name: 'posts',
  fields: [],
});
```

自动生成是隐式的，如果后续又显式的添加了，要解决合并问题

```ts
db.collection({
  name: 'users',
  fields: [
    { type: 'hasMany', name: 'posts' },
  ],
});

const collection = db.collection({
  name: 'posts',
  fields: [],
});

// 这里不是新增，而是替换
collection.addField({ type: 'belongsTo', name: 'user' });
```

注：显式添加指的是代码配置上可见，隐式添加指的是自动生成，配置存在，但代码上但看不见。
