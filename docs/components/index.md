---
title: Overview
order: 0
nav:
  title: Components
  order: 4
---

# Components

There are a total of three types of client components for NocoBase.

- Routing components created by createRouteSwitch, such as Layou, Page
- Field components created by createCollectionField, which are used to extend fields
- JSON Schema components created by createSchemaComponent, which can be anything, such as tables, forms, calendars, kanban, etc. Schema Component can be used in Route Component or Collection Field.

## Route Components

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

## Schema Components

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

## Collection Fields

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
