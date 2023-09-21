# Plugin directory structure

An empty plugin can be created quickly with `yarn pm create my-plugin`, with the following directory structure.

```bash
|- /my-plugin
  |- /src
    |- /client # client-side of the plugin
    |- /server # server-side of the plugin
  |- client.d.ts
  |- client.js
  |- package.json # plugin package information
  |- server.d.ts
  |- server.js
  |- build.config.ts # or `build.config.js`, modify configuration
```

The tutorial for `/src/server` refers to the [server](./server) section, and the tutorial for `/src/client` refers to the [client](./client) section.

If you want to customize the packaging configuration, you can create a `config.js` file in the root directory, with the following content:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite is used to package the `src/client` side code

    // Modify the Vite configuration, for more information, please refer to: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup is used to package the `src/server` side code

    // Modify the tsup configuration, for more information, please refer to: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // The callback function before the build starts, you can do some operations before the build starts
  },
  afterBuild: (log: PkgLog) => {
    // The callback function after the build is completed, you can do some operations after the build is completed
  };
})
```
