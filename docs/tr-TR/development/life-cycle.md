# Life cycle

## Lifecycle of applications

<img src="./index/app-flow.svg" style="max-width: 380px;" />

## Lifecycle of plugins

<img src="./index/pm-flow.svg" style="max-width: 600px;" />

## Lifecycle methods for plugins

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class MyPlugin extends Plugin {
  afterAdd() {
    // After the plugin pm.add is registered. Mainly used to place the app.beforeLoad event.
  beforeLoad() { }
  beforeLoad() {
    // Before all plugins are loaded. Generally used for registering classes and event listeners
  }
  async load() {
    // Load configuration
  }
  async install(options?: InstallOptions) {
    // Logic for installing
  }
  async afterEnable() {
    // After activation
  }
  async afterDisable() {
    // After disable
  }
  async remove() {
    // Logic for removing
  }
}

export default MyPlugin;
```
