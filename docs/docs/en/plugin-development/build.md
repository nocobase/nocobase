---
title: "Build and Package"
description: "NocoBase plugin build and packaging: yarn build, yarn nocobase tar, build.config.ts custom configuration, Rsbuild client bundling, tsup server bundling."
keywords: "plugin build,plugin package,yarn build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Build and Package

After plugin development is complete, you need to go through two steps — build (compile source code) and package (generate `.tar.gz`) — before distributing it to other NocoBase applications.

## Build Plugin

Building compiles the TypeScript source code under `src/` into JavaScript — client-side code is bundled by Rsbuild, and server-side code is bundled by tsup:

```bash
yarn build @my-project/plugin-hello
```

Build artifacts are output to the `dist/` directory under the plugin root.

:::tip

If the plugin is created in a source code repository, the first build will trigger a full repository type check, which may take some time. It's recommended to ensure dependencies are installed and the repository is in a buildable state.

:::

## Package Plugin

Packaging compresses the build artifacts into a `.tar.gz` file for easy upload to other environments:

```bash
yarn nocobase tar @my-project/plugin-hello
```

The package file is output to `storage/tar/@my-project/plugin-hello.tar.gz` by default.

You can also combine build and package into one step using the `--tar` flag:

```bash
yarn build @my-project/plugin-hello --tar
```

## Upload to Other NocoBase Applications

Upload and extract the `.tar.gz` file to the target application's `./storage/plugins` directory. For detailed steps, see [Install and Upgrade Plugins](../get-started/install-upgrade-plugins.mdx).

## Custom Build Configuration

In most cases, the default build configuration is sufficient. If you need to customize it — such as modifying the bundle entry, adding aliases, adjusting compression options, etc. — you can create a `build.config.ts` file in the plugin root directory:

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Modify client-side (src/client-v2) Rsbuild bundling configuration
    // Reference: https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // Modify server-side (src/server) tsup bundling configuration
    // Reference: https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback before build starts, e.g., cleaning temporary files, generating code, etc.
  },
  afterBuild: (log) => {
    // Callback after build completes, e.g., copying extra resources, outputting statistics, etc.
  },
});
```

Key points:

- `modifyRsbuildConfig` — Used to adjust client-side bundling, such as adding Rsbuild plugins, modifying resolve aliases, adjusting code splitting strategies, etc. See the [Rsbuild documentation](https://rsbuild.rs/guide/configuration/rsbuild) for configuration options.
- `modifyTsupConfig` — Used to adjust server-side bundling, such as modifying target, externals, entry, etc. See the [tsup documentation](https://tsup.egoist.dev/#using-custom-configuration) for configuration options.
- `beforeBuild` / `afterBuild` — Hooks before and after the build, receiving a `log` function for output. For example, generate code files in `beforeBuild`, or copy static resources to the output directory in `afterBuild`.

## Related Links

- [Write Your First Plugin](./write-your-first-plugin.md) — Create a plugin from scratch, including the complete build and package workflow
- [Project Structure](./project-structure.md) — Understand the role of directories like `packages/plugins`, `storage/tar`, etc.
- [Dependency Management](./dependency-management.md) — Plugin dependency declarations and global dependencies
- [Plugin Development Overview](./index.md) — Overall introduction to plugin development
- [Install and Upgrade Plugins](../get-started/install-upgrade-plugins.mdx) — Upload packaged files to target environments
