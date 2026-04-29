---
title: "Plugin Project Structure"
description: "NocoBase plugin project structure: Yarn Workspace, packages/plugins, storage, client/server directories, lerna.json configuration."
keywords: "project structure,Yarn Workspace,packages/plugins,plugin directory,create-nocobase-app,NocoBase"
---

# Project Structure

Whether you clone the source code from Git or initialize a project using `create-nocobase-app`, the generated NocoBase project is essentially a **Yarn Workspace**-based monorepo.

## Top-Level Directory Overview

The following uses `my-nocobase-app/` as the project directory. There may be slight differences in different environments:

```bash
my-nocobase-app/
├── packages/              # Project source code
│   ├── plugins/           # Plugins under development (uncompiled)
├── storage/               # Runtime data and dynamically generated content
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Compiled plugins (including those uploaded via UI)
│   └── tar/               # Plugin package files (.tar)
├── scripts/               # Utility scripts and tool commands
├── .env*                  # Environment variable configurations for different environments
├── lerna.json             # Lerna workspace configuration
├── package.json           # Root package configuration, declares workspace and scripts
├── tsconfig*.json         # TypeScript configurations (frontend, backend, path mapping)
├── vitest.config.mts      # Vitest unit test configuration
└── playwright.config.ts   # Playwright E2E test configuration
```

## packages/ Subdirectory Description

The `packages/` directory contains NocoBase's core modules and extensible packages. The specific content depends on the project source:

- **Projects created via `create-nocobase-app`**: By default, it only includes `packages/plugins/`, used to store custom plugin source code. Each subdirectory is an independent npm package.
- **Cloned official source repository**: You can see more subdirectories, such as `core/`, `plugins/`, `pro-plugins/`, `presets/`, etc., corresponding to framework core, built-in plugins, and official preset solutions.

Regardless of the case, `packages/plugins` is the main location for developing and debugging custom plugins.

## storage/ Runtime Directory

`storage/` stores runtime-generated data and build outputs. Common subdirectories are described below:

- `apps/`: Configuration and cache for multi-app scenarios.
- `logs/`: Runtime logs and debug output.
- `uploads/`: User-uploaded files and media resources.
- `plugins/`: Packaged plugins uploaded via UI or imported via CLI.
- `tar/`: Compressed plugin packages generated after executing `yarn build <plugin> --tar`.

:::tip

It's usually recommended to add the `storage` directory to `.gitignore` and handle it separately during deployment or backup.

:::

## Environment Configuration and Project Scripts

- `.env`, `.env.test`, `.env.e2e`: Used for local development, unit/integration testing, and end-to-end testing respectively.
- `scripts/`: Stores common maintenance scripts, such as database initialization, release utilities, etc.

## Plugin Loading Paths and Priority

Plugins may exist in multiple locations. NocoBase loads them in the following priority order when starting:

1. Source code version in `packages/plugins` (for local development and debugging).
2. Packaged version in `storage/plugins` (uploaded via UI or imported via CLI).
3. Dependency packages in `node_modules` (installed via npm/yarn or framework built-in).

If a plugin with the same name exists in both the source directory and the packaged directory, NocoBase will prioritize loading the source version, facilitating local overrides and debugging.

## Plugin Directory Template

Create a plugin using the CLI:

```bash
yarn pm create @my-project/plugin-hello
```

The generated directory structure is as follows:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Build output (generated as needed)
├── src/                     # Source code directory
│   ├── client-v2/           # Frontend code (blocks, pages, models, etc.)
│   │   ├── plugin.ts        # Client-side plugin main class
│   │   └── index.ts         # Client-side entry
│   ├── locale/              # Multi-language resources (shared between frontend and backend)
│   ├── swagger/             # OpenAPI/Swagger documentation
│   └── server/              # Server-side code
│       ├── collections/     # Collection definitions
│       ├── commands/        # Custom commands
│       ├── migrations/      # Database migration scripts
│       ├── plugin.ts        # Server-side plugin main class
│       └── index.ts         # Server-side entry
├── index.ts                 # Frontend and backend bridge export
├── client-v2.d.ts           # Frontend type declarations
├── client-v2.js             # Frontend build artifact
├── server.d.ts              # Server-side type declarations
├── server.js                # Server-side build artifact
├── .npmignore               # Publish ignore configuration
└── package.json
```

:::tip

After the build completes, the `dist/` directory and `client-v2.js`, `server.js` files will be loaded when the plugin is enabled. During development, you only need to modify the `src/` directory. Before publishing, execute `yarn build <plugin>` or `yarn build <plugin> --tar`.

:::

## Related Links

- [Write Your First Plugin](./write-your-first-plugin.md) — Create a plugin from scratch and experience the complete development workflow
- [Server-side Development Overview](./server/index.md) — Overall introduction and core concepts of server-side plugins
- [Client-side Development Overview](./client/index.md) — Overall introduction and core concepts of client-side plugins
- [Build and Package](./build.md) — Plugin build, packaging, and distribution workflow
- [Dependency Management](./dependency-management.md) — Plugin dependency declarations and management

