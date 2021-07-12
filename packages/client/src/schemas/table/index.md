---
title: Table - 表格
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Table - 表格

## 组件节点树

<pre lang="tsx">
<Table>
  // 顶部操作栏
  <Table.ActionBar align={'top'}>
    <Action title={'筛选'}>
      <Action.Popover>
        <Form>
          // 此处省略 Filter 节点细节
          <Filter/>
          <Action/>
        </Form>
      </Action.Popover>
    </Action>
    <Action align={'right'} title={'删除'}/>
  </Table.ActionBar>
  // 底部操作栏
  <Table.ActionBar align={'bottom'}>
    <Table.Pagination/>
  </Table.ActionBar>
  // 表格列
  <Table.Column title={'拖拽排序'}>
    <Table.SortHandle/>
  </Table.Column>
  <Table.Column title={'序号'}>
    <Table.Index/>
  </Table.Column>
  <Table.Column title={'字段1'}>
    <Input/>
  </Table.Column>
  <Table.Column title={'字段2'}>
    <Select/>
  </Table.Column>
  <Table.Column title={'操作'}>
    <Action/>
    <Action/>
    <Action/>
  </Table.Column>
</Table>
</pre>

## 代码演示

<code src="./demos/demo1.tsx"/>
