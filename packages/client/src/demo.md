# Demo

<code src="./demos/demo1.tsx" />

```js
const SchemaComponent = createSchemaComponent({});
const CollectionField = createCollectionField({});
const RouteSwitch = createRouteSwitch({});

<ConfigProvider components={{ SchemaComponent, CollectionField, RouteSwitch }}>

</ConfigProvider>

const { render } = useSchemaComponent();
```
