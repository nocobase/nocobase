# TableV2

`TableV2` 是一个基于 `antd` 的表格组件的封装。

## With Collection

我们需要使用到 `TableBlockProvider` 将数据表的配置和数据向下传递，`useTableBlockProps` 将数据和 props 传递给 `Table`，column 中使用 `CollectionField` 动态读取数据表的配置，根据配置渲染表格列。

其中 `TableBlockProvider` 是对 `DataBlockProvider` 的二次封装，其属性可以参考 [DataBlockProvider](/core/data-block/data-block-provider#属性详解)，`CollectionField` 会自动根据 field.name 查找对应的数据表的配置，并渲染成对应的表格列，更多关于 `CollectionField` 的说明请参考 [CollectionField](/core/data-source/collection-field)。

<code src="./demos/new-demos/collection.tsx"></code>

## Extends Collection

如果 Collection 不是通过数据源管理器创建，而是自定义扩展，可以查看 [ExtendCollectionsProvider](/core/data-source/extend-collections-provider)。

<code src="./demos/new-demos/extend-collection.tsx"></code>

## With ActionToolbar

我们可以结合 [ActionToolbar](/components/action#actionbar) 来实现表格的操作栏，比如新增、刷新、筛选、批量删除等操作。

- 更新按钮：可以直接使用内置的 `useRefreshActionProps()`
- 批量删除按钮：可以使用内置的 `useBulkDestroyActionProps()`
- 过滤按钮：可以直接使用 [Filter.Action](/components/filter) 和 `useFilterActionProps`
- 新增按钮可以参考 [Action.Drawer](/components/action#与-form-结合) 的用法

如果想自定义则可使用 [useDataBlockResource()](/core/data-block/data-block-resource-provider) 和 [useDataBlockRequest()](/core/data-block/data-block-request-provider#usedatablockrequest)，对数据进行操作。

<code src="./demos/new-demos/action-toolbar.tsx"></code>

## View Or Edit Record

Table 会将当前行的数据通过 [CollectionRecordProvider](/core/data-block/collection-record-provider) 传递给下层组件，我们可以通过 [useCollectionRecord()](/core/data-block/collection-record-provider#usecollectionrecord) 获取当前行的数据。

然后我们使用 `useFormBlockProviderProps()` 将数据表的配置和数据传递给 [FormBlockProvider](http://localhost:8000/components/form-v2#%E8%8E%B7%E5%8F%96%E6%95%B0%E6%8D%AE%E8%A1%A8%E6%95%B0%E6%8D%AE) 组件，`FormBlockProvider` 会自动请求表单数据和配置。

然后我们使用 `useFormBlockProps()` 将数据传递给 `Form` 组件。

在编辑场景下，在通过 [useDataBlockResource()](/core/data-block/data-block-resource-provider) 和 [useDataBlockRequest()](/core/data-block/data-block-request-provider#usedatablockrequest) 对数据进行更新，以及对列表进行刷新。

<code src="./demos/new-demos/record.tsx"></code>

## Tree

### Basic

树表需要设置：

```diff
  'x-decorator-props': {
    collection: 'tree-collection',
    action: 'list',
    params: {
+     tree: true,
      pageSize: 2,
    },
+   treeTable: true,
    showIndex: true,
    dragSort: false,
  },
```

<code src="./demos/new-demos/tree.tsx"></code>

### expandFlag

默认展开树表的节点，需要设置 `expandFlag` 属性。

<code src="./demos/new-demos/tree-expandFlag.tsx"></code>
