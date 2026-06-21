---
title: "nb proxy caddy restart"
description: "nb proxy caddy restart command reference: restart the Caddy proxy with the current driver."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

Restart the Caddy proxy with the current driver.

## Usage

```bash
nb proxy caddy restart
```

## Examples

```bash
nb proxy caddy restart
```

## Notes

- This command stops the proxy first and then starts it again
- With `local` or `docker`, it operates on the local process or Docker container for the current driver

## Related commands

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
