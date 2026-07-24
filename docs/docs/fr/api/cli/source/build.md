---
title: "nb source build"
description: "Référence de la commande nb source build : construire le projet source NocoBase local."
keywords: "nb source build,NocoBase CLI,build,sources"
---

# nb source build

Construire le projet source NocoBase local. La commande doit être exécutée dans le répertoire source (`<app-path>/source/`). Pour les source apps gérées par le CLI, les plugins du répertoire `plugins/` sont automatiquement synchronisés vers `source/packages/plugins/` avant le build.

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
| `--tar` | boolean | Empaqueter automatiquement en fichier `.tgz` après le build |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes |

## Exemples

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## Description

Lorsque `--tar` est utilisé, le plugin spécifié est empaquetté en fichier `.tgz` après le build, dans le répertoire `source/storage/tar/`. Le chemin complet du tarball est affiché à la fin de la commande.

## Commandes connexes

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
