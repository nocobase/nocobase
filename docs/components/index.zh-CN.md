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
};

const CollectionField = createCollectionField({
  interface: {
    string,
  },
})
```
