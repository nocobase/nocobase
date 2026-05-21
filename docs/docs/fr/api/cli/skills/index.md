---
title: "nb skills"
description: "Référence de la commande nb skills : vérifier, installer, mettre à jour ou supprimer les NocoBase AI coding skills globaux."
keywords: "nb skills,NocoBase CLI,skills,AI coding skills"
---

# nb skills

Vérifier, installer, mettre à jour ou supprimer les NocoBase AI coding skills globaux.

## Utilisation

```bash
nb skills <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb skills check`](./check.md) | Vérifier les NocoBase AI coding skills globaux |
| [`nb skills install`](./install.md) | Installer globalement les NocoBase AI coding skills |
| [`nb skills update`](./update.md) | Mettre à jour les NocoBase AI coding skills installés |
| [`nb skills remove`](./remove.md) | Supprimer les NocoBase AI coding skills gérés par `nb` |

## Exemples

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## Commandes connexes

- [`nb init`](../init.md)
- [`nb self`](../self/index.md)
