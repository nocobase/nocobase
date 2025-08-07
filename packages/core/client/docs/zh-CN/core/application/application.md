# Application

## new Application(options)

创建一个 NocoBase 应用。

- 类型

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

- 详细信息
  - `apiClient`：API 请求实例，具体说明请参见：[https://docs.nocobase.com/api/sdk](https://docs.nocobase.com/api/sdk)
  - `i18n`：国际化，具体请参考：[https://www.i18next.com/overview/api#createinstance](https://www.i18next.com/overview/api#createinstance)
  - `providers`：上下文
  - `components`：全局组件
  - `scopes`：全局 scopes
  - `router`：配置路由，具体请参考：[RouterManager](/core/application/router-manager)
  - `pluginSettings`: [PluginSettingsManager](/core/application/plugin-settings-manager)
  - `schemaSettings`：Schema 设置工具，具体参考：[SchemaSettingsManager](/core/ui-schema/schema-initializer-manager)
  - `schemaInitializers`：Schema 添加工具，具体参考：[SchemaInitializerManager](/core/ui-schema/schema-initializer-manager)
  - `loadRemotePlugins`：用于控制是否加载远程插件，默认为 `false`，即不加载远程插件（方便单测和 DEMO 环境）。
  - `dataSourceManager`：数据源管理器，具体参考：[DataSourceManager](/core/data-source/data-source-manager)
  - `addFieldInterfaceComponentOption`: 添加 Field interface 组件选项。具体参考： [CollectionFieldInterfaceManager](/core/data-source/collection-field-interface-manager#addfieldinterfacecomponentoption)
- 示例

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

## 实例属性

### app.i18n

```tsx | pure
class Application {
    i18n: i18next;
}
```

详细介绍，请参考：[i18next](https://www.i18next.com/overview/api#createinstance)

### app.apiClient

```tsx | pure
class Application {
    apiClient: APIClient;
}
```

详细介绍，请参考：[APIClient](https://docs.nocobase.com/api/sdk)

### app.router

详细介绍，请参考：[RouterManager](/core/application/router-manager)

### app.pluginSettingsManager

详细介绍，请参考：[PluginSettingsManager](/core/application/plugin-settings-manager)

### app.schemaSettingsManager

详细介绍，请参考：[SchemaSettingsManager](/core/ui-schema/schema-initializer-manager)

### app.schemaInitializerManager

详细介绍，请参考：[SchemaInitializerManager](/core/ui-schema/schema-initializer-manager)

### app.dataSourceManager

详细介绍，请参考：[dataSourceManager](/core/data-source/data-source-manager)

## 实例方法

### app.getRootComponent()

获取应用的根组件。

- 类型

```tsx | pure
class Application {
    getRootComponent(): React.FC
}
```

- 示例

```tsx | pure
import { Application } from '@nocobase/client';

const app = new Application();

const App = app.getRootComponent();
```

### app.mount()

将应用实例挂载在一个容器元素中。

- 类型

```tsx | pure
class Application {
    mount(containerOrSelector: Element | ShadowRoot | string): ReactDOM.Root
}
```

- 示例

```tsx | pure
import { Application } from '@nocobase/client';

const app = new Application();

app.mount('#root');
```

### app.addProvider()

添加 `Provider` 上下文。

- 类型

```tsx | pure
class Application {
    addProvider<T = any>(component: ComponentType, props?: T): void;
}
```

- 详细信息

第一个参数是组件，第二个参数是组件的参数。注意 `Provider` 一定要渲染 `children`。

- 示例

```tsx | pure
// 场景1：第三方库，或者自己创建的 Context
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
// 场景2：自定义的组件，注意 children
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

添加多个 `Provider` 上下文。

- 类型

```tsx | pure
class Application {
    addProviders(providers: (ComponentType | [ComponentType, any])[]): void;
}
```

- 详细信息

一次添加多个 `Provider`。

- 示例

```tsx | pure
app.addProviders([[MyContext.provider, { value: { color: 'red' } }], [GlobalDemo, { name: 'nocobase' }]])
```

### app.addComponents()

添加全局组件。

全局组件可以使用在 [RouterManager](/core/application/router-manager) 和 [UI Schema](/core/ui-schema/schema-component)上。

- 类型

```tsx | pure
class Application {
    addComponents(components: Record<string, ComponentType>): void;
}
```

- 示例

```tsx | pure
app.addComponents({ Demo, Foo, Bar })
```

### app.addScopes()

添加全局的 scope。

全局组 scope 可以 [UI Schema](/core/ui-schema/schema-component) 上。

- 类型

```tsx | pure
class Application {
    addScopes(scopes: Record<string, any>): void;
}
```

- 示例

```tsx | pure
function useSomeThing() {}
const anyVar = '';

app.addScopes({ useSomeThing, anyVar })
```

### app.getCollectionManager()

获取指定数据源的 [collection manager](/core/data-source/collection-manager) 实例。

- 类型

```tsx | pure
class Application {
  getCollectionManager(dataSource?: string): CollectionManager;
}
```

- 示例

```tsx | pure
app.getCollectionManager() // 获取默认数据源的 collection manager
app.getCollectionManager('test') // 获取指定数据源的 collection manager
```

### app.addFieldInterfaceComponentOption()

Add field interface component option.

添加 Field interface 组件选项。具体参考： [CollectionFieldInterfaceManager](/core/data-source/collection-field-interface-manager#addfieldinterfacecomponentoption)


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

注册自定义变量。

- 类型

```tsx | pure
interface VariableOption {
  /** 变量的唯一标识 */
  value: string | number;
  /** 在界面中显示的变量名称 */
  label?: React.ReactNode;
  disabled?: boolean;
  children?: VariableOption[];
}

interface Variable {
  /** 变量的唯一标识 */
  name: string;
  /** 变量配置选项 */
  useOption: () => ({ option: VariableOption; visible?: boolean });
  /** 变量上下文 */
  useCtx: () => (any | ((param: { variableName: string }) => Promise<any>));
}

class Application {
  registerVariable(variable: Variable): void;
}
```

- 详细信息

注册自定义变量供前端使用。注意：不建议在组件中注册变量，因为可能会导致渲染错误。变量注册后可以在变量选择器中使用，支持异步上下文处理和嵌套选项结构。

- 示例

```tsx | pure
// 基础变量注册
app.registerVariable({
  name: 'currentUser',
  useOption: () => ({
    option: {
      value: 'currentUser',
      label: '当前用户',
    },
    visible: true
  }),
  useCtx: () => ({ id: 1, name: 'admin' })
});

// 支持异步上下文的变量
app.registerVariable({
  name: 'dynamicData',
  useOption: () => ({
    option: {
      value: 'dynamicData',
      label: '动态数据',
    }
  }),
  useCtx: () => async ({ variableName }) => {
    const data = await fetchSomeData(variableName);
    return data;
  }
});

// 支持嵌套选项的变量
app.registerVariable({
  name: 'userSettings',
  useOption: () => ({
    option: {
      value: 'userSettings',
      label: '用户设置',
      children: [
        {
          value: 'theme',
          label: '主题设置',
        },
        {
          value: 'language',
          label: '语言设置',
        }
      ]
    }
  }),
  useCtx: () => ({ theme: 'dark', language: 'zh-CN' })
});
```

### app.getVariables()

获取所有已注册的变量。

- 类型

```tsx | pure
class Application {
  getVariables(): Variable[];
}
```

- 详细信息

返回应用中所有已注册的变量列表。通常用于调试或在变量选择器中展示所有可用变量。

- 示例

```tsx | pure
const variables = app.getVariables();
console.log('已注册的变量:', variables.map(v => v.name));
```

## Hooks

### useApp()

获取当前应用的实例。

- 类型

```tsx | pure
const useApp: () => Application
```

- 示例

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
