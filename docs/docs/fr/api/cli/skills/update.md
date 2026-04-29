---
title: "nb skills update"
description: "Référence de la commande nb skills update : mettre à jour les NocoBase AI coding skills globaux."
keywords: "nb skills update,NocoBase CLI,mettre à jour les skills"
---

# nb skills update

Mettre à jour les NocoBase AI coding skills installés globalement. Cette commande met uniquement à jour une installation existante de `@nocobase/skills`.

## Utilisation

```bash
nb skills update [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Ignorer la confirmation de mise à jour |
| `--json` | boolean | Sortie au format JSON |
| `--verbose` | boolean | Afficher la sortie détaillée de la mise à jour |

## Exemples

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## Commandes connexes

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
