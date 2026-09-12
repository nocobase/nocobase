---
title: "nb proxy nginx restart"
description: "nb proxy nginx restart command reference: restart the Nginx proxy with the current driver."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

Restart the Nginx proxy with the current driver.

## Usage

```bash
nb proxy nginx restart
```

## Examples

```bash
nb proxy nginx restart
```

## Notes

- This command stops the proxy first and then starts it again
- With `local` or `docker`, it operates on the local process or Docker container for the current driver

## Related commands

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
