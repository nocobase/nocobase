# Caddy

If you already have a domain and want to get HTTPS running quickly, Caddy is usually the easiest choice. Compared with maintaining Nginx certificate config yourself, Caddy is more like the shortcut path for getting the entry layer online first.

The default recommendation is to run `nb env proxy caddy` directly.

## When Caddy is usually the better fit

These cases usually favor Caddy first:

- You already have a domain and want HTTPS quickly
- You do not want to maintain too many certificate and TLS details yourself
- You only need a simple and stable entry layer

If you already use Nginx across the server to manage many sites, or you still need heavier caching, access control, and custom rules, [Nginx](./nginx.md) is usually the better fit.

## Default path: let the CLI generate the Caddy config

If your app has already been saved as a CLI env and the env type is `local` or `docker`, the default recommendation is still to let the CLI generate the config. That way, routing details related to NocoBase paths, WebSocket handling, and subpaths stay managed by the CLI, and you only need to care about the site entry itself.

The most direct form is:

```bash
nb env proxy caddy --env demo --host demo.example.com
```

If you have already switched to the current env, you can also omit `--env`:

```bash
nb env proxy caddy --host demo.example.com
```

If you also want to specify the entry port, add it at the same time:

```bash
nb env proxy caddy --env demo --host demo.example.com --port 8080
```

`--host` is important here. Caddy decides whether to manage HTTPS based on the site address. In production, try to pass a domain that already resolves to the current server.

### Which files the CLI generates

If you do not pass `--output`, the Caddy provider keeps three layers of files under `~/.nocobase/proxy/caddy/<env>/`:

| File | Purpose |
| --- | --- |
| `generated.caddy` | The actual reverse-proxy config managed by the CLI and overwritten every time you run `nb env proxy caddy` |
| `app.caddy` | Editable site entry file where you can add site-level config |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | Shared main config that imports every env `app.caddy` |

Where:

- `generated.caddy` is only meant to be managed by the CLI and should not be edited manually
- `app.caddy` is editable, but you should keep the generated import inserted by the CLI
- `nocobase.caddy` is mainly used by `--install`

:::warning Note

If you need to add site-level Caddy config such as extra headers, authentication, rate limiting, or compression rules, edit `app.caddy`. `generated.caddy` will be overwritten the next time you run `nb env proxy caddy`.

:::

### Install the shared config into Caddy and reload it

If you want the CLI to connect the shared config to the Caddy main config and immediately validate and reload Caddy, run:

```bash
nb env proxy caddy --env demo --host demo.example.com --install --reload
```

These flags are split like this:

- `--install` connects `~/.nocobase/proxy/caddy/nocobase.caddy` to the Caddy main config
- `--reload` validates the config first and then reloads Caddy

If your Caddy executable is not on the default path, set the CLI config first:

```bash
nb config set bin.caddy /usr/bin/caddy
```

### When should you change `proxy.nb-cli-root`

Most setups do not need to change `proxy.nb-cli-root`. You usually need it only when Caddy runs in another container, mount root, or path view and cannot see the current user's `~/.nocobase` path.

For example, if Caddy sees that path as `/workspace/.nocobase/...` inside a container, set:

```bash
nb config set proxy.nb-cli-root /workspace
nb env proxy caddy --env demo --install --reload
```

If you only want to preview the generated result, use:

```bash
nb env proxy caddy --env demo --print
```

If you want to write the generated route fragment to a custom file, use:

```bash
nb env proxy caddy --env demo --output ./generated.caddy
```

For the full parameter reference, see [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md).

## Handwritten config: what to do without the CLI

If your app is not managed by the CLI, or you explicitly want to maintain the full `Caddyfile` yourself, start with this minimal version:

```text
your-domain.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:13000
}
```

Where:

- Replace `your-domain.com` with your domain
- Replace `127.0.0.1:13000` with the real address your NocoBase app listens on

If the domain already resolves to the current server correctly, Caddy usually handles HTTPS certificate issuance and renewal automatically.

If you do not have a domain yet and only want to verify the reverse-proxy chain first, you can listen on a port:

```text
:80 {
  reverse_proxy 127.0.0.1:13000
}
```

In production, though, it is still better to switch to a domain-based site address as soon as possible so Caddy can also take over HTTPS.

If your app is not mounted at `/` but under a subpath, handwritten Caddy config also means you need to confirm application variables such as `APP_PUBLIC_PATH` and `WS_PATH`. In that case, it is usually easier to go back to `nb env proxy caddy` and let the CLI generate the config.

## Validate and reload the config

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

If you do not manage Caddy with `systemd`, use your own startup and reload workflow.

## Notes

- `nb env proxy caddy` only works for CLI-managed envs whose runtime is reachable from the current machine, which means `local` or `docker`
- If the command says the env is missing `appPort`, run `nb env update <name> --app-port <port>` first
- `--output` and `--print` are useful for preview or custom integration, but they do not additionally create `app.caddy` or the shared main config
- If you already have a domain that resolves correctly to the server, Caddy is often the fastest way to get HTTPS working

## Related links

- [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- [Install with CLI (Recommended)](../../installation/cli.md)
- [Install with Docker Compose](../../installation/docker-compose.md)
- [App Environment Variables](../../installation/env.md)
