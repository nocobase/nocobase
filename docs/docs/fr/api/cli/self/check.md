---
title: "nb self check"
description: "Référence de la commande nb self check : vérifier la version du NocoBase CLI installé et la prise en charge de la mise à jour automatique."
keywords: "nb self check,NocoBase CLI,vérification de version"
---

# nb self check

Vérifier l'installation courante du NocoBase CLI, résoudre la dernière version du channel sélectionné et indiquer si la mise à jour automatique est prise en charge.

## Utilisation

```bash
nb self check [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--channel` | string | Channel de release à comparer, par défaut `auto` ; valeurs possibles : `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Sortie au format JSON |

## Exemples

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Commandes connexes

- [`nb self update`](./update.md)
