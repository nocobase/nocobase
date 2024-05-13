# PluginSettingsManager

![](../static/plugin-settings.jpg)

Used to manage plugin configuration pages, which correspond to [RouterManager](/core/application/router-manager) at the underlying level.

```tsx | pure
interface PluginSettingOptionsType {
  title: string;
  /**
   * @default `Outlet`
   */
  Component?: ComponentType<T> | string;
  icon?: string;
  /**
   * sort, the smaller the number, the higher the priority
   * @default 0
   */
  sort?: number;
  aclSnippet?: string;
}

interface PluginSettingsPageType {
  label?: string;
  title: string;
  key: string;
  icon: any;
  path: string;
  sort?: number;
  name?: string;
  isAllow?: boolean;
  topLevelName?: string;
  aclSnippet: string;
  children?: PluginSettingsPageType[];
}

class PluginSettingsManager {
  add(name: string, options: PluginSettingOptionsType): void
  get(name: string, filterAuth?: boolean): PluginSettingsPageType;
  getList(filterAuth?: boolean): PluginSettingsPageType[]
  has(name: string): boolean;
  remove(name: string): void;
  getRouteName(name: string): string
  getRoutePath(name: string): string;
  hasAuth(name: string): boolean;
}
```

## Instance Methods

### pluginSettingsManager.add()

Add plugin configuration pages.

- Type

```tsx | pure
class PluginSettingsManager {
    add(name: string, options: PluginSettingOptionsType): void
}
```

- Details

The first parameter `name` is the unique identifier for the route, used for subsequent operations such as deletion and modification. The `name` also supports using `.` to separate hierarchical levels. However, when using `.` for hierarchy, the parent level should use [Outlet](https://reactrouter.com/en/main/components/outlet) to ensure proper rendering of child elements.

In the second parameter, the `Component` supports both component form and string form. If it is a string component, it needs to be registered through [app.addComponents](/core/application/application#appaddcomponents) first, please refer to [RouterManager](/core/application/router-manager) for more details.

- Example

Single-level configuration.

```tsx | pure
const HelloSettingPage = () => {
    return <div>hello setting page</div>
}

class MyPlugin extends Plugin {
    async load() {
        this.app.pluginSettingsManager.add('hello', {
            title: 'Hello',  // menu title and page title
            icon: 'ApiOutlined', // menu icon
            Component: HelloSettingPage
        })
    }
}
```

Multi-level configuration.

```tsx | pure
// 多层级配置页

class MyPlugin extends Plugin {
    async load() {
        this.app.pluginSettingsManager.add('hello', {
          title: 'HelloWorld',
          icon: '',
          // Component: Outlet, 默认为 react-router-dom 的 Outlet 组件，可自定义
        })

        this.app.pluginSettingsManager.add('hello.demo1', {
          title: 'Demo1 Page',
          Component: () => <div>Demo1 Page Content</div>
        })

        this.app.pluginSettingsManager.add('hello.demo2', {
          title: 'Demo2 Page',
          Component: () => <div>Demo2 Page Content</div>
        })
    }
}
```

### pluginSettingsManager.get()

Get configuration information.

- Type

```tsx | pure
class PluginSettingsManager {
    get(name: string, filterAuth?: boolean): PluginSettingsPageType;
}
```

- Details

The first parameter is the `name` parameter when adding, and the second parameter is whether to filter permissions when getting.

- Example

Get in the component.

```tsx | pure
const Demo = () => {
    const app = useApp();
    const helloSettingPage = this.app.pluginSettingsManager.get('hello');
}
```

Get in the plugin.

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const helloSettingPage = this.app.pluginSettingsManager.get('hello')
        const helloSettingPage = this.app.pluginSettingsManager.get('hello', false);

        const mobileAppConfigPage = this.app.pluginSettingsManager.get('mobile.app')
    }
}
```

### pluginSettingsManager.getList()

Get the list of plugin settings pages.

- Type

```tsx | pure
class PluginSettingsManager {
    getList(filterAuth?: boolean): PluginSettingsPageType[]
}
```

- Details

The default value of `filterAuth` is `true`, which means it performs permission filtering.

- Example

```tsx | pure
const Demo = () => {
    const app = useApp();
    const settings = app.pluginSettingsManager.getList();
    const settings = app.pluginSettingsManager.getList(false);
}
```

### pluginSettingsManager.has()

Check if it exists, with internal permission filtering.

- Type

```tsx | pure
class PluginSettingsManager {
    has(name: string): boolean;
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.pluginSettingsManager.has('hello');
    }
}
```

### pluginSettingsManager.remove()

Remove configuration.

```tsx | pure
class PluginSettingsManager {
    remove(name: string): void;
}
```

### pluginSettingsManager.getRouteName()

Get the name of the corresponding route.

- Type

```tsx | pure
class PluginSettingsManager {
    getRouteName(name: string): string
}
```

- Example

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const helloRouteName = this.pluginSettingsManager.getRouteName('hello'); // admin.settings.hello
    }
}
```

### pluginSettingsManager.getRoutePath()

Get the page path corresponding to the plugin configuration.

- Type

```tsx | pure
class PluginSettingsManager {
    getRoutePath(name: string): string;
}
```

- Example

```tsx | pure
const Demo = () => {
    const navigate = useNavigate();
    const app = useApp();
    const helloSettingPath =  app.pluginSettingsManager.getRoutePath('hello');

    return <div onClick={()=> navigate(helloSettingPath)}>
        go to hello setting page
     </div>
}
```

### pluginSettingsManager.hasAuth()

Check the permission separately.

```tsx | pure
class PluginSettingsManager {
    hasAuth(name: string): boolean;
}
```
