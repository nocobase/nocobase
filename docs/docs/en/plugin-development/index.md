# Plugin Development Overview

NocoBase uses a **micro-kernel architecture**, where the core is only responsible for plugin lifecycle scheduling, dependency management, and encapsulating basic capabilities. All business features are provided in the form of plugins. Therefore, understanding the organizational structure, lifecycle, and management of plugins is the first step to customizing NocoBase.

## Core Concepts

- **Plug and play**: Plugins can be installed, enabled, or disabled on demand, allowing for flexible combination of business features without modifying code.
- **Front-end and back-end integration**: A plugin usually includes both server-side and client-side implementations to maintain consistency between data logic and interface behavior.

## Basic Plugin Structure

Each plugin is an independent npm package, typically with the following directory structure:

```bash
plugin-hello/
├─ package.json          # Plugin name, dependencies, and NocoBase plugin metadata
├─ client.js             # Front-end build artifact, loaded at runtime
├─ server.js             # Server-side build artifact, loaded at runtime
├─ src/
│  ├─ client/            # Client-side source code, can register blocks, actions, fields, etc.
│  └─ server/            # Server-side source code, can register resources, events, command lines, etc.
```

## Directory Conventions and Loading Order

NocoBase scans the following directories for plugins by default:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugins in source code development (highest priority)
└── storage/
    └── plugins/          # Compiled plugins, such as uploaded or published plugins
```

- `packages/plugins`: Directory for plugins in local development, supporting real-time compilation and debugging.
- `storage/plugins`: Stores compiled plugins, such as commercial or third-party plugins.

## Plugin Lifecycle and States

A plugin typically goes through the following stages:

1.  **Create**: Create a plugin template via the CLI.
2.  **Pull**: Download the plugin package locally, but it has not yet been written to the database.
3.  **Enable**: When enabled for the first time, it performs "registration + initialization"; subsequent enabling only loads the logic.
4.  **Disable**: Stop the plugin from running.
5.  **Remove**: Completely remove the plugin from the system.

:::tip

- `pull` is only responsible for downloading the plugin package; the actual installation process is triggered by the first `enable`.
- If a plugin is only `pull`ed but not enabled, it will not be loaded.

:::

### CLI Command Example

```bash
# 1. Create a plugin skeleton
yarn pm create @my-project/plugin-hello

# 2. Pull the plugin package (download or link)
yarn pm pull @my-project/plugin-hello

# 3. Enable the plugin (automatically installs on first enable)
yarn pm enable @my-project/plugin-hello

# 4. Disable the plugin
yarn pm disable @my-project/plugin-hello

# 5. Remove the plugin
yarn pm remove @my-project/plugin-hello
```

## Plugin Manager Interface

Access the Plugin Manager in your browser to visually view and manage plugins:

**Default address:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)


![Plugin Manager](https://static-docs.nocobase.com/20251030195350.png)