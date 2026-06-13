---
title: "nb proxy caddy reload"
description: "nb proxy caddy reload command reference: reload the Caddy config with the current driver."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Reload the Caddy config with the current driver.

## Usage

```bash
nb proxy caddy reload
```

## Examples

```bash
nb proxy caddy reload
```

## Notes

- This command is typically used after you regenerate the config
- `reload` requires Caddy to already be running; if it is not running yet, use `nb proxy caddy start` first
- The local driver reloads local Caddy, and the Docker driver reloads Caddy inside the container

## Related commands

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
