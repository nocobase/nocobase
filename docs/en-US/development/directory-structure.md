# Directory structure

## Application scaffolding

```bash
$ yarn create nocobase-app my-nocobase-app
```

The directory structure of the application scaffold created by `create-nocobase-app` is as follows

```bash
├── my-nocobase-app
  ├── packages        # Use the Monorepo approach to manage code, dividing different modules into packages
    ├── app
      ├── client      # Client-side modules
      ├── server      # Server-side modules
    ├── plugins       # Plugins directory
  ├── storage        # For database files, attachments, cache, etc.
    ├── db
  ├── .env            # Environment variables
  ├── .buildrc.ts     # Packaging configuration for packages, supports cjs, esm and umd packaging.
  ├── jest.config.js
  ├── jest.setup.ts
  ├── lerna.json
  ├── package.json
  ├── tsconfig.jest.json
  ├── tsconfig.json
  ├── tsconfig.server.json
```

### packages directory

```bash
├── packages
  ├── app
    ├── client
      ├── public
      ├── src
        ├── pages
          ├── index.tsx
      ├── .umirc.ts
      ├── package.json
    ├── server
      ├── src
        ├── config
        ├── index.ts
      ├── package.json
  ├── /plugins
    ├── my-plugin
      ├── src
      ├── package.json
```

NocoBase uses the Monorepo approach to manage the code, dividing the different modules into different packages.

- `app/client` is the client-side module of the application, built on [umi](https://umijs.org).
- `app/server` is the server-side module of the application.
- `plugins/*` directory can hold various plugins.

### storages directory

Used to store database files, attachments, cache, etc.

### .env file

Environment variables

### .buildrc.ts file

Packaging configuration for packages, supports cjs, esm and umd packaging.

## Plugins scaffolding

```bash
$ yarn nocobase create-plugin my-plugin
```

The plugin scaffolding directory initialized by `nocobase create-plugin` is as follows

```bash
├── my-nocobase-app
  ├── packages
    ├── plugins
      ├── my-plugin
        ├── src
          ├── client
          ├── server
        ├── package.json
```
