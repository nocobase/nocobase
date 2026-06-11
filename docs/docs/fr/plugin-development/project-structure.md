---
title: "Structure du projet de plugin"
description: "Structure de projet de plugin NocoBase : Yarn Workspace, packages/plugins, storage, répertoires client/server, configuration lerna.json."
keywords: "structure du projet, Yarn Workspace, packages/plugins, répertoire de plugins, create-nocobase-app, NocoBase"
---

# Structure du répertoire du projet

Que vous cloniez le code source depuis Git ou que vous initialisiez un projet avec `create-nocobase-app`, le projet NocoBase généré est essentiellement un monorepo basé sur **Yarn Workspace**.

## Aperçu du répertoire racine

L'exemple suivant utilise `my-nocobase-app/` comme répertoire de projet. Il peut y avoir de légères différences selon les environnements :

```bash
my-nocobase-app/
├── packages/              # Code source du projet
│   ├── plugins/           # Plugins en cours de développement (non compilés)
├── storage/               # Données d'exécution et contenu généré dynamiquement
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugins compilés (y compris ceux téléchargés via l'interface)
│   └── tar/               # Fichiers de package de plugins (.tar)
├── scripts/               # Scripts utilitaires et commandes d'outils
├── .env*                  # Configuration des variables d'environnement pour différents environnements
├── lerna.json             # Configuration de l'espace de travail Lerna
├── package.json           # Configuration du package racine, déclare le workspace et les scripts
├── tsconfig*.json         # Configurations TypeScript (frontend, backend, mappage de chemins)
├── vitest.config.mts      # Configuration des tests unitaires Vitest
└── playwright.config.ts   # Configuration des tests E2E Playwright
```

## Description du sous-répertoire packages/

Le répertoire `packages/` contient les modules centraux et les packages extensibles de NocoBase ; son contenu dépend de la source du projet :

- **Projets créés via `create-nocobase-app`** : par défaut, il ne contient que `packages/plugins/`, qui sert à stocker le code source des plugins personnalisés. Chaque sous-répertoire est un package npm indépendant.
- **Dépôt de code source officiel cloné** : vous y verrez plus de sous-répertoires, par exemple `core/`, `plugins/`, `pro-plugins/`, `presets/`, etc., correspondant respectivement au cœur du framework, aux plugins intégrés et aux solutions prédéfinies officielles.

Dans tous les cas, `packages/plugins` est l'emplacement principal pour le développement et le débogage de vos plugins personnalisés.

## Répertoire d'exécution storage/

`storage/` contient les données générées à l'exécution et les sorties de build. Voici une description des sous-répertoires courants :

- `apps/` : configuration et cache pour les scénarios multi-applications.
- `logs/` : journaux d'exécution et sorties de débogage.
- `uploads/` : fichiers et ressources multimédias téléchargés par les utilisateurs.
- `plugins/` : plugins packagés téléchargés via l'interface ou importés via la CLI.
- `tar/` : packages compressés de plugins générés après l'exécution de `yarn build <plugin> --tar`.

:::tip Astuce

En général, il est recommandé d'ajouter le répertoire `storage` à votre `.gitignore` et de le gérer séparément lors du déploiement ou de la sauvegarde.

:::

## Configuration de l'environnement et scripts du projet

- `.env`, `.env.test`, `.env.e2e` : utilisés respectivement pour l'exécution locale, les tests unitaires/d'intégration et les tests de bout en bout (E2E).
- `scripts/` : contient les scripts opérationnels courants, par exemple l'initialisation de la base de données, les utilitaires de publication, etc.

## Chemins de chargement et priorité des plugins

Les plugins peuvent exister à plusieurs emplacements ; au démarrage, NocoBase les charge dans l'ordre de priorité suivant :

1. La version du code source dans `packages/plugins` (pour le développement et le débogage locaux).
2. La version packagée dans `storage/plugins` (téléchargée via l'interface ou importée via la CLI).
3. Les packages de dépendances dans `node_modules` (installés via npm/yarn ou intégrés au framework).

Si un plugin portant le même nom existe à la fois dans le répertoire source et dans le répertoire packagé, NocoBase priorisera le chargement de la version source, ce qui facilite les surcharges locales et le débogage.

## Modèle de répertoire de plugin

Créez un plugin avec la CLI :

```bash
yarn pm create @my-project/plugin-hello
```

La structure de répertoire générée est la suivante :

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Sortie de build (générée à la demande)
├── src/                     # Répertoire du code source
│   ├── client-v2/           # Code frontend (blocs, pages, modèles, etc.)
│   │   ├── plugin.ts        # Classe principale du plugin client
│   │   └── index.ts         # Point d'entrée client
│   ├── locale/              # Ressources multilingues (partagées entre frontend et backend)
│   ├── swagger/             # Documentation OpenAPI/Swagger
│   └── server/              # Code côté serveur
│       ├── collections/     # Définitions de collections / tables
│       ├── commands/        # Commandes personnalisées
│       ├── migrations/      # Scripts de migration de base de données
│       ├── plugin.ts        # Classe principale du plugin serveur
│       └── index.ts         # Point d'entrée serveur
├── index.ts                 # Export pont frontend-backend
├── client-v2.d.ts           # Déclarations de types frontend
├── client-v2.js             # Artefact de build frontend
├── server.d.ts              # Déclarations de types serveur
├── server.js                # Artefact de build serveur
├── .npmignore               # Configuration d'ignorance pour la publication
└── package.json
```

:::tip Astuce

Une fois la construction terminée, le répertoire `dist/` ainsi que les fichiers `client-v2.js` et `server.js` seront chargés lors de l'activation du plugin. Pendant le développement, il suffit de modifier le répertoire `src/` ; avant la publication, exécutez `yarn build <plugin>` ou `yarn build <plugin> --tar`.

:::

## Liens connexes

- [Écrire votre premier plugin](./write-your-first-plugin.md) — créez un plugin de zéro et expérimentez le flux complet de développement
- [Aperçu du développement serveur](./server/index.md) — présentation et concepts centraux des plugins serveur
- [Aperçu du développement client](./client/index.md) — présentation et concepts centraux des plugins client
- [Build et empaquetage](./build.md) — processus de build, d'empaquetage et de distribution des plugins
- [Gestion des dépendances](./dependency-management.md) — déclaration et gestion des dépendances de plugins
