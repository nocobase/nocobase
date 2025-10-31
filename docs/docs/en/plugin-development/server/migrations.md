# Upgrade Script

During the update process, plugins may introduce incompatible changes. These changes can be handled by writing migration files, triggered by the `nocobase upgrade` command. The related process is as follows:

<img src="https://static-docs.nocobase.com/20250925225017.png" style="max-width: 800px; width: 800px;">

Upgrade migrations are divided into beforeLoad, afterSync, and afterLoad:

- beforeLoad: Executes before each module is loaded, divided into three stages:
  - Before the core module is loaded
  - Before preset plugins are loaded
  - Before other plugins are loaded
- afterSync: Executes after collection configurations are synchronized with the database, divided into three stages:
  - After core collections are synchronized with the database
  - After preset plugin collections are synchronized with the database
  - After other plugin collections are synchronized with the database
- afterLoad: Executes after the entire application is loaded

## Create a migration file

Create a migration file using the create-migration command.

```bash
yarn nocobase create-migration -h

Usage: nocobase create-migration [options] <name>

Options:
  --pkg <pkg>  package name
  --on [on]    Options include beforeLoad, afterSync and afterLoad
  -h, --help   display help for command
```

Example

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client

2024-01-07 17:33:13 [info ] add app main into supervisor     
2024-01-07 17:33:13 [info ] migration file in /nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
✨  Done in 5.02s.
```

This will generate a migration file named 20240107173313-update-ui.ts in the src/server/migrations directory of the @nocobase/plugin-client plugin package. The initial content is as follows:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // coding
  }
}
```

## Trigger a migration

Triggered by the `nocobase upgrade` command.

```bash
$ yarn nocobase upgrade
```

## Test a migration

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('test example', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // plugin
      version: '0.18.0-alpha.5', // version before upgrade
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('case1', async () => {
    await app.runCommand('upgrade');
    // coding...
  });
});
```