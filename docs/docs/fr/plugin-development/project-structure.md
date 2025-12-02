:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Structure du projet

Que vous cloniez le code source depuis Git ou que vous initialisiez un projet avec `create-nocobase-app`, le projet NocoBase généré est essentiellement un monorepo basé sur **Yarn Workspace**.

## Aperçu du répertoire racine

L'exemple suivant utilise `my-nocobase-app/` comme répertoire de projet. Il peut y avoir de légères différences selon les environnements :

```bash
my-nocobase-app/
├── packages/              # Code source du projet
│   ├── plugins/           # Plugins en développement (non compilés)
├── storage/               # Données d'exécution et contenu généré dynamiquement
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugins compilés (y compris ceux téléchargés via l'interface utilisateur)
│   └── tar/               # Fichiers de package de plugins (.tar)
├── scripts/               # Scripts utilitaires et commandes d'outils
├── .env*                  # Configurations des variables d'environnement pour différents environnements
├── lerna.json             # Configuration de l'espace de travail Lerna
├── package.json           # Configuration du package racine, déclare l'espace de travail et les scripts
├── tsconfig*.json         # Configurations TypeScript (frontend, backend, mappage de chemins)
├── vitest.config.mts      # Configuration des tests unitaires Vitest
└── playwright.config.ts   # Configuration des tests E2E Playwright
```

## Description du sous-répertoire `packages/`

Le répertoire `packages/` contient les modules principaux de NocoBase et les packages extensibles. Son contenu dépend de la source du projet :

- **Projets créés via `create-nocobase-app`** : Par défaut, il contient uniquement `packages/plugins/`, utilisé pour stocker le code source des plugins personnalisés. Chaque sous-répertoire est un package npm indépendant.
- **Dépôt de code source officiel cloné** : Vous y verrez plus de sous-répertoires, comme `core/`, `plugins/`, `pro-plugins/`, `presets/`, etc., correspondant au cœur du framework, aux plugins intégrés et aux solutions prédéfinies officielles.

Dans tous les cas, `packages/plugins` est l'emplacement principal pour le développement et le débogage de vos plugins personnalisés.

## Répertoire d'exécution `storage/`

`storage/` contient les données générées à l'exécution et les sorties de build. Voici une description des sous-répertoires courants :

- `apps/` : Configuration et cache pour les scénarios multi-applications.
- `logs/` : Journaux d'exécution et sorties de débogage.
- `uploads/` : Fichiers et ressources multimédias téléchargés par les utilisateurs.
- `plugins/` : Plugins packagés téléchargés via l'interface utilisateur ou importés via la CLI.
- `tar/` : Packages de plugins compressés générés après l'exécution de `yarn build <plugin> --tar`.

> Il est généralement recommandé d'ajouter le répertoire `storage` à votre `.gitignore` et de le gérer séparément lors du déploiement ou de la sauvegarde.

## Configuration de l'environnement et scripts de projet

- `.env`, `.env.test`, `.env.e2e` : Utilisés respectivement pour l'exécution locale, les tests unitaires/d'intégration et les tests de bout en bout (E2E).
- `scripts/` : Contient les scripts de maintenance courants (tels que l'initialisation de la base de données, les utilitaires de publication, etc.).

## Chemins de chargement et priorité des plugins

Les plugins peuvent exister à plusieurs emplacements. Au démarrage, NocoBase les chargera dans l'ordre de priorité suivant :

1. La version du code source dans `packages/plugins` (pour le développement et le débogage locaux).
2. La version packagée dans `storage/plugins` (téléchargée via l'interface utilisateur ou importée via la CLI).
3. Les packages de dépendances dans `node_modules` (installés via npm/yarn ou intégrés au framework).

Lorsqu'un plugin portant le même nom existe à la fois dans le répertoire source et dans le répertoire packagé, le système privilégiera le chargement de la version source, ce qui facilite les surcharges locales et le débogage.

## Modèle de répertoire de plugin

Créez un plugin en utilisant la CLI :

```bash
yarn pm create @my-project/plugin-hello
```

La structure de répertoire générée est la suivante :

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Sortie de build (générée si nécessaire)
├── src/                     # Répertoire du code source
│   ├── client/              # Code frontend (blocs, pages, modèles, etc.)
│   │   ├── plugin.ts        # Classe principale du plugin côté client
│   │   └── index.ts         # Point d'entrée côté client
│   ├── locale/              # Ressources multilingues (partagées entre frontend et backend)
│   ├── swagger/             # Documentation OpenAPI/Swagger
│   └── server/              # Code côté serveur
│       ├── collections/     # Définitions de collections
│       ├── commands/        # Commandes personnalisées
│       ├── migrations/      # Scripts de migration de base de données
│       ├── plugin.ts        # Classe principale du plugin côté serveur
│       └── index.ts         # Point d'entrée côté serveur
├── index.ts                 # Exportation de la passerelle frontend-backend
├── client.d.ts              # Déclarations de type frontend
├── client.js                # Artefact de build frontend
├── server.d.ts              # Déclarations de type côté serveur
├── server.js                # Artefact de build côté serveur
├── .npmignore               # Configuration d'ignorance pour la publication
└── package.json
```

> Une fois la construction terminée, le répertoire `dist/` ainsi que les fichiers `client.js` et `server.js` seront chargés lorsque le plugin sera activé.  
> Pendant le développement, vous n'avez qu'à modifier le répertoire `src/`. Avant la publication, exécutez `yarn build <plugin>` ou `yarn build <plugin> --tar`.