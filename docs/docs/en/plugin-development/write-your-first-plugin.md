# Write Your First Plugin

This guide will walk you through creating a block plugin that can be used in pages from scratch, helping you understand the basic structure and development workflow of NocoBase plugins.

## Prerequisites

Before getting started, make sure you have successfully installed NocoBase. If not, you can refer to the following installation guides:

- [Install using create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Install from Git source](/get-started/installation/git)

Once installation is complete, you can officially start your plugin development journey.

## Step 1: Create Plugin Skeleton via CLI

Execute the following command in the repository root directory to quickly generate an empty plugin:

```bash
yarn pm create @my-project/plugin-hello
```

After the command runs successfully, it will generate basic files in the `packages/plugins/@my-project/plugin-hello` directory. The default structure is as follows:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Default export server-side plugin
     ├─ client                   # Client-side code location
     │  ├─ index.tsx             # Default exported client-side plugin class
     │  ├─ plugin.tsx            # Plugin entry (extends @nocobase/client Plugin)
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

After creation, you can access the plugin manager page in your browser (default URL: http://localhost:13000/admin/settings/plugin-manager) to confirm whether the plugin appears in the list.

## Step 2: Implement a Simple Client Block

Next, we'll add a custom block model to the plugin to display a welcome message.

1. **Create a new block model file** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
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

2. **Register the block model**. Edit `client/models/index.ts` to export the new model for frontend runtime loading:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

After saving the code, if you're running a development script, you should see hot-reload logs in the terminal output.

## Step 3: Activate and Test the Plugin

You can enable the plugin via command line or interface:

- **Command Line**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Management Interface**: Access the plugin manager, find `@my-project/plugin-hello`, and click "Activate".

After activation, create a new "Modern page (v2)" page. When adding blocks, you'll see "Hello block". Insert it into the page to see the welcome content you just wrote.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Step 4: Build and Package

When you're ready to distribute the plugin to other environments, you need to build and package it first:

```bash
yarn build @my-project/plugin-hello --tar
# Or execute in two steps
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Note: If the plugin is created in the source repository, the first build will trigger a full repository type check, which may take some time. It's recommended to ensure dependencies are installed and the repository is in a buildable state.

After the build completes, the package file is located at `storage/tar/@my-project/plugin-hello.tar.gz` by default.

## Step 5: Upload to Another NocoBase Application

Upload and extract to the target application's `./storage/plugins` directory. For details, see [Install and Upgrade Plugins](../get-started/install-upgrade-plugins.mdx).

