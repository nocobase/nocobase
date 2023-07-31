# v0.12：Update instructions

## Features

- In the production environment, the plugin loading process will be changed from directly importing them locally to dynamically loading them from the server. This change is being made in preparation for the upcoming version, which will support online installation and updates of plugins.

## Update operation

```bash
yarn clean
yarn install
yarn build
```

## Break changes

### Plugin's `devDependencies` and `dependencies`

The dependencies of the plugin are divided into its own dependencies and global dependencies. Global dependencies are provided by `@nocobase/server` and `@nocobase/client`, and will not be packaged into the plugin product. Its own dependencies will be packaged into the product.

Because the dependencies of the plugin itself will be packaged into the product (including the npm packages that the server depends on, which will also be packaged into `dist/node_modules`), when developing the plugin, all dependencies should be placed in `devDependencies`.

```diff
{
  "dependencies": {
-   "@nocobase/server": "^0.11.0",
-   "dayjs": "^4.17.21"
  }
  "devDependencies": {
+   "@nocobase/server": "^0.11.0",
+   "dayjs": "^4.17.21"
  }
}
```

More information about updates and global plugin lists, see: [Plugin dependency management](/development/deps).

### Upgrade formily version from 2.2.6 to 2.2.7

All `@formily/xx` are upgraded from `2.2.6` to `2.2.7`, please update the dependencies. For example:

```diff
{
  "dependencies": {
-   "@formily/antd": "2.2.26",
+   "@formily/antd": "2.2.27",
  }
}
```

### The bundle of plugin has changed from `lib` to `dist`

The plugin bundle has changed from `lib` to `dist`, so you need to:

```diff
{
  - "main": "./lib/server/index.js",
  + "main": "./dist/server/index.js",
}
```

### plugin directory must have both `src/client` and `src/server` directories

```js
// src/client/index.ts
import { Plugin } from '@nocobase/client';

class MyPlugin extends Plugin {
  async load() {
    // ...
  }
}

export default MyPlugin;
```

```js
// src/server/index.ts
import { Plugin } from '@nocobase/server';

class MyPlugin extends Plugin {
  async load() {
    // ...
  }
}

export default MyPlugin;
```

For more information, refer to: [sample-hello](https://github.com/nocobase/nocobase/tree/main/packages/samples/hello)

## Other

Load plugins remotely in the local development environment, you need to set the environment to `USE_REMOTE_PLUGIN=true`:

```bash
yarn cross-env USE_REMOTE_PLUGIN=true nocobase dev
```
