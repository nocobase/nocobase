---
title: "nb config get"
description: "Référence de la commande nb config get : obtenir la valeur effective d'une clé de configuration du CLI."
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

Obtenir la valeur effective d'une clé de configuration du CLI. Si aucune valeur explicite n'est définie, la valeur par défaut est renvoyée.

## Utilisation

```bash
nb config get <key>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<key>` | string | Clé de configuration : `license.pkg-url`, `docker.network` ou `docker.container-prefix` |

## Exemples

```bash
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
```

## Commandes connexes

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
