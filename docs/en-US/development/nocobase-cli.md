---
order: 2
---

# NocoBase CLI

NocoBase CLI is designed to help you develop, build, and deploy NocoBase applications.

<Alert>

NocoBase CLI supports both ts-node and node modes

- ts-node mode (default): used for development environment, supports real-time compilation, but slow response
- node mode: for production environment, fast response, but need to execute `yarn nocobase build` to compile all source code first

</Alert>

## Instructions

```bash
$ yarn nocobase -h

Usage: nocobase [command] [options]

Options:
  -h, --help

Commands:
  create-plugin         Create plugin scaffolding
  console
  db:auth               Verify that the database connection is successful
  db:sync               Generate relevant data tables and fields from collections configuration
  install               Install
  start                 Start the application in the production environment
  build                 Compile and package
  clean                 Delete the compiled files
  dev                   Start the application for the development environment and supports live compilation
  doc                   Documentation development
  test                  Test
  umi
  upgrade               Upgrade
  help
```

## Use in scaffolding

The `scripts` in the application scaffolding `package.json` are as follows

```json
{
  "scripts": {
    "dev": "nocobase dev",
    "start": "nocobase start",
    "clean": "nocobase clean",
    "build": "nocobase build",
    "test": "nocobase test",
    "postinstall": "nocobase umi generate tmp"
  }
}
```

## Extensions

NocoBase CLI is built on [commander](https://github.com/tj/commander.js), you can freely extend the command, the extended command can be written in `app/server/index.ts`.

```ts
const app = new Application(config);

app.command('hello').action(() => {});
```

Alternatively, write in the plugin.

```ts
class MyPlugin extends Plugin {
  beforeLoad() {
    this.app.command('hello').action(() => {});
  }
}
```

Terminal runs

```bash
$ yarn nocobase hello
```

## Built-in command line

Sort by frequency of use

### `dev`

Start the application in the development environment and the code is compiled in real time.

<Alert>
NocoBase will be installed automatically if it is not installed (refer to the install command)
</Alert>

```bash
Usage: nocobase dev [options]

Options:
  -p, --port [port]
  --client
  --server
  -h, --help
```

Example

```bash
# Start application for development environment, live compile
yarn nocobase dev
# Start only the server side
yarn nocobase dev --server
# Start only the client side
yarn nocobase dev --client
```

### `start`

Start the application in a production environment, the code needs to be yarn build.

<Alert>

- NocoBase will be installed automatically if it is not installed (refer to the install command)
- If the source code has been modified, it needs to be repackaged (refer to the build command)

</Alert>

```bash
$ yarn nocobase start -h

Usage: nocobase start [options]

Options:
  -p, --port
  -s, --silent
  -h, --help
```

Example

```bash
# Start the application in a production environment
yarn nocobase start
```

### `install`

Install

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

Example

```bash
# Initial Installation
yarn nocobase install -l en-US -e admin@nocobase.com -p admin123
# Delete all data tables of NocoBase and reinstall
yarn nocobase install -f -l en-US -e admin@nocobase.com -p admin123
# Empty the database and reinstall
yarn nocobase install -c -l en-US -e admin@nocobase.com -p admin123
```

<Alert>

Difference between `-f/--force` and `-c/--clean`
- `-f/--force` Delete all data tables of NocoBase
- `-c/--clean` Delete all data tables of the database

</Alert>

### `upgrade`

Upgrade

```bash
yarn nocobase upgrade
```

### `test`

jest tests, supports all [jest-cli](https://jestjs.io/docs/cli) options, and extends `-c, --db-clean` support in addition.

```bash
$ yarn nocobase test -h

Usage: nocobase test [options]

Options:
  -c, --db-clean        Empty the database before running all tests
  -h, --help
```

Example

```bash
# Run all test files
yarn nocobase test
# Run all test files in the specified folder
yarn nocobase test packages/core/server
# Run all tests in the specified file
yarn nocobase test packages/core/database/src/__tests__/database.test.ts

# Empty the database before running tests
yarn nocobase test -c
yarn nocobase test packages/core/server -c
```

### `build`

Before deployed to the production environment, the source code needs to be compiled and packaged. It needs to be rebuilt if there are changes to the code.

```bash
# All packages
yarn nocobase build
# Specified package
yarn nocobase build app/server app/client
```

### `clean`

Delete the compiled file

```bash
yarn clean
# Equivalent to
yarn rimraf -rf packages/*/*/{lib,esm,es,dist}
```

### `doc`

Documentation development

```bash
# Start documentation
yarn doc  --lang=en-US # Equivalent to yarn doc dev
# Build the documentation and output it to . /docs/dist/ directory by default 
yarn doc build
# View the final result of the document output by dist
yarn doc serve --lang=en-US
```

### `db:auth`

Verify that the database is successfully connected

```bash
$ yarn nocobase db:auth -h

Usage: nocobase db:auth [options]

Options:
  -r, --retry [retry]   retry times
  -h, --help
```

### `db:sync`

Generate data tables and fields via collections configuration

```bash
$ yarn nocobase db:sync -h

Usage: nocobase db:sync [options]

Options:
  -f, --force
  -h, --help   display help for command
```

### `umi`

`app/client` is built based on [umi](https://umijs.org/) and can be used to execute other related commands via `nocobase umi`.

```bash
# Generate the .umi cache required by the development environment
yarn nocobase umi generate tmp
```

### `help`

The help command, also available with the option parameter, `-h` and `--help`

```bash
# View all cli
yarn nocobase help
# You can also use -h
yarn nocobase -h
# or --help
yarn nocobase --help
# Option to view the db:sync command
yarn nocobase db:sync -h
```
