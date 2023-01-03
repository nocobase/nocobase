# Plugin

## Overview

Plugins in NocoBase are in the form of `Class`. Custom plugins need to inherit the `Plugin` class.

```typescript
import { Plugin } from '@nocobase/server';

class MyPlugin extends Plugin {
  // ...
}

app.plugin(MyPlugin, { name: 'my-plugin' });
```

## Plugin Lifecycle

Each plugin contains lifecycle methods, you can override these methods in order to execute them at certain stages during runtime. Lifecycle methods will be called by `Application` at certain stages, refer to [`Application` LifeCycle](./application.md).

### `beforeLoad()`

To implement the logic before plugin is loaded, such as event or class registration. The core interface can be accessed here, while other plugins are not available.

### `load()`

To implement the logic to load plugin, configurations and so on. Other plugin instances can be called in `load`, but not in `beforeLoad`.

### `install()`

To implement the logic to install plugin, such as data initialization.

### `afterAdd()`

To implement the logic after the add/addStatic of plugin.

### `afterEnable()`

To implement the logic after plugin is enabled.

### `afterDisable()`

To implement the logic after plugin is disabled.

### `remove()`

To implement the logic to remove plugin.
