---
nav:
  path: /client
group:
  path: /client
---

# AsyncDataProvider

利用 Formily 提供的 [Effect Hooks](https://core.formilyjs.org/zh-CN/api/entry/form-effect-hooks) 或 [x-reactions](https://react.formilyjs.org/zh-CN/api/shared/schema#schemareactions) 协议能一定程度的解决某些场景的异步数据源问题，但是如果只用来处理异步请求，并不会很好用，而且局限于 Formily 体系内。为了更灵活的处理异步请求的各种需求，NocoBase 提供了非常好用的可配置化的 [useRequest()](api-client#userequest)，用于配置各种异步请求。与此同时，又提供了 `<AsyncDataProvider/>` 组件，可以将请求结果共享给子组件，方便处理其他更复杂的需求。以平时最常见，但却可能非常复杂的表格为例。表格的使用场景有：

- TableView 只作为表格视图
- RowSelection 动态数据的勾选项
- TableField 表格字段

各自的 schema 可以这么表示：

```js
// 表格视图，type 为 void，无 default 默认值，无 field.value，
// dataSource 直接写在组件的 props 里
{
  type: 'void',
  'x-component': 'TableView',
  'x-component-props': {
    columns: [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
    ],
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
    ],
  },
}

// 单选（表格视图），类似于 Radio.Group 字段，可选项由表格视图提供
{
  type: 'number',
  'x-component': 'RowSelection',
  'x-component-props': {
    rowSelection: {
      type: 'radio',
    },
    columns: [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
    ],
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
    ],
  },
  default: 1,
}

// 多选（表格视图），类似于 Checkbox.Group 字段，可选项由表格视图提供
{
  type: 'array',
  'x-component': 'RowSelection',
  'x-component-props': {
    rowSelection: {
      type: 'checkbox',
    },
    columns: [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
    ],
    dataSource: [
      { id: 1, name: 'Name1' },
      { id: 2, name: 'Name2' },
    ],
  },
  default: [1],
}

// 表格字段，数据由表单提供，schema 层面可以配置默认值
// 与表格视图的方式不同，dataSource 和 columns 不适合直接配置在 x-component-props 里，怎么处理先忽略。
{
  type: 'array',
  'x-component': 'TableField',
  'x-component-props': {},
  default: [
    { id: 1, name: 'Name1' },
    { id: 2, name: 'Name2' },
  ],
}
```

大多数实际应用中，表格视图的 dataSource 是异步获取的，可能也需要过滤和分页，这样一来直接在 x-component-props 里写 dataSource 并不合适。为了解决这个问题，可以给组件扩展一个 request 属性，用于请求远程数据，例子如下：

<code src="./demos/demo2.tsx"/>

上述例子的 `<TableView/>` 组件就是一个 React Component，可以正常使用，而不局限于 SchemaComponent 场景。更进一步，为了处理过滤表单、分页等问题，建议将 request 通过 `<AsyncDataProvider/>` 共享给 `<TableView/>` 组件。

```tsx | pure
const result = useRequest(props.request);
<AsyncDataProvider value={result}>
  <TableView/>
</AsyncDataProvider>
```

或者直接将 request 交给 AsyncDataProvider

```tsx | pure
<AsyncDataProvider request={props.request}>
  <TableView/>
</AsyncDataProvider>
```

在 `<AsyncDataProvider/>` 的子组件里就可以通过 `useAsyncData()` 来获取 result，可用于处理过滤、分页等。

```ts
const { data, loading, params, run, refresh, parent } = useAsyncData();
```

转化为 Schema 时，可以将 AsyncDataProvider 放在 `x-decorator` 里，也可以将重新组合的 AsyncDataProvider + TableView，放在 `x-component` 里。

<code src="./demos/demo3.tsx"/>

将 AsyncDataProvider 独立出来，放到 x-decorator 里的另一个好处，例子如下：

```tsx | pure
<CollectionProvider>
  {/* 从 CollectionProvider 里获取资源请求参数，并将请求结果同时共享给 DesignableBar 和 TableView */}
  <AsyncDataProvider> 
    <DesignableBar/>
    <TableView>
      <RecordProvider>
        <CollectionFieldProvider>
          {/* 从 CollectionFieldProvider 里获取关系资源请求参数，并将请求结果同时共享给子组件 */}
          <AsyncDataProvider>
            {/* 组件 */}
          </AsyncDataProvider>
        </CollectionFieldProvider>
      </RecordProvider>
    </TableView>
  </AsyncDataProvider>
</CollectionProvider>
```

上面例子嵌套了两层 AsyncDataProvider，在子 AsyncDataProvider 里，也可以获取到更上一级的请求结果，如：

```ts
const { parent } = useAsyncData();
parent.refresh();
```
