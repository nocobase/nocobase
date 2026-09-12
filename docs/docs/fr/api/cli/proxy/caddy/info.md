---
title: "nb proxy caddy info"
description: "Référence de la commande nb proxy caddy info : afficher le driver courant du provider Caddy, les chemins de configuration et les détails de runtime."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,chemins,configuration"
---

# nb proxy caddy info

Affiche le driver courant du provider Caddy, les chemins de configuration et les détails de runtime.

## Utilisation

```bash
nb proxy caddy info
```

## Sortie

La sortie inclut généralement ces champs :

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` ou `container`
- `image`

Où :

- avec le driver `local`, la sortie affiche `caddyBinary`
- avec le driver `docker`, la sortie affiche `container` et `image`

## Exemples

```bash
nb proxy caddy info
```

## Commandes associées

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
