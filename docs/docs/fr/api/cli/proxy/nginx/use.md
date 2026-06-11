---
title: "nb proxy nginx use"
description: "Référence de la commande nb proxy nginx use : changer le driver actuellement utilisé par le provider Nginx."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Change le driver actuellement utilisé par le provider Nginx.

## Utilisation

```bash
nb proxy nginx use <driver>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<driver>` | string | Prend en charge `local` ou `docker` |

## Exemples

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Remarques

- La commande enregistre le résultat dans `proxy.nginx-driver`
- Les commandes suivantes comme `start`, `reload`, `stop`, `status` et `info` s'appuient toutes sur le driver actuel

## Commandes associées

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
