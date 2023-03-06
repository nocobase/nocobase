# NocoBase CLI

The NocoBase CLI is designed to help you develop, build, and deploy NocoBase applications.

<Alert>

NocoBase CLI supports <i>ts-node</i> and <i>node</i> two operation modes.

- ts-node mode (Default): Used for development environment, support real-time compilation, with relatively slow response
- node mode：Used for production environment, with quick response, but you need to execute `yarn nocobase build` to compile the entire source code first

</Alert>

## Instructions For Use

```bash
$ yarn nocobase -h

Usage: nocobase [command] [options]

Options:
  -h, --help

Commands:
  console
  db:auth               Verify if the database is successfully connected
  db:sync               Generate relevant data tables and fields through the configuration of collections
  install               Install
  start                 Start application in production environment
  build                 Compile and package
  clean                 Delete the compiled files
  dev                   Start application for development environment with real-time compilation
  doc                   Documentation development
  test                  Testing
  umi
  upgrade               Upgrade
  migrator              Data migration
  pm                    Plugin manager
  help
```

## Application in Scaffolding

`scripts` in the application scaffolding `package.json` is as below:

```json
{
  "scripts": {
    "dev": "nocobase dev",
    "start": "nocobase start",
    "clean": "nocobase clean",
    "build": "nocobase build",
    "test": "nocobase test",
    "pm": "nocobase pm",
    "postinstall": "nocobase postinstall"
  }
}
```

## Command Line Extensions

NocoBase CLI is built based on [commander](https://github.com/tj/commander.js). You can write the extended commands freely in `app/server/index.ts`:

```ts
const app = new Application(config);

app.command('hello').action(() => {});
```

or in the plugin:

```ts
class MyPlugin extends Plugin {
  beforeLoad() {
    this.app.command('hello').action(() => {});
  }
}
```

Run in the terminal:

```bash
$ yarn nocobase hello
```

## Built-in Commands

Sorted by frequency of use.

### `dev`

Start application and compile code in real time in development environment.

<Alert>
NocoBase is installed automatically if it is not installed (Refer to the `install` command).
</Alert>

```bash
Usage: nocobase dev [options]

Options:
  -p, --port [port]
  --client
  --server
  -h, --help
```

Example:

```bash
# Launch application for development environment, with real-time compilation
yarn nocobase dev
# Start the server side only
yarn nocobase dev --server
# Start the client side only
yarn nocobase dev --client
```

### `start`

Start application in production environment, the code needs <i>yarn build</i>.

<Alert>

- NocoBase is installed automatically if it is not installed (Refer to the `install` command).
- The source code needs to be re-packaged if it has any modification (Refer to the `build` command).

</Alert>

```bash
$ yarn nocobase start -h

Usage: nocobase start [options]

Options:
  -p, --port
  -s, --silent
  -h, --help
```

Example:

```bash
# Launch application for production environment
yarn nocobase start
```

### `install`

Install.

```bash
$ yarn nocobase install -h

Usage: nocobase install [options]

Options:
  -f, --force
  -c, --clean
  -s, --silent
  -l, --lang [lang]
  -e, --root-email <rootEmail>
  -p, --root-password <rootPassword>
  -n, --root-nickname [rootNickname]
  -h, --help
```

Example:

```bash
# Initial installation
yarn nocobase install -l zh-CN -e admin@nocobase.com -p admin123
# Delete all data tables from NocoBase and reinstall
yarn nocobase install -f -l zh-CN -e admin@nocobase.com -p admin123
# Clear database and reinstall
yarn nocobase install -c -l zh-CN -e admin@nocobase.com -p admin123
```

<Alert>

Difference between `-f/--force` and `-c/--clean`:
- `-f/--force` Delete data tables of NocoBase
- `-c/--clean` Clear database, all data tables are deleted

</Alert>

### `upgrade`

Upgrade.

```bash
yarn nocobase upgrade
```

### `test`

<i>jest</i> test, which supports all [jest-cli](https://jestjs.io/docs/cli) options, also supports `-c, --db-clean`.

```bash
$ yarn nocobase test -h

Usage: nocobase test [options]

Options:
  -c, --db-clean        Clear database before running all tests
  -h, --help
```

Example:

```bash
# Run all test files
yarn nocobase test
# Run all test files in the specified folder
yarn nocobase test packages/core/server
# Run all tests in the specified file
yarn nocobase test packages/core/database/src/__tests__/database.test.ts

# Clear database before running all tests
yarn nocobase test -c
yarn nocobase test packages/core/server -c
```

### `build`

The source code needs to be compiled and packaged before the code is deployed to the production environment; and you need to re-build the code if it has any modification.

```bash
# All packages
yarn nocobase build
# Specified packages
yarn nocobase build app/server app/client
```

### `clean`

Delete the compiled files.

```bash
yarn clean
# Equivalent to
yarn rimraf -rf packages/*/*/{lib,esm,es,dist}
```

### `doc`

Documentation development.

```bash
# Start the documentation
yarn doc  --lang=zh-CN # Equivalent to yarn doc dev
# Build the documentation, and output it to . /docs/dist/ directory by default
yarn doc build
# View the final result of the output documentation of dist
yarn doc serve --lang=zh-CN
```

### `db:auth`

Verify if the database is successfully connected.

```bash
$ yarn nocobase db:auth -h

Usage: nocobase db:auth [options]

Options:
  -r, --retry [retry]   Number of retries
  -h, --help
```

### `db:sync`

Generate relevant data tables and fields through the configuration of collections.

```bash
$ yarn nocobase db:sync -h

Usage: nocobase db:sync [options]

Options:
  -f, --force
  -h, --help   display help for command
```

### `migrator`

Data migration.

```bash
$ yarn nocobase migrator

Positional arguments:
  <command>
    up        Applies pending migrations
    down      Revert migrations
    pending   Lists pending migrations
    executed  Lists executed migrations
    create    Create a migration file
```

### `pm`

Plugin manager.

```bash
# Create plugin
yarn pm create hello
# Register plugin
yarn pm add hello
# Enable plugin
yarn pm enable hello
# Disable plugin
yarn pm disable hello
# Remove plugin
yarn pm remove hello
```

Not achieved yet:

```bash
# Upgrade plugin
yarn pm upgrade hello
# Publish plugin
yarn pm publish hello
```

### `umi`

`app/client` is built based on [umi](https://umijs.org/), you can run other relevant commands through `nocobase umi`.

```bash
# Generate the .umi cache needed for the development environment
yarn nocobase umi generate tmp
```

### `help`

The help command, you can also use the option parameter, `-h` and `--help`.

```bash
# View all cli
yarn nocobase help
# Use -h instead
yarn nocobase -h
# Or --help
yarn nocobase --help
# View options of command db:sync
yarn nocobase db:sync -h
```
