# PluginManager

应用插件管理器的实例，由应用自动创建，可以通过 `app.pm` 访问。

## 实例方法

### `add()`

**签名**

* `add(pluginClass: PluginConstructor, options?: any): Plugin`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `pluginClass` | `PluginConstructor` | - | 插件类，参考 [Plugin 类](./plugin) |

**返回值**

对应插件类的实例

**示例**

```ts
import Application, { Plugin } from '@nocobase/server';

class MyPlugin extends Plugin {}

const app = new Application();

app.pm.add(MyPlugin, { a: 1 });
```
