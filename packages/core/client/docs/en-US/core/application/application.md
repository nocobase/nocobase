# Application

## new Application(options)

Creates an instance of a NocoBase application.

- Type

```tsx | pure
export interface ApplicationOptions {
  apiClient?: APIClientOptions | APIClient;
  ws?: WebSocketClientOptions | boolean;
  i18n?: i18next;
  providers?: (ComponentType | ComponentAndProps)[];
  plugins?: PluginType[];
  components?: Record<string, ComponentType>;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  schemaSettings?: SchemaSetting[];
  schemaInitializers?: SchemaInitializer[];
  loadRemotePlugins?: boolean;
  dataSourceManager?: DataSourceManagerOptions;
  addFieldInterfaceComponentOption(fieldName: string, componentOption: CollectionFieldInterfaceComponentOption): void;
}
```

## Details
- `apiClient`: API request instance. For more details, refer to: [NocoBase API SDK Documentation](https://docs.nocobase.com/api/sdk)
- `i18n`: Internationalization. For specifics, see: [i18next API Documentation](https://www.i18next.com/overview/api#createinstance)
- `providers`: Context providers
- `components`: Global components
- `scopes`: Global scopes
- `router`: Route configuration. Refer to: [RouterManager](/core/application/router-manager)
- `pluginSettings`: [PluginSettingsManager](/core/application/plugin-settings-manager)
- `schemaSettings`: Schema settings tool. For more information, refer to: [SchemaSettingsManager](/core/ui-schema/schema-initializer-manager)
- `schemaInitializers`: Schema addition tool. For more information, refer to: [SchemaInitializerManager](/core/ui-schema/schema-initializer-manager)
- `loadRemotePlugins`: Used to control whether to load remote plugins. Default is `false`, meaning remote plugins are not loaded (convenient for unit testing and DEMO environments).
- `dataSourceManager`: Data source manager. For more details, refer to: [DataSourceManager](/core/data-source/data-source-manager)
- `addFieldInterfaceComponentOption`: Add field interface component options. For more details, refer to: [CollectionFieldInterfaceManager](/core/data-source/collection-field-interface-manager#addfieldinterfacecomponentoption)

## Example

```tsx
/**
 * defaultShowCode: true
 */
import { Application, Plugin } from '@nocobase/client';

const ProviderDemo = ({ children }) => {
    return <div>
        <div>hello world</div>
        <div style={{ marginTop: 10 }}>{children}</div>
    </div>
}

class MyPlugin extends Plugin {
    async load(){
        this.app.router.add('home', {
            path: '/',
            Component: () => <div>home page</div>
        })
    }
}

const app = new Application({
    providers: [ProviderDemo],
    plugins: [MyPlugin],
    router: {
        type: 'memory',
        initialEntries: ['/'],
    }
});

export default app.getRootComponent();
```

## Instance Properties

### app.i18n

```tsx | pure
class Application {
    i18n: i18next;
}
```

For a detailed introduction, please refer to: [i18next](https://www.i18next.com/overview/api#createinstance)

### app.apiClient

```tsx | pure
class Application {
    apiClient: APIClient;
}
```

For a detailed introduction, please refer to: [APIClient](https://docs.nocobase.com/api/sdk)

### app.router

For a detailed introduction, please refer to: [RouterManager](/core/application/router-manager)

### app.pluginSettingsManager

For a detailed introduction, please refer to: [PluginSettingsManager](/core/application/plugin-settings-manager)

### app.schemaSettingsManager

For a detailed introduction, please refer to: [SchemaSettingsManager](/core/ui-schema/schema-initializer-manager)

### app.schemaInitializerManager

For a detailed introduction, please refer to: [SchemaInitializerManager](/core/ui-schema/schema-initializer-manager)

### app.dataSourceManager

For a detailed introduction, please refer to: [dataSourceManager](/core/data-source/data-source-manager)

## Instance Methods

### app.getRootComponent()

Get the root component of the application.

- Type

```tsx | pure
class Application {
    getRootComponent(): React.FC
}
```

- Example

```tsx | pure
import { Application } from '@nocobase/client';

const app = new Application();

const App = app.getRootComponent();
```

### app.mount()

Mount the application instance in a container element.

- Type

```tsx | pure
class Application {
    mount(containerOrSelector: Element | ShadowRoot | string): ReactDOM.Root
}
```

- Example

```tsx | pure
import { Application } from '@nocobase/client';

const app = new Application();

app.mount('#root');
```

### app.addProvider()

Add `Provider` context.

- Type

```tsx | pure
class Application {
    addProvider<T = any>(component: ComponentType, props?: T): void;
}
```

- Details

The first parameter is the component, and the second parameter is the component's props. Note that the `Provider` must render its `children`.

- Example

```tsx | pure
// Scenario 1: Third-party library or self-created Context
const MyContext = createContext({});
app.addProvider(MyContext.provider, { value: { color: 'red' } });
```

```tsx
import { createContext, useContext } from 'react';
import { Application, Plugin } from '@nocobase/client';

const MyContext = createContext();

const HomePage = () => {
    const { color } = useContext(MyContext) || {};
    return <div style={{ color }}>home page</div>
}

class MyPlugin extends Plugin {
    async load(){
        this.app.addProvider(MyContext.Provider, { value: { color: 'red' } });
        this.app.router.add('home', {
            path: '/',
            Component: HomePage
        })
    }
}

const app = new Application({
    plugins: [MyPlugin],
    router: {
        type: 'memory',
        initialEntries: ['/'],
    }
});

export default app.getRootComponent();
```

```tsx | pure
// Scenario 2: Custom component, pay attention to children
const GlobalDemo = ({ name, children }) => {
    return <div>
        <div>hello, { name }</div>
        <div>{ children }</div>
    </div>
}
app.addProvider(GlobalDemo, { name: 'nocobase' });
```


```tsx
import { Application, Plugin } from '@nocobase/client';

const GlobalDemo = ({ name, children }) => {
    return <div>
        <div>hello, { name }</div>
        <div>{ children }</div>
    </div>
}

class MyPlugin extends Plugin {
    async load(){
        this.app.addProvider(GlobalDemo, { name: 'nocobase' });
        this.app.router.add('home', {
            path: '/',
            Component: () => <div>home page</div>
        })
    }
}

const app = new Application({
    plugins: [MyPlugin],
    router: {
        type: 'memory',
        initialEntries: ['/'],
    }
});

export default app.getRootComponent();
```


### app.addProviders()

Add multiple `Provider` contexts.

- Type

```tsx | pure
class Application {
    addProviders(providers: (ComponentType | [ComponentType, any])[]): void;
}
```

- Details

Add multiple `Provider` contexts at once.

- Example

```tsx | pure
app.addProviders([[MyContext.provider, { value: { color: 'red' } }], [GlobalDemo, { name: 'nocobase' }]])
```

### app.addComponents()

Add global components.

Global components can be used in [RouterManager](/core/application/router-manager) and [UI Schema](/core/ui-schema/schema-component).

- Type

```tsx | pure
class Application {
    addComponents(components: Record<string, ComponentType>): void;
}
```

- Example

```tsx | pure
app.addComponents({ Demo, Foo, Bar })
```

### app.addScopes()

Add global scopes.

Global scopes can be used in [UI Schema](/core/ui-schema/schema-component).

- Type

```tsx | pure
class Application {
    addScopes(scopes: Record<string, any>): void;
}
```

- Example

```tsx | pure
function useSomeThing() {}
const anyVar = '';

app.addScopes({ useSomeThing, anyVar })
```

### app.getCollectionManager()

Get the [collection manager](/core/data-source/collection-manager) instance of the specified data source.

- Type

```tsx | pure
class Application {
  getCollectionManager(dataSource?: string): CollectionManager;
}
```

- Example

```tsx | pure
app.getCollectionManager() // Get the default data source collection manager
app.getCollectionManager('test') // Get the specified data source collection manager
```

### app.addFieldInterfaceComponentOption()

Add field interface component option.

For a detailed introduction, please refer to: [CollectionFieldInterfaceManager](/core/data-source/collection-field-interface-manager#addfieldinterfacecomponentoption)

```tsx | pure
class MyPlugin extends Plugin {
  async load() {
    this.app.addFieldInterfaceComponentOption('url', {
      label: 'Preview',
      value: 'Input.Preview',
    });
  }
}
```

### app.registerVariable()

Register custom variables for frontend use.

- Type

```tsx | pure
interface VariableOption {
  /** Unique identifier of the variable */
  value: string | number;
  /** Variable name displayed in UI */
  label?: React.ReactNode;
  disabled?: boolean;
  children?: VariableOption[];
}

interface Variable {
  /** Unique identifier of the variable */
  name: string;
  /** Variable configuration options */
  useOption: () => ({ option: VariableOption; visible?: boolean });
  /** Variable context */
  useCtx: () => (any | ((param: { variableName: string }) => Promise<any>));
}

class Application {
  registerVariable(variable: Variable): void;
}
```

- Details

Register custom variables for use in the frontend. Note: It is not recommended to register variables in components as it may cause rendering errors. After registration, variables can be used in variable selectors and support asynchronous context handling and nested option structures.

- Example

```tsx | pure
// Basic variable registration
app.registerVariable({
  name: 'currentUser',
  useOption: () => ({
    option: {
      value: 'currentUser',
      label: 'Current User',
    },
    visible: true
  }),
  useCtx: () => ({ id: 1, name: 'admin' })
});

// Variable with asynchronous context support
app.registerVariable({
  name: 'dynamicData',
  useOption: () => ({
    option: {
      value: 'dynamicData',
      label: 'Dynamic Data',
    }
  }),
  useCtx: () => async ({ variableName }) => {
    const data = await fetchSomeData(variableName);
    return data;
  }
});

// Variable with nested options support
app.registerVariable({
  name: 'userSettings',
  useOption: () => ({
    option: {
      value: 'userSettings',
      label: 'User Settings',
      children: [
        {
          value: 'theme',
          label: 'Theme Settings',
        },
        {
          value: 'language',
          label: 'Language Settings',
        }
      ]
    }
  }),
  useCtx: () => ({ theme: 'dark', language: 'en-US' })
});
```

### app.getVariables()

Get all registered variables.

- Type

```tsx | pure
class Application {
  getVariables(): Variable[];
}
```

- Details

Returns a list of all registered variables in the application. Typically used for debugging or displaying all available variables in variable selectors.

- Example

```tsx | pure
const variables = app.getVariables();
console.log('Registered variables:', variables.map(v => v.name));
```

## Hooks

### useApp()

Get the instance of the current application.

- Type

```tsx | pure
const useApp: () => Application
```

- Example

```tsx | pure
const Demo = () => {
    const app = useApp();
    return <div>{ JSON.stringify(app.router.getRouters()) }</div>
}
```

```tsx
import { Application, Plugin, useApp } from '@nocobase/client';

const HomePage = () => {
    const app = useApp();
    return <div>{ JSON.stringify(app.router.getRoutes()) }</div>
}

class MyPlugin extends Plugin {
    async load(){
        this.app.router.add('home', {
            path: '/',
            Component: HomePage
        })
    }
}

const app = new Application({
    plugins: [MyPlugin],
    router: {
        type: 'memory',
        initialEntries: ['/'],
    }
});

export default app.getRootComponent();
```
