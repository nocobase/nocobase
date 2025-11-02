# Project Directory Structure

Whether you clone the source code via Git or initialize a project using `create-nocobase-app`, the resulting NocoBase project is essentially a multi-package repository based on **Yarn Workspace**.

## Top-Level Directory Overview

The following example uses `my-nocobase-app/` as the project directory. There might be minor differences in various environments.

```bash
my-nocobase-app/
├── packages/              # Project source code
│   ├── plugins/           # Plugin source code under development (uncompiled)
├── storage/               # Runtime data and dynamic artifacts
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Compiled plugins (including those uploaded from the interface)
│   └── tar/               # Plugin package files (.tar)
├── scripts/               # Utility scripts and tool commands
├── .env*                  # Environment-specific variable configurations
├── lerna.json             # Lerna workspace configuration
├── package.json           # Root package configuration, declares workspaces and scripts
├── tsconfig*.json         # TypeScript configuration (client, server, path mapping)
├── vitest.config.mts      # Vitest unit test configuration
└── playwright.config.ts   # Playwright E2E test configuration
```

## `packages/` Subdirectory

The `packages/` directory contains NocoBase's core modules and extensible packages. Its content depends on the project's origin:

- **Projects created with `create-nocobase-app`**: By default, only `packages/plugins/` is included for placing custom plugin source code. Each subdirectory is an independent npm package.
- **Cloning the official source code repository**: You will see more subdirectories, such as `core/`, `plugins/`, `pro-plugins/`, and `presets/`, which correspond to the framework core, built-in plugins, and official presets.

Regardless of the method, `packages/plugins` is the primary location for developing and debugging custom plugins.

## `storage/` Runtime Directory

`storage/` stores data and build artifacts generated at runtime. Common subdirectories are explained below:

- `apps/`: Configurations and cache for multi-app scenarios.
- `logs/`: Runtime logs and debug output.
- `uploads/`: Files and media resources uploaded by users.
- `plugins/`: Packaged plugins uploaded via the interface or imported via CLI.
- `tar/`: Plugin tarballs generated after running `yarn build <plugin> --tar`.

> It is generally recommended to add the `storage` directory to `.gitignore` and handle it separately during deployment or backup.

## Environment Configuration and Project Scripts

- `.env`, `.env.test`, `.env.e2e`: Used for local execution, unit/integration testing, and end-to-end testing, respectively.
- `scripts/`: Stores common maintenance scripts (e.g., database initialization, release helper tools).

## Plugin Loading Paths and Priority

Plugins can exist in multiple locations. NocoBase loads them at startup according to the following priority:

1. Source code version in `packages/plugins` (for local development and debugging).
2. Packaged version in `storage/plugins` (uploaded via the interface or imported via CLI).
3. Dependency package in `node_modules` (installed via npm/yarn or built into the framework).

When a plugin with the same name exists in both the source code directory and the packaged directory, the system prioritizes loading the source code version, which facilitates local overrides and debugging.

## Plugin Directory Template

Create a plugin using the CLI:

```bash
yarn pm create @my-project/plugin-hello
```

The generated directory structure is as follows:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Build artifacts (generated on demand)
├── src/                     # Source code directory
│   ├── client/              # Client-side code (blocks, pages, models, etc.)
│   │   ├── plugin.ts        # Client-side plugin main class
│   │   └── index.ts         # Client-side entry point
│   ├── locale/              # Locale resources (shared between client and server)
│   ├── swagger/             # OpenAPI/Swagger documentation
│   └── server/              # Server-side code
│       ├── collections/     # Collection definitions
│       ├── commands/        # Custom commands
│       ├── migrations/      # Database migration scripts
│       ├── plugin.ts        # Server-side plugin main class
│       └── index.ts         # Server-side entry point
├── index.ts                 # Bridges client and server exports
├── client.d.ts              # Client-side type declarations
├── client.js                # Client-side build output
├── server.d.ts              # Server-side type declarations
├── server.js                # Server-side build output
├── .npmignore               # Publish ignore configuration
└── package.json
```

> After the build is complete, the `dist/`, `client.js`, and `server.js` files are loaded when the plugin is enabled.
> During development, you only need to modify the `src/` directory. Before publishing, run `yarn build <plugin>` or `yarn build <plugin> --tar`.