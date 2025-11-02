# Write Your First Plugin

This article will guide you through creating a block plugin from scratch that can be used on a page, helping you understand the basic structure and development process of a NocoBase plugin.

## Prerequisites

Before you begin, make sure you have successfully installed NocoBase. If you haven't installed it yet, you can refer to the following installation guides:

- [Install with create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Install from Git source](/get-started/installation/git)

Once the installation is complete, you can officially start your plugin development journey.

## Step 1: Create a Plugin Skeleton via CLI

Execute the following command in the root directory of the repository to quickly generate an empty plugin:

```bash
yarn pm create @my-project/plugin-hello
```

After the command runs successfully, it will generate basic files in the `packages/plugins/@my-project/plugin-hello` directory, with the default structure as follows:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Default export for the server-side plugin
     ├─ client                   # Location for client-side code
     │  ├─ index.tsx             # Default exported client-side plugin class
     │  ├─ plugin.tsx            # Plugin entry point (extends @nocobase/client Plugin)
     │  ├─ models                # Optional: Front-end models (e.g., workflow nodes)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Location for server-side code
     │  ├─ index.ts              # Default exported server-side plugin class
     │  ├─ plugin.ts             # Plugin entry point (extends @nocobase/server Plugin)
     │  ├─ collections           # Optional: Server-side collections
     │  ├─ migrations            # Optional: Data migrations
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Optional: Multi-language
        ├─ en-US.json
        └─ zh-CN.json
```

After creation, you can visit the Plugin Manager page in your browser (default address: http://localhost:13000/admin/settings/plugin-manager) to confirm that the plugin has appeared in the list.

## Step 2: Implement a Simple Client-side Block

Next, we will add a custom block model to the plugin to display a welcome text.

1. **Add a block model file** `client/models/HelloBlockModel.tsx`:

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

2. **Register the block model**. Edit `client/models/index.ts` and export the new model so it can be loaded by the front-end runtime:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

After saving the code, if you are running the development script, you should see hot-reloading logs in the terminal output.

## Step 3: Activate and Experience the Plugin

You can enable the plugin via the command line or the interface:

- **Command Line**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Admin Interface**: Go to the Plugin Manager, find `@my-project/plugin-hello`, and click "Activate".

After activation, create a new "Modern page (v2)" page. When adding a block, you will see "Hello block". Insert it into the page to see the welcome content you just wrote.


![20250928174529](https://static-docs.nocobase.com/20250928174529.png)


## Step 4: Build and Package

When you are ready to distribute the plugin to other environments, you need to build and then package it:

```bash
yarn build @my-project/plugin-hello --tar
# Or execute in two steps
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Tip: If the plugin is created in the source code repository, the first build will trigger a type check for the entire repository, which may take a long time. It is recommended to ensure that dependencies are installed and the repository is in a buildable state.

After the build is complete, the packaged file is located by default at `storage/tar/@my-project/plugin-hello.tar.gz`.

## Step 5: Upload to Other NocoBase Applications

Upload and unzip to the `./storage/plugins` directory of the target application. For details, see [Install and Upgrade Plugins](../get-started/install-upgrade-plugins.mdx).