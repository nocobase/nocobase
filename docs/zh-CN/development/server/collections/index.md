# 核心概念

## Collection

Collection 是所有种类数据的集合，中文翻译为「数据表」，如订单、商品、用户、评论等都是 Collection。不同 Collection 通过 name 区分，如：

```ts
// 订单
{
  name: 'orders',
}
// 商品
{
  name: 'products',
}
// 用户
{
  name: 'users',
}
// 评论
{
  name: 'comments',
}
```

## Collection Field

每个 Collection 都有若干 Fields。

```ts
// Collection 配置
{
  name: 'users',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'integer', name: 'age' },
    // 其他字段
  ],
}
// 示例数据
[
  {
    name: '张三',
    age: 20,
  },
  {
    name: '李四',
    age: 18,
  }
];
```

在 NocoBase 中 Collection Field 的构成包括：

<img src="./collection-field.svg" />

### Field Type

不同字段通过 name 区分，type 表示字段的数据类型，分为 Attribute Type 和 Association Type，如：

**属性 - Attribute Type**

- string
- text
- date
- boolean
- time
- float
- json
- location
- password
- virtual
- ...

**关系 - Association Type**

- hasOne
- hasMany
- belongsTo
- belongsToMany
- ...

### Field Component

字段有了数据类型，字段值的 IO 没问题了，但是还不够，如果需要将字段展示在界面上，还需要另一个维度的配置 —— `uiSchema`，如：

```tsx | pure
// 邮箱字段，用 Input 组件展示，使用 email 校验规则
{
  type: 'string',
  name: 'email',
  uiSchema: {
    'x-component': 'Input',
    'x-component-props': { size: 'large' },
    'x-validator': 'email',
    'x-pattern': 'editable', // 可编辑状态，还有 readonly 不可编辑状态、read-pretty 阅读态
  },
}

// 数据示例
{
  email: 'admin@nocobase.com',
}

// 组件示例
<Input name={'email'} size={'large'} value={'admin@nocobase.com'} />
```

uiSchema 用于配置字段展示在界面上的组件，每个字段组件都会对应一个 value，包括几个维护的配置：

- 字段的组件
- 组件的参数
- 字段的校验规则
- 字段的模式（editable、readonly、read-pretty）
- 字段的默认值
- 其他

[更多信息查看 UI Schema 章节](/development/client/ui-schema-designer/what-is-ui-schema)。

NocoBase 内置的字段组件有：

- Input
- InputNumber
- Select
- Radio
- Checkbox
- ...

### Field Interface

有了 Field Type 和 Field Component 就可以自由组合出若干字段，我们将这种组合之后的模板称之为 Field Interface，如：

```ts
// 邮箱字段 string + input，email 校验规则
{
  type: 'string',
  name: 'email',
  uiSchema: {
    'x-component': 'Input',
    'x-component-props': {},
    'x-validator': 'email',
  },
}

// 手机字段 string + input，phone 校验规则
{
  type: 'string',
  name: 'phone',
  uiSchema: {
    'x-component': 'Input',
    'x-component-props': {},
    'x-validator': 'phone',
  },
}
```

上面 email 和 phone 每次都需要配置完整的 uiSchema 非常繁琐，为了简化配置，又引申出另一个概念 Field interface，可以将一些参数模板化，如：

```ts
// email 字段的模板
interface email {
  type: 'string';
  uiSchema: {
    'x-component': 'Input',
    'x-component-props': {},
    'x-validator': 'email',
  };
}

// phone 字段的模板
interface phone {
  type: 'string';
  uiSchema: {
    'x-component': 'Input',
    'x-component-props': {},
    'x-validator': 'phone',
  };
}

// 简化之后的字段配置
// email
{
  interface: 'email',
  name: 'email',
}

// phone
{
  interface: 'phone',
  name: 'phone',
}
```

[更多 Field Interface 点此查看](https://github.com/nocobase/nocobase/tree/main/packages/core/client/src/collection-manager/interfaces)
