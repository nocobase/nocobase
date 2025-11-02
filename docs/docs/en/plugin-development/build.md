# Build

## Custom Build Configuration

If you want to customize the build configuration, you can create a `build.config.ts` file in the plugin's root directory with the following content:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite is used to bundle the `src/client` code

    // Modify the Vite configuration, refer to: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup is used to bundle the `src/server` code

    // Modify the tsup configuration, refer to: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Callback function before the build starts, you can perform some operations here.
  },
  afterBuild: (log: PkgLog) => {
    // Callback function after the build is complete, you can perform some operations here.
  };
});
```