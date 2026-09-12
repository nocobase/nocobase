---
title: "nb env list"
description: "Référence de la commande nb env list : lister les env configurés du NocoBase CLI."
keywords: "nb env list,NocoBase CLI,liste des environnements,API Base URL"
---

# nb env list

Liste tous les env configurés.

Cette commande affiche uniquement la configuration enregistrée. Utilisez plutôt [`nb env status`](./status.md) lorsque vous voulez vérifier l’état.

## Utilisation


nb env list

## Sortie

Le tableau de sortie comprend le marqueur de l’environnement courant, le nom, le type, `API Base URL`, le type d’authentification et la version runtime.

- `Current` marque avec `*` l’env effectivement utilisé
- `API Base URL` affiche l’adresse API brute enregistrée
- `Runtime` affiche les informations de version runtime mises en cache

## Exemples


nb env list

## Commandes connexes

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
