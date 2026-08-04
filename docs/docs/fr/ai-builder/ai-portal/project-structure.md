---
title: "Structure du projet et stack technique"
description: "La stack technique du modèle d'AI Portal, ses conventions de répertoires, ses variables d'environnement et ses commandes courantes, pour vérifier si l'IA a placé son code au bon endroit."
keywords: "AI Portal, structure du projet, stack technique, React, Vite, Refine, Tailwind CSS, shadcn/ui, variables d'environnement"
---

# Structure du projet et stack technique

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir un premier Portal en fonctionnement en suivant le [Démarrage rapide de l'AI Portal](./index.md).

:::

L'essentiel du développement quotidien peut être laissé à l'IA. Connaître la structure du modèle vous permet toutefois de vérifier si l'IA a placé son code au bon endroit, et facilite la localisation des problèmes.

## Stack technique

Le modèle de Portal est basé sur `@nocobase/portal-template-default`, dont le code source se trouve sur [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default).

| Technologie | Rôle |
| --- | --- |
| React 19 + TypeScript | Framework front-end |
| Vite | Serveur de développement et outil de build |
| [Refine](https://refine.dev/docs/) | Framework de couche données, qui gère les ressources, le routage, les formulaires et les permissions |
| Tailwind CSS 4 | Styles |
| [shadcn/ui](https://ui.shadcn.com/) | Base de composants, dont le code source appartient au projet |
| lucide | Bibliothèque d'icônes |
| pnpm | Gestionnaire de paquets |

Cette combinaison est la stack front-end que l'IA maîtrise le mieux aujourd'hui, ce qui rend son code plus juste.

Le Portal est pour l'instant un projet purement front-end, la logique métier passant par l'API de NocoBase, les composants standard, etc. La possibilité de faire écrire du code back-end de Portal à l'AI Agent arrive prochainement.

## Structure des répertoires

```text
src/
├── app/            Routage et chargement des extensions
├── pages/          Connexion, inscription, mot de passe oublié, etc.
├── components/     Composants
│   ├── ui/         Base de composants shadcn/ui
│   ├── app-shell/  Mise en page, navigation, états de chargement
│   ├── auth/       Composants d'authentification
│   └── ...
├── extensions/     Extensions, actives une fois installées
├── lib/            Wrapper du client NocoBase et logique ACL
├── providers/      Providers Refine
├── hooks/          Hooks personnalisés
└── locales/        Textes localisés
```

Quelques emplacements clés :

- **`src/app/routes.tsx`** — structure des routes. Les routes authentifiées et non authentifiées sont séparées, et les routes apportées par les extensions sont montées automatiquement
- **`src/app/extensions.tsx`** — chargement des extensions, via `import.meta.glob` qui parcourt `src/extensions/*/extension.tsx`
- **`src/providers/data.ts`** — le data provider de Refine, qui traduit la syntaxe de requête de Refine en paramètres d'API NocoBase
- **`src/lib/nocobase/client.ts`** — `NocoBaseClient`, le wrapper bas niveau derrière chaque requête
- **`src/components/ui/`** — une soixantaine de composants shadcn/ui, prêts à l'emploi

Les pages métier vont généralement sous `src/extensions/`, un répertoire par module fonctionnel. Voir [Composants standard et extensions](./components.md).

## Fichiers clés

| Fichier | Rôle |
| --- | --- |
| `AGENTS.md` | Conventions de développement destinées à l'AI Agent. Vous pouvez y ajouter les règles propres à votre projet |
| `components.json` | Configuration shadcn/ui, dont le style, la bibliothèque d'icônes et les alias de chemins |
| `.env` / `.env.local` | Variables d'environnement, actualisées automatiquement par `nb portal dev` et `deploy` |
| `vite.config.ts` | Configuration de build, dont le proxy d'API utilisé pendant le développement |

## Variables d'environnement

| Variable | Description |
| --- | --- |
| `NOCOBASE_API_URL` | Racine de la REST API NocoBase, **doit se terminer par `/api`**. Généralement `/api` pour les déploiements de même origine |
| `NOCOBASE_PORTAL_BASE` | Chemin public sur lequel le Portal est monté. `/` en développement local, le chemin de déploiement réel comme `/x/main/` pour les builds |
| `NOCOBASE_AUTHENTICATOR` | Nom de l'authenticator, `basic` par défaut |
| `NOCOBASE_API_TOKEN` | Token temporaire pour le développement. N'y commitez pas de valeur réelle |
| `API_CLIENT_STORAGE_PREFIX` | Préfixe de stockage du token. À aligner si le serveur le personnalise |
| `API_CLIENT_STORAGE_TYPE` | Mode de stockage du token, `localStorage` par défaut |
| `API_CLIENT_SHARE_TOKEN` | Indique si le token est partagé, `false` par défaut |

`nb portal dev` et `nb portal deploy` les écrivent pour vous, vous n'avez donc généralement pas à y toucher. Les trois dernières n'ont besoin d'être alignées que si le serveur a personnalisé le stockage des tokens d'authentification.

Pendant le développement, si `NOCOBASE_API_URL` est une adresse absolue, Vite met en place un proxy pour relayer les requêtes, ce qui vous évite d'avoir à gérer le CORS vous-même.

## Commandes courantes

Voici celles que vous utiliserez au quotidien. L'installation des dépendances, l'actualisation des variables d'environnement et les builds sont pris en charge par la CLI en arrière-plan :

| Commande | Rôle |
| --- | --- |
| `nb portal list` | Voir les Portals de l'application courante |
| `nb portal info <portal>` | Consulter le chemin de développement, le chemin de déploiement et l'URL d'accès d'un Portal |
| `nb portal create <portal>` | Créer l'espace de travail de développement d'un nouveau Portal à partir du modèle |
| `nb portal pull <portal>` | Récupérer le code source distant du Portal dans l'espace de travail de développement local |
| `nb portal dev <portal>` | Démarrer le serveur de développement local et voir les modifications en direct |
| `nb portal push <portal>` | Pousser les modifications locales du code source vers le distant |
| `nb portal deploy <portal>` | Construire et déployer, pour rendre les modifications visibles aux utilisateurs |
| `nb portal config <portal>` | Ajuster le source storage, les réglages Git et le chemin de l'espace de travail de développement |
| `nb portal destroy <portal>` | Supprimer l'enregistrement du Portal et ses fichiers déployés |

Pour les paramètres complets de chaque commande, consultez la [Référence des commandes `nb portal`](../../api/cli/portal/index.md).

## Où se trouve l'espace de travail de développement

L'espace de travail de développement d'un Portal est créé dans le répertoire où vous vous trouviez au moment d'exécuter `nb portal create` ou `nb portal pull` :

```text
./<portal>
```

Vous pouvez indiquer un autre emplacement avec `--path` au moment de la création ou de la récupération. Les artefacts de déploiement construits vont ailleurs — sous le storage de l'application cible, maintenus en synchronisation par `nb portal deploy`, et dont vous n'avez normalement pas à vous occuper.

Si vous ne savez plus où se trouve l'espace de travail de développement d'un Portal, il suffit de le consulter :

```bash
nb portal info main
```

## Liens connexes

- [Démarrage rapide de l'AI Portal](./index.md) — mettre en route votre premier point d'entrée front-end écrit par l'IA
- [Composants standard et extensions](./components.md) — la base de composants shadcn/ui et le mécanisme d'extension
- [Déploiement et gestion des sources](./deploy.md) — le processus de build et de déploiement, et le source storage
- [Construire avec un AI Agent](./agent-workflow.md) — piloter l'IA en langage naturel pour écrire les pages
- [`nb portal info`](../../api/cli/portal/info.md) — vérifier où se trouve l'espace de travail de développement d'un Portal
