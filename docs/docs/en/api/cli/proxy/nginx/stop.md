---
title: "nb proxy nginx stop"
description: "nb proxy nginx stop command reference: stop the Nginx proxy with the current driver."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Stop the Nginx proxy with the current driver.

## Usage

```bash
nb proxy nginx stop
```

## Examples

```bash
nb proxy nginx stop
```

## Notes

- With the `local` driver, this stops the local Nginx process
- With the `docker` driver, this stops the proxy container
- If the proxy is already stopped, the command reports that it is already stopped

## Related commands

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
