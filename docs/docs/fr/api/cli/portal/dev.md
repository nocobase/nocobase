---
title: "nb portal dev"
description: "Référence de la commande nb portal dev : démarrer le mode développement du répertoire de code source local d'un Portal."
keywords: "nb portal dev,NocoBase CLI,Portal,mode développement,développement local"
---

# nb portal dev

Démarre le mode développement du répertoire de code source local du Portal indiqué. Cette commande s'utilise généralement après [`nb portal create`](./create.md) ou [`nb portal pull`](./pull.md).

À l'exécution, elle actualise les fichiers `.env` et `.env.local` du répertoire de code source local, puis exécute `pnpm dev` dans ce même répertoire.

## Utilisation

```bash
nb portal dev <portal> [flags]
```

## Paramètre

| Paramètre | Type | Description |
| --- | --- | --- |
| `<portal>` | string | Nom ou slug du Portal |
| `--env`, `-e` | string | Nom du CLI env. S'il est omis, l'env courant est utilisé |
| `--yes`, `-y` | boolean | Ignore la confirmation interactive lorsque le `--env` indiqué explicitement diffère de l'env courant |

## Exemples

Démarrer le mode développement d'un Portal dans l'env courant :

```bash
nb portal dev customer
```

Démarrer le mode développement d'un Portal dans un env précis :

```bash
nb portal dev customer --env dev --yes
```

## Notes

`dev` démarre le serveur de développement à partir du répertoire de code source local du Portal. Cette commande ne crée pas d'enregistrement de Portal et ne récupère pas le code source distant ; si le répertoire de code source local n'existe pas, utilisez d'abord [`nb portal create`](./create.md) ou [`nb portal pull`](./pull.md).

Le répertoire de code source local doit contenir `package.json`. Les env de type `ssh` ne prennent pas encore en charge le démarrage du mode développement d'un Portal.

## Commandes liées

- [`nb portal create`](./create.md)
- [`nb portal pull`](./pull.md)
- [`nb portal deploy`](./deploy.md)
