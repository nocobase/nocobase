---
title: "nb proxy nginx info"
description: "nb proxy nginx info command reference: show the current Nginx provider driver, config paths, and runtime details."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,paths,configuration"
---

# nb proxy nginx info

Show the current Nginx provider driver, config paths, and runtime details.

## Usage

```bash
nb proxy nginx info
```

## Output

The output usually includes these fields:

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` or `container`
- `image`

Where:

- with the `local` driver, the output shows `nginxBinary`
- with the `docker` driver, the output shows `container` and `image`

## Examples

```bash
nb proxy nginx info
```

## Related commands

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
