# PluginManager

Used for managing plugins.

```tsx | pure
class PluginManager {
   add<T = any>(plugin: typeof Plugin, opts?: PluginOptions<T>): Promise<void>

   get<T extends typeof Plugin>(PluginClass: T): InstanceType<T>;
   get<T extends {}>(name: string): T;
}
```

## Instance Methods

### pluginManager.add()

Add plugins to the application.

- Type

```tsx | pure
class PluginManager {
    add<T = any>(plugin: typeof Plugin, opts?: PluginOptions<T>): Promise<void>
}
```

- Details

The first parameter is the plugin class, and the second parameter is the options passed during instantiation. As mentioned earlier, the `afterAdd` hook function will be immediately called after adding the plugin, so it returns a `Promise<void>`.

For remote components, an additional name parameter will be automatically passed.

- Example

```tsx | pure
class MyPluginA extends Plugin {
    async load() {
        console.log('options', this.options)
        console.log('app', this.app);
        console.log('router', this.app.router, this.router);
    }
}

class MyPluginB extends Plugin {
    // The method to be executed after adding needs to be placed in afterAdd
    async afterAdd() {
      // When adding a plugin through `app.pluginManager.add()`, the first parameter is the plugin class, and the second parameter is the options passed during instantiation.
      this.app.pluginManager.add(MyPluginA, { name: 'MyPluginA', hello: 'world' })
    }
}

const app = new Application({
    plugins: [MyPluginB],
});
```

### pluginManager.get()

Get the plugin instance.

- Type

```tsx | pure
class PluginManager {
      get<T extends typeof Plugin>(PluginClass: T): InstanceType<T>;
      get<T extends {}>(name: string): T;
}
```

- Details

You can get the plugin instance by using the class, or you can also get it by providing the name if it was specified during plugin registration.

For remote plugins, the name will be automatically passed and it will be the same as the package name.

- Example

```tsx | pure
import MyPluginA from 'xxx';

class MyPluginB extends Plugin {
    async load() {
        // 方式1: 通过 Class 获取
        const myPluginA = this.app.pluginManager.get(MyPluginA);

        // 方式2: 通过 name 获取（添加的时候要传递 name 参数）
        const myPluginA = this.app.pluginManager.get('MyPluginA');
    }
}
```

## Hooks

Get the plugin instance, equivalent to `pluginManager.get()`.

### usePlugin()

```tsx | pure
function usePlugin<T extends typeof Plugin>(plugin: T): InstanceType<T>;
function usePlugin<T extends {}>(name: string): T;
```

- Details

You can get the plugin instance by using the class, or you can also get it by providing the name if it was specified during plugin registration.

- Example

```tsx | pure
import { usePlugin } from '@nocobase/client';

const Demo = () => {
    // Get by Class
    const myPlugin = usePlugin(MyPlugin);

    // Get by name (name parameter must be passed during plugin registration)
    const myPlugin = usePlugin('MyPlugin');

    return <div></div>
}
```
