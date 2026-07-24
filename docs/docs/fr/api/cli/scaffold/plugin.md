---
title: "nb scaffold plugin"
description: "Référence de la commande nb scaffold plugin : générer le squelette d'un plugin NocoBase."
keywords: "nb scaffold plugin,NocoBase CLI,scaffold de plugin"
---

# nb scaffold plugin

Générer le code squelette d'un plugin NocoBase.

## Utilisation

```bash
nb scaffold plugin <pkg> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<pkg>` | string | Nom du package du plugin, requis |
| `--cwd`, `-c` | string | Spécifier le chemin du répertoire racine de l'application |
| `--force-recreate`, `-f` | boolean | Forcer la recréation du squelette de plugin |

## Exemples

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Description

Pour les source apps gérées par le CLI (applications créées via `nb init`), le plugin est généré dans le répertoire `<app-path>/plugins/` ; `nb` synchronise automatiquement le plugin vers `source/packages/plugins/` pour le développement et le flux de build.

Si le plugin cible existe déjà, la commande échoue par défaut. Utilisez `--force-recreate` pour forcer la recréation. Si un répertoire ou un lien symbolique externe en conflit existe côté source, supprimez-le manuellement avant de réessayer.

## Commandes connexes

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
