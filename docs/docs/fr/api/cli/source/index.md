---
title: "nb source"
description: "Référence de la commande nb source : gérer le projet source NocoBase local, dont le téléchargement, le développement, la build et les tests."
keywords: "nb source,NocoBase CLI,sources,download,dev,build,test"
---

# nb source

Gérer le projet source NocoBase local. Les env npm/Git utilisent un répertoire de sources locales ; pour les env Docker, il suffit généralement d'utiliser [`nb app`](../app/index.md) pour piloter l'état d'exécution.

## Utilisation

```bash
nb source <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb source download`](./download.md) | Récupérer NocoBase depuis npm, Docker ou Git |
| [`nb source dev`](./dev.md) | Lancer le mode développement dans un env source npm/Git |
| [`nb source build`](./build.md) | Construire le projet source local |
| [`nb source test`](./test.md) | Exécuter les tests dans le répertoire de l'application sélectionnée |

## Exemples

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## Commandes connexes

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
