# Overview

The server-side for an initialized, empty plugin has the following directory structure.

```bash
|- /my-plugin
  |- /src
    |- /server # Server-side code of the plugin
      |- plugin.ts # Classes of the plugin
      |- index.ts # server-side entry
  |- server.d.ts
  |- server.js
```

`plugin.ts` provides calls to various methods of the plugin lifecycle

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class MyPlugin extends Plugin {
  afterAdd() {
    // After the plugin pm.add is registered. This is mainly used to place a listener for the app beforeLoad event
    this.app.on('beforeLoad');
  }
  beforeLoad() {
    // Custom classes or methods
    this.db.registerFieldTypes()
    this.db.registerModels()
    this.db.registerRepositories()
    this.db.registerOperators()
    // Event Listening
    this.app.on();
    this.db.on();
  }
  async load() {
    // Define collection
    this.db.collection();
    // Import collection
    this.db.import();
    this.db.addMigrations();

    // Define resource
    this.resourcer.define();
    // resource action
    this.resourcer.registerActions();

    // Register middleware
    this.resourcer.use();
    this.acl.use();
    this.app.use();

    // Customize the multilingual package
    this.app.i18n.addResources();
    // Customize command line
    this.app.command();
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
