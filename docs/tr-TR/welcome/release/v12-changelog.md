# v0.12：Update instructions

## Features

- In the production environment, the plugin loading process will be changed from directly importing them locally to dynamically loading them from the server. This change is being made in preparation for the upcoming version, which will support online installation and updates of plugins.

## Update operation

```bash
yarn clean
yarn build
```

## Break changes

### Plugin's `devDependencies` and `dependencies`

Due to the plugin hot update loading method, the following changes are required in the package.json:

- `dependencies` will be bundled into the bundle, while `devDependencies` will not.
- If a certain npm package is used in the source code, it must be added to either `dependencies` or `devDependencies`.
- Some packages are provided by `@nocobase/server` or `@nocobase/client`, and they do not need to be added to `dependencies`. Instead, they should be added to `devDependencies`. For more details, refer to: [Plugin dependency management](/development/deps)

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

### NPM packages using the ES module

```diff
- const dayjs = require('dayjs');
+ import dayjs from 'dayjs';
```

```diff
- export const namespace = require('../../package.json').name

+ // @ts-ignore
+ import { name } from '../../package.json'
+ export const namespace = name
```

If you want to dynamically import a relative path file, you can still use `require`, for example:

```js
const lang = require(`./locales/${locale}.json`); // ok
```
