---
title: "nb config set"
description: "Référence de la commande nb config set : définir une valeur de configuration du CLI."
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

Définit une valeur de configuration du CLI. Les clés prises en charge sont `license.pkg-url`, `docker.network` et `docker.container-prefix`.

## Utilisation

```bash
nb config set <key> <value>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<key>` | string | Clé de configuration : `license.pkg-url`, `docker.network` ou `docker.container-prefix` |
| `<value>` | string | Valeur de configuration ; ne doit pas être vide |

## Exemples

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## Remarques

Lors de la définition de `license.pkg-url`, le CLI normalise l'URL pour qu'elle se termine par `/`.

## Commandes connexes

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
