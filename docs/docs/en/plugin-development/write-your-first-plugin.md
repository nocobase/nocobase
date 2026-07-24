---
title: "Write Your First NocoBase Plugin"
description: "Create a block plugin from scratch: nb scaffold plugin, plugin skeleton, client/server directory, register blocks, development and debugging workflow."
keywords: "write plugin,first plugin,nb scaffold plugin,plugin skeleton,block plugin,NocoBase plugin development"
---

# Write Your First Plugin

This guide will walk you through creating a block plugin that can be used in pages from scratch, helping you understand the basic structure and development workflow of NocoBase plugins.

## Prerequisites

Before getting started, make sure you have installed a NocoBase application via the NocoBase CLI (`nb init`). Plugin development supports two sources: npm and Git. The Git source is recommended (when developing with AI, you can directly reference the source code). See [Install via CLI](../nocobase-cli/installation/cli.md).

```bash
nb init --ui
```

Then choose the `Git source install` option to install the NocoBase application:

![git source](https://static-docs.nocobase.com/20260720173518.png)

Once installation is complete, you can get started.

## Step 1: Create Plugin Skeleton via CLI

Execute the following command in the project root (`<app-path>`) or the `source/` directory to quickly generate an empty plugin:

```bash
nb scaffold plugin @my-project/plugin-hello
```

After the command runs successfully, it will generate basic files in the `<app-path>/plugins/@my-project/plugin-hello` directory (`nb` automatically syncs the plugin to `source/packages/plugins/` for the development and build workflow). The default structure is as follows:

```bash
├─ /plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client-v2.d.ts
  ├─ client-v2.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Default export server-side plugin
     ├─ client-v2                 # Client-side code location
     │  ├─ index.tsx             # Default exported client-side plugin class
     │  ├─ plugin.tsx            # Plugin entry (extends @nocobase/client-v2 Plugin)
     │  ├─ locale.ts             # useT / tExpr translation utilities
     │  ├─ models                # Optional: frontend models (such as flow nodes)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Server-side code location
     │  ├─ index.ts              # Default exported server-side plugin class
     │  ├─ plugin.ts             # Plugin entry (extends @nocobase/server Plugin)
     │  ├─ collections           # Optional: server-side collections
     │  ├─ migrations            # Optional: data migrations
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Optional: multi-language
        ├─ en-US.json
        └─ zh-CN.json
```

After creation, you can run

```bash
nb source dev
```

Then access the plugin manager page in your browser ([default URL](http://localhost:13000/admin/settings/plugin-manager)) to confirm whether the plugin appears in the list.

## Step 2: Implement a Simple Client Block

Next, we'll add a custom block model to the plugin to display a welcome message.

1. **Create a new block model file** `client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Register the block model**. Edit `client-v2/plugin.ts` to register the new model so the frontend runtime can load it:

```ts
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClientV2 extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      }
    })
  }
}

export default PluginHelloClientV2;
```

After saving the code, if you're running a development script, you should see hot-reload logs in the terminal output.

## Step 3: Activate and Test the Plugin

You can enable the plugin via command line or interface:

- **Command Line**

  ```bash
  nb plugin enable @my-project/plugin-hello
  ```

- **Management Interface**: Access the plugin manager, find `@my-project/plugin-hello`, and click "Activate".

After activation, create a new "Modern page (v2)" page. When adding blocks, you'll see "Hello block". Insert it into the page to see the welcome content you just wrote.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Make a Plugin Preset or Built-in by Default (Optional)

The steps above describe manually enabling a single plugin. If you are maintaining your own NocoBase application and want certain plugins to be automatically ready after running `nb init` (first-time installation) or `nb app upgrade` (upgrade), you can use two environment variables to control a plugin's default state:

- **`APPEND_PRESET_LOCAL_PLUGINS` (append preset local plugins)** — Adds the plugin to the preset local plugin list. After installation it appears in the Plugin Manager but is not activated by default; you need to enable it manually.
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (append built-in plugins)** — Adds the plugin to the built-in plugin list. It is automatically activated on installation and, as a built-in plugin, **cannot be disabled or deleted from the Plugin Manager**.

For details, see the [Environment Variables](../get-started/installation/env.md#append_preset_local_plugins) documentation.

## Step 4: Build and Package

When you're ready to distribute the plugin to other environments, you need to build and package it first:

```bash
nb source build @my-project/plugin-hello --tar
# Or execute in two steps
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
```

:::tip

If the plugin is created in a source code repository, the first build will trigger a full repository type check, which may take some time. It's recommended to ensure dependencies are installed and the repository is in a buildable state.

:::

After the build completes, the package file is located in the `source/storage/tar/` directory by default. The command will print the full path of the tarball.

:::tip

It's recommended to write test cases to verify core logic before publishing a plugin. NocoBase provides a complete server-side testing toolchain. See [Test](./server/test.md) for details.

:::

## Step 5: Upload to Other NocoBase Applications

Upload and extract the package file to the target application's `./storage/plugins` directory. For detailed steps, see [Install and Upgrade Plugins](../get-started/install-upgrade-plugins.mdx).

## Related Links

- [Plugin Development Overview](./index.md) — Understand NocoBase microkernel architecture and plugin lifecycle
- [Project Structure](./project-structure.md) — Project directory conventions, plugin loading paths and priority
- [Server-side Development Overview](./server/index.md) — Overall introduction and core concepts of server-side plugins
- [Client-side Development Overview](./client/index.md) — Overall introduction and core concepts of client-side plugins
- [Build and Package](./build.md) — Plugin build, packaging, and distribution workflow
- [Test](./server/test.md) — Writing server-side plugin test cases
- [AI Agent Quick Start](../ai/quick-start.mdx) — Install the NocoBase CLI and initialize an application
- [Install via CLI](../nocobase-cli/installation/cli.md) — Complete installation guide
- [Install and Upgrade Plugins](../get-started/install-upgrade-plugins.mdx) — Upload packaged plugins to other environments
- [Environment Variables](../get-started/installation/env.md) — Environment variable configuration for preset and built-in plugins
