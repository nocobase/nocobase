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

Schema 渲染的上下文。

- `scope`：Schema 中变量的映射
- `components`: Schema 中组件的映射
- `refresh`：触发 React 重新渲染的工具函数
- `reset`：重置整个 Schema 节点
- `designable`：是否显示设计器，默认 `false`
- `setDesignable`：用于切换 `designable` 的值

## Hooks

### useSchemaOptionsContext()

用于获取注册的 `scope` 和 `components`。

```tsx | pure
const { scope, components } = useSchemaOptionsContext();
```

## 组件

### SchemaComponentProvider

其是对 `SchemaComponentContext.Provider` 和 [FormProvider ](https://react.formilyjs.org/api/components/form-provider)的封装，并内置在 `Application` 中，并且会将 `app.components` 和 `app.scopes` 传递过去，所以一般情况下 *不需要关注* 此组件。

- props

```tsx | pure
interface SchemaComponentProviderProps {
  designable?: boolean;
  form?: Form;
  scope?: any;
  components?: SchemaReactComponents;
}
```

- 详细解释
  - `designable`：`SchemaComponentContext` 中 `designable` 的默认值
  - `form`：NocoBase 的 Schema 能力是基于 formily 的 `FormProvider` 提供的，form 是其参数，默认为  `createForm()`
  - `scope`：Schema 中所用到的变量，会通过 `SchemaComponentContext` 进行传递
  - `components`：Schema 中所用到的组件，会通过 `SchemaComponentContext` 进行传递

### SchemaComponent

用于渲染 Schema，此组件必须和 `SchemaComponentProvider` 一起使用，因为 `SchemaComponentProvider` 提供了  [FormProvider](https://react.formilyjs.org/api/components/form-provider) 作为渲染 Schema 的根节点。

- Props

```tsx | pure
type SchemaComponentProps = (ISchemaFieldProps | IRecursionFieldProps) & {
    memoized?: boolean;
    components?: SchemaReactComponents;
    scope?: any;
}
```

- 详细解释

  - `memoized`：当为 `true` 时，会对每层的 Schema 使用 `useMemo()` 进行处理
  - `components`：同 `SchemaComponentProvider` 的 `components`
  - `scope`: 同 `SchemaComponentProvider` 的 `components`

## 综合示例

结合 `SchemaComponentProvider`、 `useSchemaComponentContext()` 和 `SchemaComponent`。

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

使用 `new Application()` 的方式，其内置了 `SchemaComponentProvider` ，我们可以如下操作：

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

在应用中，会有很多层级的嵌套，每一层都可能提供自己的组件和 scope，此组件就是为了层层传递  Schema 所需的 `components` 和 `scope` 的。

- props

```tsx | pure
interface SchemaComponentOptionsProps {
  scope?: any;
  components?: SchemaReactComponents;
}
```

- 示例

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
