---
order: 2
---

# 客户端组件

为了让更多非开发人员也能参与进来，NocoBase 提供了配套的客户端 —— 无代码的可视化界面。客户端界面非常灵活，由不同组件构成，分为了三类：

- 通过 createRouteSwitch 创建的路由组件，如 Layout、Page
- 通过 createCollectionField 创建的字段组件，用于扩展字段
- 通过 createSchemaComponent 创建的 JSON Schema 组件，可以是任意东西，比如表格、表单、日历、看板等

[更多组件内容，查看组件章节](#)

## 组件树结构

界面是由组件构成的组件树，结构如下：

<pre lang="tsx">
// 布局
<Layout>
  // 页面
  <Page>
    // 栅格
    <Grid>
      // 区块，以表格为例
      <Table>
        // 配置工具栏
        <Table.DesignableBar/>
        // 操作栏
        <Table.ActionBar>
          // 操作
          <Action/>
          <Action/>
        </Table.ActionBar>
        // 内容区
        <Table.Content>
          <Table.Column>
            // 表格列的字段
            <CollectionField />
          </Table.Column>
          <Table.Column>
            <CollectionField />
          </Table.Column>
        </Table.Content>
      </Table>
    </Grid>
    <AddNew />
  </Page>
</Layout>
</pre>

注：以上例子只为表达组件树的结构和组件之间的关系，实际代码并不如此。

接下来，我们来详细的介绍各部分的概念。

## 布局和页面

页面是可以通过地址访问的网页，不同页面之间可能具有相同的页眉、页脚和导航，通常我们会把这些公共的内容放在布局组件里。例如，初始化的 NocoBase 提供了两个布局组件，如图所示：

图

- AuthLayout：无需登录就能访问，一般用于嵌入登录、注册、忘记密码等页面。
- AdminLayout：需要登录，管理后台的所有页面。

布局和页面组件通过 createRouteSwitch 注册，更多扩展内容点此查看。

## 页面内容排版

对开发者来说，页面内容的编写是自由的，不过为了方便对页面内容进行排版，提供了两种排版方式：

### 简易的上下结构

<pre lang="tsx">
<Page>
  <BlockItem />
  <BlockItem />
  <BlockItem />
</Page>
</pre>

例子如下：

```js
// 示例 
```

### 可拖拽的栅格

<pre lang="tsx">
<Page>
  <Grid>
    <Grid.Row>
      <Grid.Col>
        <BlockItem />
      </Grid.Col>
      <Grid.Col>
        <BlockItem />
      </Grid.Col>
    </Grid.Row>
    <Grid.Row>
      <Grid.Col>
        <BlockItem />
      </Grid.Col>
      <Grid.Col>
        <BlockItem />
      </Grid.Col>
    </Grid.Row>
  </Grid>
</Page>
</pre>

栅格组件 Grid 基于行（Grid.Row）和列（Grid.Col）来定义区块的外部框架。例子如下：

```js
// 示例 
```

## AddNew

AddNew 是页面可视化配置最重要的操作按钮，更多关于 AddNew 的内容点此查看

## 区块 - Block

区块一般放在页面里，可以是任意东西，包括文字、附件、表格、表单、日历、看板等等。一个完整的区块由三部分组成：

- 内容区 Content，区块的主体
- 操作栏 ActionBar，可以放置各种操作按钮，用于操作区块数据（可选）
- 配置工具栏 DesignableBar，操作区块配置的按钮（可选）

以表格区块为例，组件结构如下：

<pre lang="tsx">
<Table>
  <Table.DesignableBar />
  <Table.ActionBar />
  <Table.Content />
</Table>
</pre>

具体形态：

```js
//示例（这里放上一个表示区块结构的示例）
```

区块有几种类型：

- 数据类型，用于展示数据表的数据，如表格、日历、看板、表单、详情等。
- 多媒体，用于丰富页面内容，如文本段、附件等。暂时只有一个简易的 Markdown。
- 图表，用于展示数据统计。
- 模板，可直接将某些成品模板化，直接应用到页面上。

区块可以任意扩展，如何扩展查看 createSchemaComponent 章节。

## 操作栏 - ActionBar

操作栏是一系列操作的集合，一般用于区块内部。用户发出操作指令，程序做出改变，并将结果响应在区块内容区。

例如：

表格，内容区是一个表格，操作区会放置一些操作按钮，如筛选、新增、删除、导出等

```js
// 示例（放一个简易的表格，把操作栏重点突出一下）
```

详情，内容区是详情数据，操作区会放置编辑、导出等按钮

```js
// 示例（放一个简易的详情，把操作栏重点突出一下）
```

不同的区块，操作栏的按钮可能不同。操作栏的按钮也是可以自定义的，具体内容查看操作章节。

## 操作 - Action

操作是封装的一段指令，一般需要用户参与。

例如：

- 删除数据，需要用户选中待删除数据，再触发删除指令
- 筛选数据，需要用户填写筛选项，再触发筛选指令
- 新增数据，需要用户填写数据之后提交，触发新增操作指令
- 查看详情，用户点击操作按钮，弹窗查看详情或当前窗口打开详情页查看

最简单的操作，只需要绑定一段指令即可，简单来说就是指定一段函数，无需传参。组件结构如下：

<pre lang="tsx">
<Action useAction={useAction} />
</pre>

大部分的操作指令需要用户提供参数，如新增数据操作，需要用户填写数据，填写数据一般需要弹出表单，用户填写完数据，点击提交，才触发操作指令。组件结构如下：

<pre lang="tsx">
<Action useAction={useAction}>
  {/* 这是个弹窗表单，内置提交按钮，点击提交触发操作指令，具体代码省略 */}
  <Action.Modal x-decorator={'Form'}></Action.Modal>
</Action>
</pre>

一个完整的操作大概分为两步：

- 为 Action 绑定一段指令
- 如果指令需要用户提供参数，需要提供交互界面，目前内置的有：
   - Action.Drawer：抽屉
   - Action.Modal：对话框
   - Action.Popover：气泡

操作是 NocoBase 里非常重要的一个概念，更多详情点此查看

## 配置工具栏 - DesignableBar

所有的 Schema Component 都可以绑定自己的配置工具栏（DesignableBar），用于修改当前组件的 Schema。
​

**什么是 Schema Component？**  
通过 Schema 协议编写的类 JSON Schema 格式的组件，如：

```js
{
  type: 'void',
  'x-Component': 'Hello',
  'x-designable-bar': 'Hello.DesignableBar',
  'x-dect': 'CardItem',
}
```

举几个例子，如：

表单字段的 JSON Schema

```js
const schema = {
  type: 'string',
  'x-component': 'Input',
  'x-decorator': 'FormItem',
  'x-designable-bar': 'Form.Field.DesignableBar',
};
```

表单项的配置工具栏 `Form.Field.DesignableBar` 的效果

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/1ffba32f9a5625760c3fe11e7eb19974.png" style="max-width: 350px;"/>

表格的 JSON Schema

```js
const schema = {
  type: 'array',
  'x-component': 'Table',
  'x-decorator': 'CardItem',
  'x-designable-bar': 'Table.DesignableBar',
};
```

表格配置工具栏 `Table.DesignableBar` 的效果

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/dcd762a0444ef55a8515c53d706f7bc4.png" style="max-width: 250px;"/>

菜单项的 JSON Schema：

```js
const schema = {
  type: 'array',
  'x-component': 'Menu.Item',
  'x-designable-bar': 'Menu.Item.DesignableBar',
};
```

菜单项配置工具栏 `Menu.Item.DesignableBar` 的效果

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/984ab6da6a8f72fe790bb9bd18b3eb35.png" style="max-width: 200px;"/>

更多配置工具栏详情点此查看

## 字段组件 - CollectionField

字段组件的配置参数可能非常多，在不同数据区块里也可能用到同一个字段组件，为了减少代码重复，NocoBase 里，将字段组件的配置交由数据表统一管理。一处配置，多处使用。数据区块里直接引用字段组件，如果有其他不同参数再另行扩展。

<pre lang="tsx">
<Table>
  // 原生态的写法
  <Table.Column title={'姓名'}>
    <Input {...others} name="name" readPretty={true}/>
  </Table.Column>
  // 简化之后的字段引用
  <Table.Column>
    <CollectionField name="name"/>
  </Table.Column>
</Table>

<Form>
  // 如果在表格里也用到，再写一遍
  <FormItem title={'姓名'}>
    <Input {...others} name="name"/>
  </FormItem>
  // 字段引用，只需要提供 name 即可 
  <FormItem>
    <CollectionField name="name"/>
  </FormItem>
</Form>
</pre>

字段组件有三种显示状态：

- 可填写 - editable
- 不可填写 - disabled
- 阅读模式 - read-pretty

以单行文本（Input）为例：

```js
// 示例（Input 的三种显示状态）

// 示例待补充
```

**为什么字段有多种显示状态？**

- 在表单中，一般情况字段为可填写状态（editable），但如果只供查看，这时候就会把字段设置为 disabled 或 read-pretty。
- 在表格中，一般情况字段为阅读模式（read-pretty），但如果需要在表格内快捷编辑，又可以动态的将某个字段激活为 editable。

字段组件可以任意扩展，如何扩展查看 createCollectionField 章节。
