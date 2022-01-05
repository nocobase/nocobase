---
nav:
  path: /client
group:
  path: /schema-components
---

# AddNew

- AddNew.Block
- AddNew.RecordBlock
- Form.AddField
- Table.AddColumn

## AddNew.Block

数据区块，需要选择数据源

- Table 直接初始化
- Form 直接初始化
- Calendar 有交互表单，再初始化
- Kanban 有交互表单，再初始化

```ts
[
  {
    name: 'Table',
    title: '表格',
    properties: {},
  },
  {
    name: 'Form',
    title: '表单',
    properties: {},
  },
]
```

## AddNew.RecordBlock

数据区块，无需选择数据源

- Form
- Details

关系数据区块

- 全局设定
- 关联字段

其他

- Markdown

选择数据源 -> 区块

```tsx | pure
<Grid>
  <Grid.Row>
    <Grid.Col>
      <Table/>
    </Grid.Col>
  </Grid.Row>
</Grid>
```

## 当前数据页面添加区块

编辑表单
详情区块
相关数据区块

```tsx | pure
<Grid>
  <Grid.Row>
    <Grid.Col>
      <Table/>
    </Grid.Col>
  </Grid.Row>
</Grid>
```

## 表格添加列

字段

```tsx | pure
<Table>
  <Table.Column>
    <CollectionField/>
  </Table.Column>
</Table>
```

## 表单添加字段

字段

```tsx | pure
<Grid>
  <Grid.Row>
    <Grid.Col>
      <CollectionField/>
    </Grid.Col>
  </Grid.Row>
</Grid>
```
