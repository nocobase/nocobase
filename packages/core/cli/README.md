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
nocobase-ctl env add --name local --base-url http://localhost:13000/api
```

Add an environment with an API key:

```bash
nocobase-ctl env add --name local --base-url http://localhost:13000/api --token <api-key>
```

Authenticate an environment with OAuth:

```bash
nocobase-ctl env auth -e local
```

Show the current environment:

```bash
nocobase-ctl env
```

List configured environments:

```bash
nocobase-ctl env list
```

Switch the current environment:

```bash
nocobase-ctl env use local
```

Update the runtime command cache from `swagger:get`:

```bash
nocobase-ctl env update
nocobase-ctl env update -e local
```

Use the generic resource commands:

```bash
nocobase-ctl resource list --resource users
nocobase-ctl resource get --resource users --filter-by-tk 1
nocobase-ctl resource create --resource users --values '{"nickname":"Ada"}'
```

## Runtime Commands

When you execute a runtime command, the CLI will:

1. resolve the target environment
2. read the application's Swagger schema from `swagger:get`
3. generate or reuse a cached runtime command set for that application version
4. execute the requested command

If the `API documentation plugin` is disabled, the CLI will prompt to enable it.

## Environment Selection

Use `-e, --env` to temporarily select an environment:

```bash
nocobase-ctl env update -e prod
nocobase-ctl resource list --resource users -e prod
```

This does not change the current environment unless you explicitly run:

```bash
nocobase-ctl env use <name>
```

## Config Scope

The `env` command supports two config scopes:

- `project`: use `./.nocobase-ctl` in the current working directory
- `global`: use the global `.nocobase-ctl` directory

Use `-s, --scope` to select one explicitly:

```bash
nocobase-ctl env list -s project
nocobase-ctl env add -s global --name prod --base-url http://example.com/api --token <api-key>
nocobase-ctl env auth -e prod -s global
nocobase-ctl env use local -s project
```

If you do not pass `--scope`, the CLI uses automatic resolution:

1. current working directory if `./.nocobase-ctl` exists
2. `NOCOBASE_HOME_CLI`
3. your home directory

## Built-in Commands

Current built-in topics:

- `env`
- `resource`

Check available commands at any time:

```bash
nocobase-ctl --help
nocobase-ctl env --help
nocobase-ctl resource --help
```

## Common Flags

- `-e, --env`: temporary environment selection
- `-s, --scope`: config scope for `env` commands
- `--role`: role override, sent as `X-Role`
- `-t, --token`: API key override
- `-j, --json-output`: print raw JSON response

Example:

```bash
nocobase-ctl env update -e prod -s global
nocobase-ctl resource list --resource users -e prod -j
nocobase-ctl resource list --resource users -e prod --role admin
```

## Local Data

The CLI stores its local state in `.nocobase-ctl`, including:

- `config.json`: environment definitions and current selection
- `versions/<version>/commands.json`: cached runtime commands for a generated version
