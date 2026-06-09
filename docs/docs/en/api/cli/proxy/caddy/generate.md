---
title: "nb proxy caddy generate"
description: "nb proxy caddy generate command reference: generate or refresh the Caddy config for one CLI-managed env."
keywords: "nb proxy caddy generate,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy generate

Generate or refresh the Caddy entry config for one CLI-managed env.

## Usage

```bash
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI-managed env name to generate the config for |
| `--host` | string | Host written into the site address, such as `app1.example.com` |
| `--port` | string | Listen port written into the site address, such as `8080` |

## Generated files

Using env `test2` as an example, the command typically maintains these files and directories:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html`

In the current design, `app.caddy` is already the complete site config for one env and is no longer split into a separate `generated.caddy` file.

## Examples

```bash
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy generate --env demo --host demo.local.nocobase.com --port 8080
```

## Notes

- `generate` only writes or refreshes config and does not automatically start Caddy
- Regenerating config overwrites `app.caddy` as a whole
- If you change settings such as `app-port` or `app-public-path` with `nb env update`, you will usually need to rerun this command
- Only CLI-managed `local` or `docker` envs can use this command

## Related commands

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy reload`](./reload.md)
- [`nb env update`](../../env/update.md)
