# NocoBase CTL

NocoBase CTL is a command-line tool for managing and controlling NocoBase applications. Its relationship with multiple NocoBase App instances is shown below:

```
                        +----------------------+
                        |     NocoBase CTL     |
                        |      Controller     |
                        +----------------------+
                                   |
                  +----------------+----------------+
                  |                |                |
                  v                v                v
        +----------------+ +----------------+ +----------------+
        |  NocoBase App  | |  NocoBase App  | |  NocoBase App  |
        |      Dev       | |      Test      | |      Prod      |
        +----------------+ +----------------+ +----------------+
```

NocoBase CTL combines:

- built-in commands for environment management and generic resource access
- runtime-generated commands loaded from your NocoBase application's Swagger schema

This allows the CLI to stay aligned with the target application instead of relying on a fixed command list.

## Quick Start

Install NocoBase CTL globally:

```bash
npm install -g @nocobase/ctl@latest
```

Add an environment:

```bash
nb env add local --base-url http://localhost:13000/api
```

Add an environment with an API key:

```bash
nb env add local --base-url http://localhost:13000/api --auth-type token --token <api-key>
```

Authenticate an environment with OAuth:

```bash
nb env auth local
```

Show the current environment:

```bash
nb env
```

List configured environments:

```bash
nb env list
```

Switch the current environment:

```bash
nb env use local
```

Update the runtime command cache from `swagger:get`:

```bash
nb env update
nb env update local
```

Use the generic resource commands:

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
```

## Runtime Commands

When you execute a runtime command, the CLI will:

1. resolve the target environment
2. read the application's Swagger schema from `swagger:get`
3. generate or reuse a cached runtime command set for that application version
4. execute the requested command

If the `API documentation plugin` is disabled, the CLI will prompt to enable it.

## Environment Selection

`nb env update` and `nb env auth` take an optional environment name as the first argument (omit it to use the current env):

```bash
nb env update prod
nb env auth prod
```

Use `-e, --env` on **runtime / API** commands to temporarily select an environment:

```bash
nb api resource list --resource users -e prod
```

This does not change the current environment unless you explicitly run:

```bash
nb env use <name>
```

## Config Scope

The `env` command supports two config scopes:

- `project`: use `./.nocobase-ctl` in the current working directory
- `global`: use the global `.nocobase-ctl` directory

Use `-s, --scope` to select one explicitly:

```bash
nb env list -s project
nb env add prod -s global --base-url http://example.com/api --auth-type token --token <api-key>
nb env auth prod -s global
nb env use local -s project
```

If you do not pass `--scope`, the CLI uses automatic resolution:

1. current working directory if `./.nocobase-ctl` exists
2. `NOCOBASE_HOME_CLI`
3. your home directory

## Built-in Commands

Current built-in topics:

- `env`
- `api`

Check available commands at any time:

```bash
nb --help
nb env --help
nb api resource --help
```

## Common Flags

- `-e, --env`: temporary environment selection
- `-s, --scope`: config scope for `env` commands
- `--role`: role override, sent as `X-Role`
- `-t, --token`: API key override
- `-j, --json-output`: print raw JSON response

Example:

```bash
nb env update prod -s global
nb api resource list --resource users -e prod -j
nb api resource list --resource users -e prod --role admin
```

## Local Data

The CLI stores its local state in `.nocobase-ctl`, including:

- `config.json`: environment definitions and current selection
- `versions/<version>/commands.json`: cached runtime commands for a generated version
