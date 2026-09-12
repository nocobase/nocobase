---
title: "nb proxy caddy info"
description: "nb proxy caddy info command reference: show the current Caddy provider driver, config paths, and runtime details."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,paths,configuration"
---

# nb proxy caddy info

Show the current Caddy provider driver, config paths, and runtime details.

## Usage

```bash
nb proxy caddy info
```

## Output

The output usually includes these fields:

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` or `container`
- `image`

Where:

- with the `local` driver, the output shows `caddyBinary`
- with the `docker` driver, the output shows `container` and `image`

## Examples

```bash
nb proxy caddy info
```

## Related commands

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
