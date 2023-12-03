# 数据区块概述

数据可能是某个表（collection）的数据，也可能是某个关系（association）的数据

- collection，如 a 表
- association，如 a.b 关系，关系表为 b

collection 示例

```js
{
  "collection": "a"
}
```

association 示例 

```js
{
  "collection": "b",
  "association": "a.b"
}
```

数据的操作

```bash
<collection>:<action>
<collection>.<association>:<action>
```

实际的请求参数

```
<GET|POST>   /api/<collection>:<action>
<GET|POST>   /api/<collection>:<action>/<filterByTk>
<GET|POST>   /api/<collection>/<sourceId>/<association>:<action>
<GET|POST>   /api/<collection>/<sourceId>/<association>:<action>/<filterByTk>
```

- collection、association、action 是配置里存好的
- sourceId、filterByTk 由上下文提供

## RecordProvider

Record

```ts
class Record {
  protected current = {};
  protected parent?: Record;
  public isNew = false;
  constructor(options = {}) {
    const { current, parent, isNew } = options;
    this.current = current || {};
    this.parent = parent;
    this.isNew = isNew;
  }
}
```

a:list（**list 外层不套空 RecordPicker**）

```jsx | pure
{list.map((item) => {
  const record = new Record({ current: item });
  return <RecordProvider record={record}></RecordProvider>
})}
```

a:get(view、edit)

```jsx | pure
const record = new Record({ current: item });
<RecordProvider record={item}></RecordProvider>
```

a:create

```jsx | pure
const record = new Record({ current, isNew: true });
<RecordProvider record={record}></RecordProvider>
```

a.b:list

```jsx | pure
<RecordProvider record={recordA}>
  {list.map((item) => {
    const recordB = new Record({
      current: item,
    });
    return <RecordProvider record={recordB}></RecordProvider>
  })}
</RecordProvider>
```

a.b:get

```jsx | pure
const recordA = new Record({
  current: itemA,
});
const recordB = new Record({
  current: itemB,
  parent: recordA,
});
// 或者
recordB.setParent(recordA);

<RecordProvider record={recordA}>
  <RecordProvider record={recordB}></RecordProvider>
</RecordProvider>
```

a.b:create

```jsx | pure
const recordA = new Record({
  current: itemA,
});
const recordB = new Record({
  isNew: true,
  parent: recordA,
});
<RecordProvider record={recordA}>
  <RecordProvider record={recordB}></RecordProvider>
</RecordProvider>
```

## 区块

以下重要组件说明

- `DataBlockProvider` 数据区块的总称
- `BlockProvider` 区块的各种参数设置
- `CollectionProvider` collection 信息
- `AssociationProvider` association 信息
- `UseRequestProvider` useRequest 的 result

没有当前记录的区块，如表格

```tsx | pure
<DataBlockProvider>
  <ActionBar>
    <Action type="filter" />
    <Action type="create" />
    <Action type="delete" />
  </ActionBar>
  <Table useProps />
  <Pagination />
<DataBlockProvider/>
```

DataBlockProvider 内容

```tsx | pure
<BlockProvider>
  <CollectionProvider>
    <UseRequestProvider>
      {props.children}
    </UseRequestProvider>
  </CollectionProvider>
<BlockProvider>
```

有当前记录的区块，如表单

```tsx | pure
<DataBlockProvider>
  <Form useProps />
<DataBlockProvider/>
```

DataBlockProvider 内容

```tsx | pure
<BlockProvider>
  <CollectionProvider>
    <UseRequestProvider>
      <RecordProvider record={recordA}>
        {props.children}
      </RecordProvider>
    </UseRequestProvider>
  </CollectionProvider>
</BlockProvider>
```

有当前父级记录的区块，如对多关系的表格区块，区块本身不套 RecordPicker

```tsx | pure
<RecordProvider record={recordA}>
  <DataBlockProvider>
    <ActionBar>
      <Action type="filter" />
      <Action type="create" />
      <Action type="delete" />
    </ActionBar>
    <Table useProps />
    <Pagination />
  </DataBlockProvider>
  <DataBlockProvider>
    <ActionBar>
      <Action type="filter" />
      <Action type="create" />
      <Action type="delete" />
    </ActionBar>
    <Table useProps />
    <Pagination />
  </DataBlockProvider>
</RecordProvider>
```

DataBlockProvider 内容

```tsx | pure
<BlockProvider>
  <AssociationProvider>
    <CollectionProvider>
      <UseRequestProvider>
        {props.children}
      </UseRequestProvider>
    </CollectionProvider>
  </AssociationProvider>
</BlockProvider>
```

有父级记录也有当前记录的区块，如关系的表单

```tsx | pure
<RecordProvider record={recordA}>
  <DataBlockProvider>
    <Form useProps />
  </DataBlockProvider>
  <DataBlockProvider>
    <Form useProps />
  </DataBlockProvider>
</RecordProvider>
```

DataBlockProvider 内容

```tsx | pure
<BlockProvider>
  <AssociationProvider>
    <CollectionProvider>
      <UseRequestProvider>
        <RecordProvider record={recordA}>
          {props.children}
        </RecordProvider>
      </UseRequestProvider>
    </CollectionProvider>
  </AssociationProvider>
</BlockProvider>
```
