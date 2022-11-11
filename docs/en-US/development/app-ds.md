# App directory structure

Either [Git source](/welcome/getting-started/installation/git-clone) or [create-nocobase-app](/welcome/getting-started/installation/create-nocobase-app), the directory structure of the created NocoBase application is the same, with the following structure.

```bash
├── my-nocobase-app
  ├── packages # NocoBase uses the Monorepo approach to manage code, dividing different modules into different packages
    ├── app
      ├── client # client-side module
      ├── server # server-side modules
    ├─ plugins # plugin directory
  ├── storage # for database files, attachments, cache, etc.
    ├─ db
  ├── .env # environment variables
  ├── .buildrc.ts # package configuration for packages, supports cjs, esm and umd packages.
  ├── jest.config.js
  ├── jest.setup.ts
  ├── lerna.json
  ├── package.json
  ├── tsconfig.jest.json
  ├─ tsconfig.json
  ├── tsconfig.server.json
```

## Packages directory

```bash
├─ packages
  ├─ app
    ├── client
      ├─ public
      ├─ src
        ├─ pages
          ├─ index.tsx
      ├─ .umirc.ts
      ├─ package.json
    ├─ server
      ├─ src
        ├─ config
        ├─ index.ts
      ├─ package.json
  ├─ /plugins
    ├─ my-plugin
      ├─ src
      ├─ package.json
```

NocoBase uses the Monorepo approach to manage code, dividing different modules into different packages.

- `app/client` is the client module of the application, built on [umi](https://umijs.org/zh-CN).
- `app/server` is the server-side module of the application.
- The `plugins/*` directory can hold various plugins.

## storages directory

Store database files, attachments, cache, etc.

## .env files

Environment variables.

## .buildrc.ts file

Package configuration for packages, supporting cjs, esm and umd formats.
