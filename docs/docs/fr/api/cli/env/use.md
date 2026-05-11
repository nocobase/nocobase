---
title: "nb env use"
description: "Référence de la commande nb env use : changer l'env NocoBase CLI courant."
keywords: "nb env use,NocoBase CLI,changer d'environnement,current env"
---

# nb env use

Changer l'env CLI courant. Toutes les commandes ultérieures qui omettent `--env` utiliseront cet env par défaut.

Lorsque le mode session est activé pour le shell ou le runtime actuel, ce changement n’affecte que la session en cours.

Lorsque le mode session n’est pas activé, cela revient à mettre à jour le `last env` global. Dans ce cas, d’autres terminaux ou runtimes d’agent sans isolation de session peuvent aussi être affectés.

## Utilisation

```bash
nb env use <name>
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<name>` | string | Nom de l'environnement configuré vers lequel basculer |

## Exemples

```bash
nb env use local
```

## Commandes connexes

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
