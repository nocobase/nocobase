# Develop the first plugin

Before start, you need to install NocoBase:.

- [create-nocobase-app installation](/welcome/getting-started/installation/create-nocobase-app)
- [Git source installation](/welcome/getting-started/installation/git-clone)

Once NocoBase is installed, we can start our plugin development journey.

## Create a plugin

First, you can quickly create an empty plugin via the CLI with the following command.

```bash
yarn pm create hello
```

The directory where the plugin is located ``packages/plugins/hello`` and the plugin directory structure is

```bash
|- /hello
  |- /src
    |- /client # plugin client code
    |- /server # plugin server code
  |- client.d.ts
  |- client.js
  |- package.json # plugin package information
  |- server.d.ts
  |- server.js
package.json

package.json information

```json
{
  "name": "@nocobase/plugin-hello",
  "version": "0.1.0",
  "main": "lib/server/index.js",
  "devDependencies": {
    "@nocobase/client": "0.8.0-alpha.1",
    "@nocobase/test": "0.8.0-alpha.1"
  }
}
```

A NocoBase plugin is also an NPM package, the correspondence rule between plugin name and NPM package name is `${PLUGIN_PACKAGE_PREFIX}-${pluginName}`.

`PLUGIN_PACKAGE_PREFIX` is the plugin package prefix, which can be customized in .env, [click here for PLUGIN_PACKAGE_PREFIX description](/api/env#plugin_package_prefix).

## Code the plugin

Look at the `packages/plugins/hello/src/server/plugin.ts` file and modify it to

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class HelloPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection({
      name: 'hello',
      fields: [
        { type: 'string', name: 'name' }
      ],
    });
    this.app.acl.allow('hello', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default HelloPlugin;
```

## Register the plugin

```bash
yarn pm add hello
```

## Activate the plugin

When the plugin is activated, the hello table that you just configured is automatically created.

```bash
yarn pm enable hello
```

## Start the application

```bash
# for development
yarn dev

# for production
yarn build
yarn start
```

## Experience the plugin

Insert data into the hello table of the plugin

```bash
curl --location --request POST 'http://localhost:13000/api/hello:create' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Hello world"
}'
```

View the data

```bash
curl --location --request GET 'http://localhost:13000/api/hello:list'
```
