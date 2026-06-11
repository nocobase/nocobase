---
title: "nb proxy caddy use"
description: "Référence de la commande nb proxy caddy use : changer le driver actuellement utilisé par le provider Caddy."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Change le driver actuellement utilisé par le provider Caddy.

## Utilisation

```bash
nb proxy caddy use <driver>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<driver>` | string | Prend en charge `local` ou `docker` |

## Exemples

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Remarques

- La commande enregistre le résultat dans `proxy.caddy-driver`
- Les commandes suivantes comme `start`, `reload`, `stop`, `status` et `info` s'appuient toutes sur le driver actuel

## Commandes associées

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
