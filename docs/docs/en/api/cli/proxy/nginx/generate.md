---
title: "nb proxy nginx generate"
description: "nb proxy nginx generate command reference: generate or refresh the Nginx config for one CLI-managed env."
keywords: "nb proxy nginx generate,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx generate

Generate or refresh the Nginx entry config for one CLI-managed env.

## Usage

```bash
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | CLI-managed env name to generate the config for |
| `--host` | string | Host written into the entry config, such as `app1.example.com` |
| `--port` | string | Listen port written into the entry config, such as `8080` |

## Generated files

Using env `test2` as an example, the command typically maintains these files and directories:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/nocobase.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`

The generated Nginx entry covers these main capability areas:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

## Examples

```bash
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx generate --env demo --host demo.local.nocobase.com --port 8080
```

## Notes

- `generate` only writes or refreshes config and does not automatically start Nginx
- `app.conf` is the editable entry file, but its managed block must stay intact
- If you change settings such as `app-port` or `app-public-path` with `nb env update`, you will usually need to rerun this command
- Only CLI-managed `local` or `docker` envs can use this command

## Related commands

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx reload`](./reload.md)
- [`nb env update`](../../env/update.md)
