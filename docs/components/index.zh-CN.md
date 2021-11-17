---
title: 概述
order: 0
nav:
  title: 组件
  order: 4
---

# 组件

NocoBase 的客户端组件总共有三类：

- 通过 createRouteSwitch 创建的路由组件，如 Layou、Page
- 通过 createCollectionField 创建的字段组件，用于扩展字段
- 通过 createSchemaComponent 创建的 JSON Schema 组件，可以是任意东西，比如表格、表单、日历、看板等。  
  Schema Component 可用于 Route Component 或 Collection Field 中。

## 路由组件

```js

function Hello() {
  return <div>Hello World</div>
}

const RouteSwitch = createRouteSwitch({
  components: {
    Hello,
  },
});

const routes = [
  { path: '/hello', component: 'Hello' },
];

<Router>
  <RouteSwitch routes={routes}/>
</Router>
```

## Schema 组件

```js
const Hello = () => {
  return <div>Hello</div>;
}

const SchemaComponent = createSchemaComponent({
  components: {
    Hello,
  },
});

<SchemaComponent
  schema={{
    type: 'void',
    'x-component': 'Hello',
  }}
/>
```

SchemaComponent 是通过 Schema 协议渲染的组件，SchemaComponent 可能由多个原子组件组合而成。

```ts
interface ISchema {
  type: string;
  name?: string;
  title?: any;
  properties?: any;
  ['x-component']?: any;
  ['x-component-props']?: any;
  ['x-decorator']?: any;
  ['x-decorator-props']?: any;
  ['x-designable-bar']?: any;
  ['x-designable-bar-props']?: any;
}
```

Schema 组件的完整结构如下：

<pre lang="tsx">
<Decorator>
  <DesignableBar />
  <Component>
    {...properties}
  </Component>
</Decorator>
</pre>

DesignableBar 可以用于修改当前 SchemaComponent 的 Schema。可以以任意形态出现，例如：

<pre lang="tsx">
function DesignableBar() {
  // 这里是随意写的，当前 schema，可以 update，remove 等等
  const { schema, update, remove } = useDesignableSchema();
  return (
    <Space>
      <Dropdown overlay={
        <Menu>
          <Menu.Item>配置项1</Menu.Item>
          <Menu.Item>配置项2</Menu.Item>
          <Menu.Item>配置项3</Menu.Item>
        </Menu>
      }>
        <a>配置<a/>
      </DropDown>
      <Dropdown>
        <a>配置<a/>
      </DropDown>
      <Dropdown>
        <a>配置<a/>
      </DropDown>
    </Space>
  )
}
</pre>

如果 DesignableBar 只是修改当前层级的参数比较好处理，但是如果修改的是 properties 子节点里的参数，情况会变得比较复杂。

## 字段组件

```ts
const string: FieldOptions = {
  name: 'string',
  type: 'object',
  group: 'basic',
  order: 1,
  title: '单行文本',
  sortable: true,
  default: {
    interface: 'string',
    dataType: 'string',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-designable-bar': 'Input.DesignableBar',
    },
  },
  properties: {
  },
  operations: [
    { label: '包含', value: '$includes', selected: true },
    { label: '不包含', value: '$notIncludes' },
    { label: '等于', value: 'eq' },
    { label: '不等于', value: 'ne' },
    { label: '非空', value: '$notNull', noValue: true },
    { label: '为空', value: '$null', noValue: true },
  ],
  designableBar: {
    key1: {},
    key2: {},
  },
};

const CollectionField = createCollectionField({
  interfaces: {
    string,
  },
})
```
