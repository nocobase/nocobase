---
title: "nb proxy nginx info"
description: "Referencia del comando nb proxy nginx info: mostrar el driver actual del proveedor Nginx, las rutas de configuración y los detalles de runtime."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,rutas,configuración"
---

# nb proxy nginx info

Muestra el driver actual del proveedor Nginx, las rutas de configuración y los detalles de runtime.

## Uso

```bash
nb proxy nginx info
```

## Salida

La salida normalmente incluye estos campos:

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` o `container`
- `image`

Donde:

- con el driver `local`, la salida muestra `nginxBinary`
- con el driver `docker`, la salida muestra `container` e `image`

## Ejemplos

```bash
nb proxy nginx info
```

## Comandos relacionados

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
