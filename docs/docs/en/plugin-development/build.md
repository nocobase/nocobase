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
    // A callback function that runs before the build starts. You can perform some operations here.
  },
  afterBuild: (log: PkgLog) => {
    // A callback function that runs after the build is complete. You can perform some operations here.
  };
});
```