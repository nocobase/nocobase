# Plugin Development Overview

NocoBase adopts a **microkernel architecture**, where the core is only responsible for plugin lifecycle scheduling, dependency management, and basic capability encapsulation. All business functions are provided as plugins. Therefore, understanding the plugin's organizational structure, lifecycle, and management approach is the first step in customizing NocoBase.

## Core Concepts

- **Plug and Play**: Plugins can be installed, enabled, or disabled as needed, allowing flexible combination of business functions without modifying code.
- **Full-stack Integration**: Plugins typically include both server-side and client-side implementations, ensuring consistency between data logic and UI interactions.

## Basic Plugin Structure

Each plugin is an independent npm package, typically containing the following directory structure:

```bash
plugin-hello/
├─ package.json          # Plugin name, dependencies, and NocoBase plugin metadata
├─ client.js             # Frontend build artifact for runtime loading
├─ server.js             # Server-side build artifact for runtime loading
├─ src/
│  ├─ client/            # Client-side source code, can register blocks, actions, fields, etc.
│  └─ server/            # Server-side source code, can register resources, events, commands, etc.
```

## Directory Conventions and Loading Order

NocoBase scans the following directories by default to load plugins:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugins under development (highest priority)
└── storage/
    └── plugins/          # Compiled plugins, e.g., uploaded or published plugins
```

- `packages/plugins`: Used for local plugin development, supporting real-time compilation and debugging.
- `storage/plugins`: Stores compiled plugins, such as commercial editions or third-party plugins.

## Plugin Lifecycle and States

A plugin typically goes through the following stages:

1. **Create**: Create a plugin template via CLI.
2. **Pull**: Download the plugin package locally, but it is not yet written to the database.
3. **Enable**: On its first enablement, it executes "register + initialize"; subsequent enablements only load the logic.
4. **Disable**: Stop the plugin from running.
5. **Remove**: Completely remove the plugin from the system.

:::tip

- `pull` only downloads the plugin package; the actual installation process is triggered by the first `enable`.
- If a plugin is only `pull`ed but not enabled, it will not be loaded.

:::

### CLI Command Examples

```bash
# 1. Create plugin skeleton
yarn pm create @my-project/plugin-hello

# 2. Pull plugin package (download or link)
yarn pm pull @my-project/plugin-hello

# 3. Enable plugin (auto-installs on first enablement)
yarn pm enable @my-project/plugin-hello

# 4. Disable plugin
yarn pm disable @my-project/plugin-hello

# 5. Remove plugin
yarn pm remove @my-project/plugin-hello
```

## Plugin Management Interface

Access the plugin manager in the browser to view and manage plugins intuitively:

**Default URL:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Plugin Manager](https://static-docs.nocobase.com/20251030195350.png)

