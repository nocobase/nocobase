# PluginManager

用于管理插件。

```tsx | pure
class PluginManager {
   add<T = any>(plugin: typeof Plugin, opts?: PluginOptions<T>): Promise<void>

   get<T extends typeof Plugin>(PluginClass: T): InstanceType<T>;
   get<T extends {}>(name: string): T;
}
```

## 实例方法

### pluginManager.add()

将插件添加到应用中。

- 类型

```tsx | pure
class PluginManager {
    add<T = any>(plugin: typeof Plugin, opts?: PluginOptions<T>): Promise<void>
}
```

- 详细信息

第一个参数是插件类，第二个则是实例化时传递的参数。前面已经讲过会在添加插件后，立即调用 `afterAdd` 钩子函数，所以返回的是 `Promise<void>`。

对于远程组件而言，会自动传递一个 `name` 参数。

- 示例

```tsx | pure
class MyPluginA extends Plugin {
    async load() {
        console.log('options', this.options)
        console.log('app', this.app);
        console.log('router', this.app.router, this.router);
    }
}

class MyPluginB extends Plugin {
    // 需要在 afterAdd 执行添加的方法
    async afterAdd() {
      // 通过 `app.pluginManager.add()` 添加插件时，第一个参数是插件类，第二个参数是实例化时传递的参数
      this.app.pluginManager.add(MyPluginA, { name: 'MyPluginA', hello: 'world' })
    }
}

const app = new Application({
    plugins: [MyPluginB],
});
```

### pluginManager.get()

获取插件实例。

- 类型

```tsx | pure
class PluginManager {
      get<T extends typeof Plugin>(PluginClass: T): InstanceType<T>;
      get<T extends {}>(name: string): T;
}
```

- 详细信息

可以通过 Class 获取插件示例，如果在插件注册的时候有 name，也可以通过字符串的 name 获取。

如果是远程插件，会自动传入 name，值为 package 的 name。

- 示例

```tsx | pure
import MyPluginA from 'xxx';

class MyPluginB extends Plugin {
    async load() {
        // 方式1：通过 Class 获取
        const myPluginA = this.app.pluginManager.get(MyPluginA);

        // 方式2：通过 name 获取（添加的时候要传递 name 参数）
        const myPluginA = this.app.pluginManager.get('MyPluginA');
    }
}
```

## Hooks

获取插件实例，等同于 `pluginManager.get()`。

### usePlugin()

```tsx | pure
function usePlugin<T extends typeof Plugin>(plugin: T): InstanceType<T>;
function usePlugin<T extends {}>(name: string): T;
```

- 详细信息

可以通过 Class 获取插件示例，如果在插件注册的时候有 name，也可以通过字符串的 name 获取。

- 示例

```tsx | pure
import { usePlugin } from '@nocobase/client';

const Demo = () => {
    // 通过 Class 获取
    const myPlugin = usePlugin(MyPlugin);

    // 通过 name 获取（添加的时候要传递 name 参数）
    const myPlugin = usePlugin('MyPlugin');

    return <div></div>
}
```
