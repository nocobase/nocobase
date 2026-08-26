---
title: "nb proxy caddy stop"
description: "nb proxy caddy stop command reference: stop the Caddy proxy with the current driver."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Stop the Caddy proxy with the current driver.

## Usage

```bash
nb proxy caddy stop
```

## Examples

```bash
nb proxy caddy stop
```

## Notes

- With the `local` driver, this stops the local Caddy process
- With the `docker` driver, this stops the proxy container
- If the proxy is already stopped, the command reports that it is already stopped

## Related commands

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
