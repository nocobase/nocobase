# Project Directory Structure

Whether you clone the source code via Git or initialize a project using `create-nocobase-app`, the resulting NocoBase project is essentially a multi-package repository based on Yarn Workspace.

## Top-Level Directory Overview

The following example uses `my-nocobase-app/` as the root directory. There might be minor differences in various environments.

```text
my-nocobase-app/
├── packages/              # Project source code
│   ├── plugins/           # Plugin source code under development (uncompiled)
├── storage/               # Runtime data and dynamic artifacts
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Compiled plugins, including those uploaded from the interface
│   └── tar/               # Generated plugin tarballs
├── scripts/               # Common scripts and utility commands
├── .env*                  # Environment-specific variable configurations
├── lerna.json             # Lerna workspace configuration
├── package.json           # Root package configuration, declares workspaces and scripts
├── tsconfig*.json         # TypeScript configuration (client, server, path mapping)
├── vitest.config.mts      # Vitest test configuration
└── playwright.config.ts   # Playwright E2E configuration
```

## The `packages/` Subdirectory

The `packages/` directory houses NocoBase's core capabilities and extensible packages. Its actual content depends on the project's origin:

- **Projects created with `create-nocobase-app`**: By default, only `packages/plugins/` is provided for placing your own plugin source code. Structurally, each subdirectory is an independent npm package.
- **Cloning the official source code repository directly**: You will see more subdirectories like `core/`, `plugins/`, `pro-plugins/`, and `presets/`, which contain the framework core, built-in plugins, and official presets.

Regardless of the method, `packages/plugins` is the preferred location for developers to write and debug custom plugins.

## The `storage/` Runtime Directory

`storage/` stores data and build artifacts generated at runtime. The meanings of common subdirectories are as follows:

- `apps/`: Application configurations and cache in multi-app scenarios.
- `logs/`: Runtime logs, debug output.
- `uploads/`: Attachments and media resources uploaded by users.
- `plugins/`: Packaged plugins uploaded via the interface or pulled from a remote source (if installed).
- `tar/`: Plugin tarballs generated after running `yarn build <plugin> --tar` (appears after the command is executed).

> The `storage` directory is usually configured to be ignored by Git and requires separate handling during deployment or backup.

## Environment Configuration and Project Scripts

- `.env`, `.env.test`, `.env.e2e`: Environment variables for local execution, unit/integration testing, and end-to-end testing, respectively.
- `scripts/`: Maintenance scripts (e.g., database initialization, release helper scripts).

## Plugin Storage Paths and Priority

Plugins can exist in multiple directories simultaneously. NocoBase loads them according to the following priority at startup:

1. Source code version in `packages/plugins` (suitable for integrated development and debugging).
2. Packaged version in `storage/plugins` (uploaded via the interface or imported via CLI).
3. Dependency package in `node_modules` (installed via npm/yarn or built into the framework).

When a plugin with the same name exists in both the source code and packaged directories, the source code version is loaded with priority, making it convenient to override the live version locally for debugging.

## Single Plugin Directory Template

Initialize a plugin using the CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Example of the generated structure:

```text
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
├── index.ts                 # Default export (bridges client and server)
├── client.d.ts              # Client-side type declarations
├── client.js                # Client-side build output (generated after build)
├── server.d.ts              # Server-side type declarations
├── server.js                # Server-side build output (generated after build)
├── .npmignore               # Publish ignore configuration
└── package.json
```

> The `dist`, `client.js`, and `server.js` files generated after the build are loaded when the plugin is enabled. For daily development, you only need to modify the `src/` directory. Before publishing, run `yarn build <plugin>` or `yarn build <plugin> --tar`.