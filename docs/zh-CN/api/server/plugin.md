# Plugin

## 概览

Nocobase 中的插件为 `Class` 的形式。如需自定义插件，需要继承 `Plugin` 类。

```typescript
import { Plugin } from '@nocobase/server';

class MyPlugin extends Plugin {
  // ...
}

app.plugin(MyPlugin, { name: 'my-plugin' });
```

## 插件生命周期

每个插件都包含生命周期方法，生命周期方法将由 `Application` 在特定阶段调用，可参考 [`Application`生命周期](./application.md)。

你可以重写这些方法，以便于在运行过程中特定的阶段执行这些方法。


### `afterAdd()`

插件 add/addStatic 之后

### `beforeLoad()`

插件加载前，如事件或类注册

### `load()`

加载插件，配置之类

### `install()`

插件安装逻辑，如初始化数据

### `afterEnable()`

插件激活之后的逻辑

### `afterDisable()`

插件禁用之后的逻辑

### `remove()`

用于实现插件删除逻辑
