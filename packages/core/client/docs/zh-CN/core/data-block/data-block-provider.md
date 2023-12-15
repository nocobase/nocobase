# DataBlockProvider

## 区块类型

区块分为简单区块和包含各种数据的区块。

### 简单区块

简单区块例如 Markdown 区块。

![](./images/markdown-block.png)

它只有文本内容，没有其他更多复杂数据，且文本内容是存储在 `schema` 中的，没有存储在数据库中。

```json {5}| pure
{
  "type": "void",
  "x-component": "Markdown.Void",
  "x-component-props": {
    "content": "markdown content"
  },
}
```

### 数据区块

数据区块是指区块的数据存储在服务端的数据表中，例如 Table 组件。

![](./images/data-block.png)

Table 中的字段信息以及字段对应的数据列表，都是存储在数据库中的。


## DataBlockProvider 介绍

为了方便对数据区块的数据进行管理，我们提供了 `DataBlockProvider` 组件，其内部封装了：

- [BlockSettingsProvider](xx): 区块属性信息
- [CollectionProvider](xx): 区块 collection 表数据信息
- [AssociationProvider](xx): 区块关联字段信息
- [BlockResourceProvider](xx): 区块 [Resource](xx) API，用于区块数据的增删改查
- [BlockRequestProvider](xx): 根据区块属性，自动调用 `resource.get()` 或 `resource.list()` 发起请求，得到数据
  - [RecordProvider](xx): 对于 `get` 场景会通过 `RecordProvider` 提供数据记录，`list` 场景则需要自行根据组件 使用 `RecordProvider` 提供数据记录

上述组件封装到 `DataBlockProvider` 的内部，只需要使用 `DataBlockProvider` 即可自行得到上述数据。

### 使用方式

其主要使用在区块的[装饰器]()中，例如：

<!-- 截图 -->

```js {5}| pure
{
  type: 'void',
  name: 'hello-block',
  'x-component':  'CardItem',
  'x-decorator': 'DataBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    action: 'list',
  },
  'x-use-decorator-props': 'useDynamicDataBlockProps',
}
```

> TODO：一个完整示例，从 initializer 添加到最后组件的显示和数据的获取。

## 属性

### 静态属性和动态属性

我们把 schema 中的 `x-decorator-props` 称为静态属性，它是一个普通对象，记录区块的配置，把 `x-use-decorator-props` 中的属性称为动态属性，它是一个 React hook，可用于获取 URL 上的 ID，或者父级的 context 数据。

当两者都存在时，会进行深度合并，作为 `DataBlockProvider` 的属性。

### 属性列表

```ts | pure
interface AllDataBlockProps {
  collection?: string;
  association?: string;
  sourceId?: string | number;
  record?: RecordV2;
  action?: 'list' | 'get';
  params?: Record<string, any>;
  parentRecord?: RecordV2;
  [index: string]: any;
}
```

- collection：区块的 collection 表名，用于获取区块的字段信息和区块数据，一般存在于静态属性 `x-decorator-props` 中
- association：区块的关联字段名，用于获取区块的关联字段信息和关联字段数据，一般存在于静态属性 `x-decorator-props` 中
- sourceId：区块的 sourceId，配合 `association` 使用，用于获取区块的关联字段数据，一般存在于动态属性 `x-use-decorator-props` 中
- action：区块的请求类型，`list` 或 `get`，一般存在于 `x-decorator-props` 中
- params：区块的请求参数，同时存在于 `x-decorator-props` 和 `x-use-decorator-props` 中
- record：当提供 `record` 时，会使用 `record` 作为区块的数据，不发起请求，一般存在于动态属性 `x-use-decorator-props` 中
- parentRecord：当提供 `parentRecord` 时，会使用 `parentRecord` 作为关联字段的表数据，不发起请求，一般存在于动态属性 `x-use-decorator-props` 中

这些属性根据不同的场景，共有 8 中情况：

- collection
  - 创建：`collection`
  - 获取单条数据：`collection` + `action: get` + `params`
  - 获取列表数据：`collection` + `action: list` + `params`
  - 使用 `record` 作为数据：`collection` + `record`

对于 *获取单条数据* 和 *获取列表数据*  `params` 非必须。

- association
  - 创建：`association` + `sourceId`
  - 获取单条数据：`association` + `sourceId` + `action: get` + `params` + `parentRecord`
  - 获取列表数据：`association` + `sourceId` + `action: list` + `params` + `parentRecord`
  - 使用 `record` 作为数据：`association` + `sourceId` + `record` + `parentRecord`


对于 *获取单条数据* 和 *获取列表数据*  `params` 和 `parentRecord` 非必须，当没有 `parentRecord` 会根据 `association` 查询到对应的 `collection`，然后再根据 `collection` 查询到对应的 `parentRecord`。

## 示例

### Table list

### Form get

### Form create

### Form record

