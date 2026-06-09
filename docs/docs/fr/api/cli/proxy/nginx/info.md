---
title: "nb proxy nginx info"
description: "Référence de la commande nb proxy nginx info : afficher le driver courant du provider Nginx, les chemins de configuration et les détails de runtime."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,chemins,configuration"
---

# nb proxy nginx info

Affiche le driver courant du provider Nginx, les chemins de configuration et les détails de runtime.

## Utilisation

```bash
nb proxy nginx info
```

## Sortie

La sortie inclut généralement ces champs :

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` ou `container`
- `image`

Où :

- avec le driver `local`, la sortie affiche `nginxBinary`
- avec le driver `docker`, la sortie affiche `container` et `image`

## Exemples

```bash
nb proxy nginx info
```

## Commandes associées

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
