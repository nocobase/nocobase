# Plugin

Plugin Base Class.

- Type

```tsx | pure
class Plugin<T = any> {
  constructor(
    protected options: T,
    protected app: Application,
  ) {
    this.options = options;
    this.app = app;
  }

  get pluginManager() {
    return this.app.pluginManager;
  }

  get router() {
    return this.app.router;
  }

  get pluginSettingsManager() {
    return this.app.pluginSettingsManager;
  }

  get schemaInitializerManager() {
    return this.app.schemaInitializerManager;
  }

  get schemaSettingsManager() {
    return this.app.schemaSettingsManager;
  }

  get dataSourceManager() {
    return this.app.dataSourceManager;
  }

  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}
```

- Details
  - Constructor
    - `options`: There are two ways to add a plugin. One way is to load it remotely from the plugin list, and the other way is to add it through the [PluginManager](/core/application/plugin-manager).
      - Remote loading: `options` will be automatically injected with `{ name: 'npm package.name' }`.
      - PluginManager `options` are passed by the user.
    - `app`: This parameter is automatically injected and represents the application instance.
  - Shortcut Access: The base class provides shortcut access to some methods and properties of `app`.
    - `pluginManager`
    - `router`
    - `pluginSettingsManager`
    - `schemaSettingsManager`
    - `schemaInitializerManager`
  - Lifecycle
    - `afterAdd`: Executed immediately after the plugin is added.
    - `beforeLoad`: Executed during rendering, after `afterAdd` and before `load`.
    - `load`: Executed last.
- Example

```tsx | pure
class MyPlugin extends Plugin {

  async afterAdd() {
    console.log('afterAdd')
  }

  async beforeLoad() {
    console.log('beforeLoad')
  }

  async load() {
    console.log('load')

    // You can access the application instance
    console.log(this.app)

    // Access the application instance content
    console.log(this.app.router, this.router);
  }
}
```
