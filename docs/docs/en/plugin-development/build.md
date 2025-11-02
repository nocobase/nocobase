# Build

## Custom Build Configuration

If you want to customize the build configuration, you can create a `build.config.ts` file in the plugin root directory with the following content:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite is used to bundle `src/client` code

    // Modify Vite configuration, see: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup is used to bundle `src/server` code

    // Modify tsup configuration, see: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Callback function that runs before the build starts, allowing for pre-build operations.
  },
  afterBuild: (log: PkgLog) => {
    // Callback function that runs after the build completes, allowing for post-build operations.
  };
});
```

