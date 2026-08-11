---
title: "nb portal deploy"
description: "Référence de la commande nb portal deploy : construire et déployer le workspace Portal spécifié."
keywords: "nb portal deploy,NocoBase CLI,Portal,construction,déploiement"
---

# nb portal deploy

Construit et déploie le workspace Portal spécifié. Cette commande est généralement utilisée lorsque le développement local est terminé et que le Portal doit être mis à jour dans l'env cible.

Pendant l'exécution, la commande actualise d'abord `.env` et `.env.local` dans le workspace, puis lance `pnpm build`. Le résultat de build doit contenir `dist/client/index.html`.

## Utilisation

```bash
nb portal deploy <portal> [flags]
```

## Paramètre

| Paramètre | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Nom ou slug du Portal |
| `--env`, `-e` | string | Nom de l'env CLI. Si omis, l'env courant est utilisé |
| `--no-install` | boolean | Ignorer `pnpm install` avant le build |
| `--yes`, `-y` | boolean | Ignorer la confirmation interactive lorsque le `--env` explicite pointe vers un env différent de l'env courant |

## Exemples

Déployer un Portal dans l'env courant :

```bash
nb portal deploy customer
```

Déployer un Portal dans un env spécifique :

```bash
nb portal deploy customer --env dev --yes
```

Ignorer l'installation des dépendances et seulement reconstruire puis déployer :

```bash
nb portal deploy customer --no-install
```

## Notes

`deploy` s'adresse aux workspaces de développement Portal déjà existants. Si aucun workspace local n'existe encore, créez-le d'abord avec [`nb portal create`](./create.md) ou récupérez-le depuis le source storage avec [`nb portal pull`](./pull.md).

Le déploiement construit le Portal à partir du chemin de développement enregistré dans la configuration de l'env CLI, puis synchronise les artefacts de build vers le répertoire de déploiement du storage de l'application cible.

Le déploiement ne modifie pas le source storage ni la configuration Git. Ces paramètres sont mis à jour dans l'enregistrement distant du Portal par [`nb portal config`](./config.md).

## Commandes liées

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
