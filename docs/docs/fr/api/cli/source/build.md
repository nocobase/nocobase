---
title: "nb source build"
description: "Référence de la commande nb source build : construire le projet source NocoBase local."
keywords: "nb source build,NocoBase CLI,build,sources"
---

# nb source build

Construire le projet source NocoBase local. La commande relaie le flux de build NocoBase historique exécuté depuis la racine du dépôt.

## Utilisation

```bash
nb source build [packages...] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[packages...]` | string[] | Packages à construire ; construit l'ensemble si omis |
| `--cwd`, `-c` | string | Répertoire de travail |
| `--no-dts` | boolean | Ne pas générer les fichiers de déclaration `.d.ts` |
| `--sourcemap` | boolean | Générer les sourcemaps |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes |

## Exemples

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Commandes connexes

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
