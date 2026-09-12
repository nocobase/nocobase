---
title: "nb proxy nginx reload"
description: "nb proxy nginx reload command reference: reload the Nginx config with the current driver."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Reload the Nginx config with the current driver.

## Usage

```bash
nb proxy nginx reload
```

## Examples

```bash
nb proxy nginx reload
```

## Notes

- This command is typically used after you regenerate the config
- `reload` requires Nginx to already be running; if it is not running yet, use `nb proxy nginx start` first
- The local driver reloads local Nginx, and the Docker driver reloads Nginx inside the container

## Related commands

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
