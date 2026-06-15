---
title: "nb proxy caddy start"
description: "nb proxy caddy start command reference: start the Caddy proxy with the current driver."
keywords: "nb proxy caddy start,NocoBase CLI,caddy,start"
---

# nb proxy caddy start

Start the Caddy proxy with the current driver.

## Usage

```bash
nb proxy caddy start
```

## Examples

```bash
nb proxy caddy start
```

## Notes

- With the `local` driver, this starts the local Caddy process
- With the `docker` driver, this starts or creates the Docker container
- If the proxy is already running, the command reports that it is already running

## Related commands

- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
