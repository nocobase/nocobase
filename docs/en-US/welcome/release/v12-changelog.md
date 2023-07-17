# v0.12：Update instructions

## Features

- In the production environment, the plugin loading process will be changed from directly importing them locally to dynamically loading them from the server. This change is being made in preparation for the upcoming version, which will support online installation and updates of plugins.

## Break Changes

### Plugin's `devDependencies` and `dependencies`

Due to the plugin hot update loading method, the following changes are required in the package.json:

- `dependencies` will be bundled into the bundle, while `devDependencies` will not.
- If a certain npm package is used in the source code, it must be added to either `dependencies` or `devDependencies`.
- Some packages are provided by `@nocobase/server` or `@nocobase/client`, and they do not need to be added to `dependencies`. Instead, they should be added to `devDependencies`. For more details, refer to: [Plugin dependency management](/development/deps)

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
