---
title: "nb proxy caddy info"
description: "Referencia del comando nb proxy caddy info: mostrar el driver actual del proveedor Caddy, las rutas de configuración y los detalles de runtime."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,rutas,configuración"
---

# nb proxy caddy info

Muestra el driver actual del proveedor Caddy, las rutas de configuración y los detalles de runtime.

## Uso

```bash
nb proxy caddy info
```

## Salida

La salida normalmente incluye estos campos:

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` o `container`
- `image`

Donde:

- con el driver `local`, la salida muestra `caddyBinary`
- con el driver `docker`, la salida muestra `container` e `image`

## Ejemplos

```bash
nb proxy caddy info
```

## Comandos relacionados

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
