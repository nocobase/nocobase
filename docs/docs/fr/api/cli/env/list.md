---
title: "nb env list"
description: "Référence de la commande nb env list : lister les env NocoBase CLI configurés et leur état d'authentification API."
keywords: "nb env list,NocoBase CLI,liste des environnements,état d'authentification"
---

# nb env list

Lister tous les env configurés et vérifier l'état d'authentification API en utilisant les identifiants Token / OAuth enregistrés.

## Utilisation

```bash
nb env list
```

## Sortie

La table de sortie contient le marqueur de l'env courant, le nom, le type, l'App Status, l'URL, la méthode d'authentification et la version runtime.

`App Status` représente l'état renvoyé par l'API de l'application lorsque le CLI l'interroge avec les identifiants de l'env courant, par exemple `ok`, `auth failed`, `unreachable` ou `unconfigured`. Pour l'état d'exécution de la base de données, utilisez [`nb db ps`](../db/ps.md).

## Exemples

```bash
nb env list
```

## Commandes connexes

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
