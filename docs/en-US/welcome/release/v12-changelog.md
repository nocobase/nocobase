# v0.12: New plugin build tool

## New Features

- New plugin build tool. The built plugins will be able to be used directly on the production environment without the need for a second build.

## Application upgrades

### Upgrade of Docker installation

No change, refer to [Docker Image Upgrade Guide](/welcome/getting-started/upgrading/docker-compose) for upgrade.

### Upgrading source code installation

The plugin build tool has been freshly upgraded, and the cache needs to be cleared after pulling new sources.

```bash
git pull # Pull the new source code.
yarn clean # Clear the cache.
```

For more details, see [Git source upgrade guide](/welcome/getting-started/upgrading/git-clone).

### Upgrading a create-nocobase-app installation

Redownload the new version via `yarn create` and update the .env configuration, see [major version upgrade guide](/welcome/getting-started/upgrading/create-nocobase-app#Major version upgrade) for more details.

## Incompatible changes

### @nocobase/app-client and @nocobase/app-server merged into @nocobase-app

Apps installed via create-nocobase-app no longer have a packages/app directory, and custom code in packages/app needs to be moved to the custom plugin.

### The dist/client path of the app has changed.

If you are configuring nginx yourself, you will need to make a similar adjustment

```diff
server {
- root /app/nocobase/packages/app/client/dist;
+ root /app/nocobase/node_modules/@nocobase/app/dist/client;

  location / {
-       root /app/nocobase/packages/app/client/dist;
+       root /app/nocobase/node_modules/@nocobase/app/dist/client;
        try_files $uri $uri/ /index.html;
        add_header Last-Modified $date_gmt;
        add_header Cache-Control 'no-store, no-cache';
        if_modified_since off;
        expires off;
        etag off;
    }
}
```

### Third party plugins need to be rebuilt

Refer to the third-party plugin upgrade guide below

## Third-party plugin upgrade guide

### The plugin directory must have both `src/client` and `src/server` directories.

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

Specific demo code can be referred to: [sample-hello](https://github.com/nocobase/nocobase/tree/main/packages/samples/hello)

### Plugin's multilingual placement `src/locale` directory

Both frontend and backend, multi-language translation files are placed in the `src/locale` directory, so the plugin doesn't need to load multi-language packages by itself.

### Adjustment of plugin dependencies

The dependencies of the plugin are divided into its own dependencies and global dependencies. Global dependencies are directly used globally and will not be packaged into the plugin product, while its own dependencies will be packaged into the product. After the plug-in is built, the production environment is plug-and-play, and there is no need to install dependencies or build twice. Adjustments to plugin dependencies include:

- Put `@nocobase/*` related packages into `peerDependencies` and specify the version number as `0.x`;
- Place other dependencies in `devDependencies`, not `dependencies`, as the plugin will extract all the dependencies required by the production environment after packaging.


```diff
{
  "devDependencies": {
    "@formily/react": "2.x",
    "@formily/shared": "2.x",
    "ahooks": "3.x",
    "antd": "5.x",
    "dayjs": "1.x",
    "i18next": "22.x",
    "react": "18.x",
    "react-dom": "18.x",
    "react-i18next": "11.x"
  },
  "peerDependencies": {
    "@nocobase/actions": "0.x",
    "@nocobase/client": "0.x",
    "@nocobase/database": "0.x",
    "@nocobase/resourcer": "0.x",
    "@nocobase/server": "0.x",
    "@nocobase/test": "0.x",
    "@nocobase/utils": "0.x"
  }
}
```

### The output path of the plugin has been changed from `lib` to `dist`

dist directory structure

```bash
|- dist
  |- client       # Client-side, umd
    |- index.js
    |- index.d.ts
  |- server       # Server-side, cjs
    |- index.js
    |- index.d.ts
    |- others
  |- locale       # multilingual package
  |- node_modules # server dependencies
```

Other related adjustments include:

Adjustment of the main parameter of package.json

```diff
{
  - "main": "./lib/server/index.js",
  + "main": "./dist/server/index.js",
}
```

client.d.ts

```ts
export * from './dist/client';
export { default } from './dist/client';
```

client.js

```js
module.exports = require('./dist/client/index.js');
```

server.d.ts

```ts
export * from './dist/server';
export { default } from './dist/server';
```

server.js

```js
module.exports = require('./dist/server/index.js');
```
