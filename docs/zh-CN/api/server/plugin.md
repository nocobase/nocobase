# Plugin

## 概览

Nocobase 中的插件为 `Class` 的形式。如需自定义插件，需要继承 `Plugin` 类。

```typescript
import { Plugin } from '@nocobase/server';

class MyPlugin extends Plugin {
  // ...
}

```

## 插件生命周期

每个插件都包含生命周期方法，生命周期方法将由 `Application` 在特定阶段调用，可参考 [`Application`生命周期](./application.md)。

你可以重写这些方法，以便于在运行过程中特定的阶段执行这些方法。

### `install()`

插件的 `install` 方法将在插件安装时被调用，在此可以写入插件所需的初始化数据。

### `beforeLoad()`



### `load()`

加载插件。插件在此方法中可以注册路由、中间件等。

