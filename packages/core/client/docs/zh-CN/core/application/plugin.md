# Plugin

Plugin 基类。

- 类型

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

- 详细信息

  - 构造函数
    - `options`： 插件的添加有两种方式，一种方式从插件列表中远程加载出来，另一种方式是通过 [PluginManager](/core/application/plugin-manager) 添加
      - 远程加载：`options` 会被自动注入 `{ name: 'npm package.name' }`
      - PluginManager `options` 由用户自己传递
    - `app`：此参数是自动注入的，是应用实例
  - 快捷访问：基类提供了对 `app` 部分方法和属性的快捷访问
    - `pluginManager`
    - `router`
    - `pluginSettingsManager`
    - `schemaSettingsManager`
    - `schemaInitializerManager`
  - 声明周期
    - `afterAdd`：插件被添加后立即执行
    - `beforeLoad`：执行渲染时执行，在 `afterAdd` 之后，`load` 之前
    - `load`：最后执行
- 示例

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

    // 可以访问应用实例
    console.log(this.app)

    // 访问应用实例内容
    console.log(this.app.router, this.router);
  }
}
```
