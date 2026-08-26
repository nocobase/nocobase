---
title: "nb self"
description: "Référence de la commande nb self : vérifier ou mettre à jour le NocoBase CLI installé."
keywords: "nb self,NocoBase CLI,mise à jour automatique,vérification de version"
---

# nb self

Vérifier ou mettre à jour le NocoBase CLI installé.

## Utilisation

```bash
nb self <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb self check`](./check.md) | Vérifier la version courante du CLI et la prise en charge de la mise à jour automatique |
| [`nb self update`](./update.md) | Mettre à jour le NocoBase CLI installé globalement via npm |

## Exemples

```bash
nb self check
nb self check --json
nb self update --yes
```

## Commandes connexes

- [`nb skills`](../skills/index.md)
- [`nb app upgrade`](../app/upgrade.md)
