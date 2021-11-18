---
toc: menu
---

# Model

## `model.updateAssociations()`

用于更新 model 的关系，目前主要有四种基础关系

- hasOne
- hasMany
- belongsTo
- belongsToMany

##### Definition

```ts
interface updateAssociations {
  (values: UpdateAssociationValues, options?: UpdateAssociationOptions): Promise<void>;
}

interface UpdateAssociationOptions {
  transaction?: Transaction | null;
  updateAssociationValues?: string[];
}

interface UpdateAssociationValues {
  [key: string]: any;
}
```

### HasOne

以用户个人资料 user.profile 为例：

可以传 profile instance

```ts
const User = db.collection({
  name: 'users';
  fields: [
    { type: 'hasOne', name: 'profile' },
  ],
});

const Profile = db.collection({
  name: 'profiles';
  fields: [
    { type: 'string', name: 'gender' },
  ],
});

const user = await User.model.create();
const profile = await Profile.model.create();

await user.updateAssociations({
  profile,
});
```

也可以直接传 profile 的 id 值

```ts
const user = await User.model.create();
const profile = await Profile.model.create();

await user.updateAssociations({
  profile: profile.id,
});
```

也可以传 object，如果 object 不含 pk，直接创建并关联

```ts
const user = await User.model.create();

await user.updateAssociations({
  profile: {
    gender: 'male',
  },
});
```

如果 object 的 key 带 pk，只关联，不修改关联数据（默认）

```ts
const user = await User.model.create();
const profile = await Profile.model.create({
  gender: 'male',
});
await user.updateAssociations({
  profile: {
    id: profile.id,
    gender: 'female', // 这里虽然改了，但是不修改
  },
});
```

传 `null` 时，可以解除关联

```ts
const user = await User.model.create();
await user.updateAssociations({
  profile: {
    gender: 'male',
  },
});
// 删除关联
await user.updateAssociations({
  profile: null,
});
```

如果要修改关联数据，需要指定 `updateAssociationValues` 路径，如：

```ts
const user = await User.model.create();
const profile = await Profile.model.create({
  gender: 'male',
});
await user.updateAssociations({
  profile: {
    id: profile.id,
    gender: 'female', // updateAssociationValues 包含 profile，所以 gender 会被修改
  },
}, {
  // 对 profile 的 values 进行更新
  updateAssociationValues: ['profile'],
});
```

updateAssociationValues 只处理当前层级的，如果有 profile.phone 也需要加进来才会更新，例如：

```ts
const Profile = db.collection({
  name: 'profiles';
  fields: [
    { type: 'string', name: 'gender' },
    { type: 'hasOne', name: 'phone' },
  ],
});

const Phone = db.collection({
  name: 'phones';
  fields: [
    { type: 'string', name: 'number' },
  ],
});

const user = await User.model.create();
const profile = await Profile.model.create({
  gender: 'male',
});
await user.updateAssociations({
  profile: {
    id: profile.id,
    gender: 'female',
    phone: {
      number: '12312341234',
    },
  },
}, {
  updateAssociationValues: ['profile', 'profile.phone'],
});
```

暂时不支持泛解析，如 `profile.*`，这种情况较难控制，暂时不支持。

<Alert title="注意">

- 修改关联数据的使用频率较低，用不好破坏性很大，默认只关联并不更新关联数据。
- 如果 JSON 不包含 pk，需要创建并关联处理。

</Alert>

如果已经存在关联，解除关联，但不删除关联数据，并与新的数据建立关联

```ts
const user = await User.model.create();
const profile1 = await Profile.model.create();
const profile2 = await Profile.model.create();
await user.updateAssociations({
  profile: profile1,
});

// 与 profile1 解除关联，并与 profile2 建立关联，profile1 数据还存在
await user.updateAssociations({
  profile: profile2,
});
```

### BelongsTo

与 HasOne 的处理机制类似，不过多了个 targetKey 的情况，当 targetKey 不为 id 时，会有些区别：

以文章作者 post.user 为例：

```ts
const Post = db.collection({
  name: 'posts';
  fields: [
    { type: 'belongsTo', name: 'user', targetKey: 'uid' },
  ],
});

const User = db.collection({
  name: 'users';
  fields: [
    { type: 'uid', name: 'uid', unique: true }
  ],
});

const post = Post.model.create();
const user = User.model.create({ uid: 'uid123' });

// 可以传 uid 值，而不一定是 id
await post.updateAssociations({
  user: 'uid123',
});
```

### HasMany

可以传 instance

```ts
const comment = await Comment.model.create();
await post.updateAssociations({
  // 自动转换为 [comment]
  comments: comment,
});

// 等同于
await post.updateAssociations({
  comments: [comment],
});
```

也可以传 pk 值

```ts
const comment = await Comment.model.create();
await post.updateAssociations({
  // 自动转换为 [comment.id]
  comments: comment.id,
});

// 等同于
await post.updateAssociations({
  comments: [comment.id]
});
```

可以是 object

```ts
await post.updateAssociations({
  comments: {
    content: 'comment 1'
  },
});
```

或者是 array

```ts
await post.updateAssociations({
  comments: [
    {
      content: 'comment 1'
    },
    {
      content: 'comment 2'
    },
  ],
});
```

或者是混合的元素

```ts
await post.updateAssociations({
  comments: [
    1,
    comment,
    {
      id: 3,
      content: 'comment 3'
    },
  ],
});
```

多层内嵌的情况，订单商品详情 order.details

```ts
db.collection({
  name: 'orders',
  fields: [
    { type: 'hasMany', name: 'details', target: 'order_details' }
  ],
});

db.collection({
  name: 'order_details',
  fields: [
    { type: 'belongsTo', name: 'product' },
    { type: 'integer', name: 'qty' },
    { type: 'integer', name: 'price' },
  ],
});

db.collection({
  name: 'products',
  fields: [
  ],
});

const order = Order.model.create();

await order.updateAssociations({
  details: [
    {
      product: 1,
      qty: 3,
      price: 200,
    },
    {
      product: 2,
      qty: 3,
      price: 200,
    },
  ],
});
```

### BelongsToMany

常规写法与 HasMany 类似，不过有两个特殊参数 targetKey 和 through。targetKey 与 BelongsTo 类似。through 为实体表时，需要可以更新 through 数据。

```ts
const Foo = db.collection({
  name: 'foos',
  fields: [
    { type: 'belongsToMany', name: 'bars' },
  ],
});

const Bar = db.collection({
  name: 'bars',
  fields: [
    { type: 'string', name: 'title' },
  ],
});

db.collection({
  name: 'bars_foos',
  fields: [
    { type: 'string', name: 'status' },
  ],
});

await foo.updateAssociations({
  bars: [
    {
      title: 'title1',
      bars_foos: {
        status: 'publish',
      },
    },
    {
      title: 'title2',
      bars_foos: {
        status: 'draft',
      },
    },
  ],
})
```
