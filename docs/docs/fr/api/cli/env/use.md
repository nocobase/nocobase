---
title: "nb env use"
description: "Référence de la commande nb env use : changer l'env NocoBase CLI courant."
keywords: "nb env use,NocoBase CLI,changer d'environnement,current env"
---

# nb env use

Changer l'env CLI courant. Toutes les commandes ultérieures qui omettent `--env` utiliseront cet env par défaut.

## Utilisation

```bash
nb env use <name>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<name>` | string | Nom d'un environnement déjà configuré |

## Exemples

```bash
nb env use local
```

## Commandes connexes

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
