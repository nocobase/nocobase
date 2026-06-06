# Nginx

If you already use Nginx on the server to manage sites, or you still want to manage certificates, caching, or access control yourself, staying with Nginx is the most direct path. For CLI-managed NocoBase envs, this is also the default recommendation.

If you mainly want to get HTTPS running quickly and do not want to maintain many proxy details yourself, [Caddy](./caddy.md) is the easier path. But if Nginx is already part of your stack, this page is the default place to start.

## Confirm these two things first

- NocoBase is already reachable through an internal address such as `http://127.0.0.1:13000`
- You know whether this deployment is a CLI-managed env or a fully handwritten setup

Once those two things are clear, the next step is usually straightforward:

- If the app has already been saved as a CLI env and the env type is `local` or `docker`, use `nb env proxy nginx`
- If the app is not managed by the CLI, or you explicitly want to maintain the full Nginx config yourself, handwrite the `server` block

## Default path: let the CLI generate the Nginx config

If your app was installed, adopted, or saved through NocoBase CLI as a `local` or `docker` env, the default recommendation is to run `nb env proxy nginx`. `nb env proxy` itself is only a topic and does not generate configs. The CLI maintains the editable entry file, SPA fallback pages, shared main config, and shared snippets together, which makes it much less likely to miss WebSocket handling, subpaths, or later updates.

Start by generating a config for a specific env:

```bash
nb env proxy nginx --env demo
```

If you have already switched to the current env, you can also omit `--env`:

```bash
nb env proxy nginx
```

If you already know the public domain or entry port, you can write them at generation time:

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy nginx --env demo --host demo.example.com --port 8080
```

Here, `--port` is the proxy entry port, not the port the NocoBase app itself listens on. The upstream app port comes from the saved env `appPort`.

### Which files the CLI generates

The Nginx provider keeps these files under `~/.nocobase/proxy/nginx/`:

| File | Purpose |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | Editable site entry file. The CLI refreshes the managed block inside it, and you can add site-level config around that block |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | v1 SPA fallback page generated from the current active client's `index.html` |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | v2 SPA fallback page generated from the current active client's `v/index.html` |
| `~/.nocobase/proxy/nginx/nocobase.conf` | Shared main config that includes every env `app.conf` |
| `~/.nocobase/proxy/nginx/snippets/` | Shared snippets directory copied from built-in templates |

Where:

- `app.conf` is editable, but you should keep the managed block between `# BEGIN NocoBase managed config` and `# END NocoBase managed config`
- `index-v1.html` and `index-v2.html` automatically rewrite asset URLs according to the current env subpath, active client version, and `CDN_BASE_URL`
- `nocobase.conf` is mainly used by `--install`
- Files under `snippets/` and `public/` are usually not meant to be edited manually and will be resynced the next time you run the command

:::warning Note

If you need to add site-level Nginx config such as rate limits, extra headers, or access control, edit `app.conf`. Managed files under `public/` and `snippets/` will be overwritten the next time you run `nb env proxy nginx`.

:::

### Install the shared config into Nginx and reload it

If you want the CLI to connect the shared config to the Nginx main config and immediately validate and reload Nginx, run:

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

These flags are split like this:

- `--install` connects `~/.nocobase/proxy/nginx/nocobase.conf` to the Nginx main config
- `--reload` validates the config first and then reloads Nginx

If your Nginx executable is not on the default path, set the CLI config first:

```bash
nb config set bin.nginx /usr/sbin/nginx
```

### When should you change `proxy.nb-cli-root`

Most setups do not need to change `proxy.nb-cli-root`. You usually need it only when Nginx runs in another container, mount root, or path view and cannot see the current user's `~/.nocobase` path.

For example, if Nginx sees that path as `/workspace/.nocobase/...` inside a container, set:

```bash
nb config set proxy.nb-cli-root /workspace
nb env proxy nginx --env demo --install --reload
```

If you only want to preview the rendered `app.conf`, you can also use:

```bash
nb env proxy nginx --env demo --print
```

The Nginx provider does not support `--output`. For the full parameter reference, see [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md).

## Handwritten config: what to do without the CLI

If your app is not managed by the CLI, or you explicitly want to maintain the full Nginx config yourself, start with this minimal version. In most cases, one `server` block is enough.

Create a config file on the server, for example `/etc/nginx/conf.d/nocobase.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Where:

- Replace `server_name` with your domain
- Replace `127.0.0.1:13000` with the real address your NocoBase app listens on
- Adjust `client_max_body_size` to match your upload needs

If your app is not mounted at `/` but under a subpath such as `/app/`, handwritten configs also need you to confirm application variables such as `APP_PUBLIC_PATH` and `WS_PATH`. In that case, it is usually easier to go back to `nb env proxy nginx` and let the CLI handle the routing details.

## Validate and reload the config

```bash
nginx -t
systemctl reload nginx
```

If you do not manage Nginx with `systemd`, use your own reload workflow.

## How to handle HTTPS

If you have already decided to stay with Nginx, you can keep handling HTTPS there as well. A common next step is to expand `listen 80` into dual `80/443` entry points and add your certificate paths and TLS config.

But if you mainly want working HTTPS as quickly as possible and do not want to deal with certificate issuance and renewal yourself, switching to [Caddy](./caddy.md) is usually easier.

## Notes

- `nb env proxy nginx` only works for CLI-managed envs whose runtime is reachable from the current machine, which means `local` or `docker`
- If the command says the env is missing `appPort`, run `nb env update <name> --app-port <port>` first
- `nb env proxy nginx` does not support `--output`. If you only want to preview the entry file, use `--print`
- If you already have a large custom Nginx main config, the CLI-generated config usually fits best as a site fragment that you include, not as a replacement for the whole main config

## Related links

- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [Install with CLI (Recommended)](../../installation/cli.md)
- [Install with Docker Compose](../../installation/docker-compose.md)
- [App Environment Variables](../../installation/env.md)
