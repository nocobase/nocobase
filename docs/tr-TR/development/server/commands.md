# Commands

NocoBase Server Application is a powerful and extensible CLI tool in addition to being used as a WEB server.

Create a new `app.js` file with the following code.

```ts
const Application = require('@nocobase/server');

// omit the specific configuration here
const app = new Application({/*... */});

app.runAsCLI();
```

app.js run as ``runAsCLI()`` is a CLI,  it will work like this in the command line tool.

```bash
node app.js install # install
node app.js start # start
```

To better develop, build and deploy NocoBase applications, NocoBase has many built-in commands, see the [NocoBase CLI](/api/cli) section for details.

## How to customize Command?

NocoBase CLI is designed to be very similar to [Laravel Artisan](https://laravel.com/docs/9.x/artisan), both are extensible. NocoBase CLI is based on [commander](https://www.npmjs.com/ package/commander) implementation, which extends Command like this

```ts
export class MyPlugin extends Plugin {
  load() {
    this.app
      .command('echo')
      .option('--v, --version');
      .action(async ([options]) => {
        console.log('Hello World!');
        if (options.version) {
          console.log('Current version:', app.getVersion());
        }
      });
  }
}
```

This method defines the following command.

```bash
yarn nocobase echo
# Hello World!
yarn nocobase echo -v
# Hello World!
# Current version: 0.8.0-alpha.1
```

More API details can be found in the [Application.command()](/api/server/application#command) section.

## Example

### Defining a command for exporting collections

If we want to export the data in the application's collections to a JSON file, we can define a subcommand as follows.

```ts
import path from 'path';
import * as fs from 'fs/promises';

class MyPlugin extends Plugin {
  load() {
    this.app
      .command('export')
      .option('-o, --output-dir')
      .action(async (options, . .collections) => {
        const { outputDir = path.join(process.env.PWD, 'storage') } = options;
        await collections.reduce((promise, collection) => promise.then(async () => {
          if (!this.db.hasCollection(collection)) {
            console.warn('No such collection:', collection);
            return;
          }

          const repo = this.db.getRepository(collection);
          const data = repo.find();
          await fs.writeFile(path.join(outputDir, `${collection}.json`), JSON.stringify(data), { mode: 0o644 });
        }), Promise.resolve());
      });
  }
}
```

After registering and activating the plugin call from the command line.

```bash
mkdir -p . /storage/backups
yarn nocobase export -o . /storage/backups users
```

After execution, it will generate `. /storage/backups/users.json` file containing the data from the collections.

## Summary

The sample code covered in this chapter is integrated in the [packages/samples/command](https://github.com/nocobase/nocobase/tree/main/packages/samples/command) package and can be run directly locally to see the results.
