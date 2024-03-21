# PluginSettingsManager

![](../static/plugin-settings.jpg)

用于管理插件配置页面，其底层对应着 [RouterManager](/core/application/router-manager)。

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

## 实例方法

### pluginSettingsManager.add()

添加插件配置页。

- 类型

```tsx | pure
class PluginSettingsManager {
    add(name: string, options: PluginSettingOptionsType): void
}
```

- 详细解释

第一个参数 `name`，是路由唯一标识，用于后续的删改查，并且 `name` 支持 `.` 用于分割层级，不过需要注意当使用 `.` 分层的时候，父级要使用 [Outlet](https://reactrouter.com/en/main/components/outlet)，让子元素能正常渲染。

第二个参数中 `Component` 支持组件形式和字符串形式，如果是字符串组件，要先通过 [app.addComponents](/core/application/application#appaddcomponents) 进行注册，具体参考 [RouterManager](/core/application/router-manager)。

- 示例

单层级配置。

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

多层级配置。

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

获取配置信息。

- 类型

```tsx | pure
class PluginSettingsManager {
    get(name: string, filterAuth?: boolean): PluginSettingsPageType;
}
```

- 详细解释

第一个是在添加时的 name 参数，第二个参数是是否在获取的时候进行权限过滤。

- 示例

在组件中获取。

```tsx | pure
const Demo = () => {
    const app = useApp();
    const helloSettingPage = this.app.pluginSettingsManager.get('hello');
}
```

在插件中获取。

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

获取插件配置页列表。

- 类型

```tsx | pure
class PluginSettingsManager {
    getList(filterAuth?: boolean): PluginSettingsPageType[]
}
```

- 详细解释

`filterAuth` 默认值为 `true`，即进行权限过滤。

- 示例

```tsx | pure
const Demo = () => {
    const app = useApp();
    const settings = app.pluginSettingsManager.getList();
    const settings = app.pluginSettingsManager.getList(false);
}
```

### pluginSettingsManager.has()

判断是否存在，内部已进行权限过滤。

- 类型

```tsx | pure
class PluginSettingsManager {
    has(name: string): boolean;
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        this.app.pluginSettingsManager.has('hello');
    }
}
```

### pluginSettingsManager.remove()

移除配置。

```tsx | pure
class PluginSettingsManager {
    remove(name: string): void;
}
```

### pluginSettingsManager.getRouteName()

获取对应路由的名称。

- 类型

```tsx | pure
class PluginSettingsManager {
    getRouteName(name: string): string
}
```

- 示例

```tsx | pure
class MyPlugin extends Plugin {
    async load() {
        const helloRouteName = this.pluginSettingsManager.getRouteName('hello'); // admin.settings.hello
    }
}
```

### pluginSettingsManager.getRoutePath()

获取插件配置对应的页面路径。

- 类型

```tsx | pure
class PluginSettingsManager {
    getRoutePath(name: string): string;
}
```

- 示例

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

单独判断是否权限。

```tsx | pure
class PluginSettingsManager {
    hasAuth(name: string): boolean;
}
```
