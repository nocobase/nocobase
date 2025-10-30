# Build

## Custom Build Configuration

If you want to customize the build configuration, you can create a `build.config.ts` file in the root directory of the plugin with the following content:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite is used to bundle the `src/client` side code

    // Modify the Vite configuration, for details, please refer to: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup is used to bundle the `src/server` side code

    // Modify the tsup configuration, for details, please refer to: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Callback function before the build starts, you can perform some operations before the build starts
  },
  afterBuild: (log: PkgLog) => {
    // Callback function after the build is complete, you can perform some operations after the build is complete
  };
});
```