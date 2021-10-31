---
nav:
  path: /components
group:
  path: /components/schema-components
---

# Table - 表格

## Node Tree

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

## Designable Bar

- Table.DesignableBar
- Table.Column.DesignableBar

## Examples

<code src="./demos/demo3.tsx"/>

## API

表格的几个重要参数

- collection 当前表格的数据表配置信息（主要是字段）
- resource 当前资源，用于处理 create、update、list、destroy
- service 当前表格的 resource.list 实例
- field 当前表格的 ArrayField 对象
- schema 当前表格的 json schema
- props 当前表格的参数
