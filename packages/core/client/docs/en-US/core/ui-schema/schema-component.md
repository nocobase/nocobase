# SchemaComponent

## Context

### SchemaComponentContext

```tsx | pure
interface SchemaComponentContext {
  scope?: any;
  components?: SchemaReactComponents;
  refresh?: () => void;
  reset?: () => void;
  designable?: boolean;
  setDesignable?: (value: boolean) => void;
}
```

Context for rendering Schema.

- `scope`: Mapping of variables in the Schema
- `components`: Mapping of components in the Schema
- `refresh`: Utility function to trigger React re-rendering
- `reset`: Reset the entire Schema node
- `designable`: Whether to display the designer, default is `false`
- `setDesignable`: Used to toggle the value of `designable`

## Hooks

### useSchemaOptionsContext()

Used to get registered `scope` and `components`.
- props

```tsx | pure
interface SchemaComponentProviderProps {
  designable?: boolean;
  form?: Form;
  scope?: any;
  components?: SchemaReactComponents;
}
```

- Details
  - `designable`: The default value of `designable` in `SchemaComponentContext`
  - `form`: NocoBase's Schema capability is based on the `FormProvider` provided by formily, and `form` is its parameter, defaulting to `createForm()`
  - `scope`: Variables used in the Schema, passed through `SchemaComponentContext`
  - `components`: Components used in the Schema, passed through `SchemaComponentContext`

### SchemaComponent

Used to render the Schema. This component must be used together with `SchemaComponentProvider`, as `SchemaComponentProvider` provides [FormProvider](https://react.formilyjs.org/api/components/form-provider) as the root node for rendering the Schema.

- Props

```tsx
/**
 * defaultShowCode: true
 */
import { SchemaComponentProvider, useSchemaComponentContext, SchemaComponent, } from '@nocobase/client';
const Hello = () => {
    const { designable, setDesignable } = useSchemaComponentContext();
    return <div>
        <div style={{ padding: 20, border: designable ? '1px solid red' : undefined }} contentEditable={designable}>hello world</div>
        <button onClick={() => setDesignable(!designable) }>change designable</button>
    </div>;
}

const schema = {
  type: 'void',
  name: 'hello',
  'x-component': 'Hello',
}

const Demo = () => {
  return <SchemaComponent schema={schema} />
}

const Root = () => {
  return <SchemaComponentProvider components={{ Hello }}>
    <Demo />
  </SchemaComponentProvider>
}

export default Root;
```

By using the `new Application()` method, which includes the `SchemaComponentProvider` internally, we can perform the following operations:

```tsx
/**
 * defaultShowCode: true
 */
import { Application, Plugin, useSchemaComponentContext, SchemaComponent } from '@nocobase/client';
const Hello = () => {
    const { designable, setDesignable } = useSchemaComponentContext();
    return <div>
        <div style={{ padding: 20, border: designable ? '1px solid red' : undefined }} contentEditable={designable}>hello world</div>
        <button onClick={() => setDesignable(!designable) }>change designable</button>
    </div>;
}

const schema = {
    type: 'void',
    name: 'hello',
    'x-component': 'Hello',
}

const HomePage = () => {
    return <SchemaComponent components={{ Hello }} schema={schema} />
}

class MyPlugin extends Plugin {
    async load() {
        this.app.addComponents({ Hello });
        this.app.router.add('home', {
            path: '/',
            Component: HomePage,
        })
    }
}

const app = new Application({
    router: {
        type: 'memory',
        initialEntries: ['/'],
    },
    plugins: [MyPlugin],
})

export default app.getRootComponent();
```

### SchemaComponentOptions

In the application, there may be multiple levels of nesting, and each level may provide its own components and scope. This component is used to pass the `components` and `scope` required for each level of the Schema.
- props

```tsx | pure
interface SchemaComponentOptionsProps {
  scope?: any;
  components?: SchemaReactComponents;
}
```

- Example

```tsx
/**
 * defaultShowCode: true
 */
import { SchemaComponentProvider, useSchemaComponentContext, SchemaComponent, SchemaComponentOptions } from '@nocobase/client';
const World = () => {
   return <div>world</div>
}

const Hello = ({ children }) => {
    return <div>
        <div>hello</div>
        <SchemaComponentOptions components={{ World }}>{ children }</SchemaComponentOptions>
    </div>;
}

const schema = {
    type: 'void',
    name: 'hello',
    'x-component': 'Hello',
    properties: {
        world: {
          type: 'void',
          'x-component': 'World',
        },
    },
}

const Root = () => {
    return <SchemaComponentProvider components={{ Hello }}>
       <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
}

export default Root;
```
