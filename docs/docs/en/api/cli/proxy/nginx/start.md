---
title: "nb proxy nginx start"
description: "nb proxy nginx start command reference: start the Nginx proxy with the current driver."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

Start the Nginx proxy with the current driver.

## Usage

```bash
nb proxy nginx start
```

## Examples

```bash
nb proxy nginx start
```

## Notes

- With the `local` driver, this starts the local Nginx process
- With the `docker` driver, this starts or creates the Docker container
- If the proxy is already running, the command reports that it is already running

## Related commands

- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
