---
title: "Structure du répertoire du projet de plugin"
description: "Structure de projet de plugin NocoBase : nb init, disposition de l'application, répertoire plugins, projet source, répertoire storage."
keywords: "structure du projet,nb init,plugins,répertoire de plugins,NocoBase"
---

# Structure du répertoire du projet

L'application initialisée via le CLI NocoBase (`nb init`) génère un répertoire d'application standard. Le CLI prend en charge deux sources : npm (`create-nocobase-app`) et Git. La structure de premier niveau est identique.

## Aperçu de la structure de premier niveau

```bash
<app-path>/
├── .nb/                   # Métadonnées sauvegardées par le CLI pour l'env courant
├── source/                # Projet source de l'application (noyau NocoBase + plugins intégrés)
├── storage/               # Répertoire de données d'exécution
│   ├── plugins/           # Plugins compilés (uploadés ou importés)
│   └── tar/               # Fichiers de package de plugins (.tgz)
├── plugins/               # Code source de vos plugins (nb scaffold plugin génère ici)
├── .env                   # Fichier de variables d'environnement de l'application
```

## plugins/ — répertoire de développement de plugins

`plugins/` est l'emplacement principal pour le développement de vos plugins personnalisés. Les plugins créés via `nb scaffold plugin` sont placés ici.

`nb` synchronise automatiquement les plugins de `plugins/` sous forme de liens symboliques vers `source/packages/plugins/`, pour les flux de développement et de construction. Vous n'avez pas besoin de manipuler manuellement le contenu du répertoire `source/`.

## source/ — répertoire du projet source

Le répertoire `source/` contient le projet source complet de NocoBase. Son contenu dépend de la source du projet :

- **Source npm** (`create-nocobase-app`) : ne contient par défaut que `packages/plugins/` et d'autres répertoires de base.
- **Source Git** (recommandée) : contient le code source complet du noyau du framework (`packages/core/`), les plugins intégrés, etc. ; lors du développement avec l'IA, vous pouvez directement consulter ces sources.

## storage/ — répertoire d'exécution

`storage/` contient les données générées à l'exécution et les sorties de construction :

- `plugins/` : plugins empaquetés uploadés via l'interface ou importés via le CLI.
- `tar/` : packages compressés de plugins générés après l'exécution de `nb source build <plugin> --tar`.

## Chemins de chargement et priorité des plugins

Les plugins peuvent exister à plusieurs emplacements ; au démarrage, NocoBase les charge selon l'ordre de priorité suivant :

1. La version du code source dans `source/packages/plugins` (pour le développement et le débogage locaux, synchronisée automatiquement par `nb` depuis `plugins/`).
2. La version empaquetée dans `storage/plugins` (uploadée via l'interface ou importée via le CLI).
3. Les packages de dépendances dans `node_modules` (installés via npm/yarn ou intégrés au framework).

Si un plugin portant le même nom existe à la fois dans le répertoire source et dans le répertoire empaqueté, NocoBase priorisera le chargement de la version source, ce qui facilite les surcharges locales et le débogage.

## Modèle de répertoire de plugin

Créez un plugin avec le CLI :

```bash
nb scaffold plugin @my-project/plugin-hello
```

La structure de répertoire générée est la suivante :

```bash
plugins/@my-project/plugin-hello/
├── dist/                    # Sortie de construction (générée à la demande)
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
├── client-v2.js             # Artefact de construction frontend
├── server.d.ts              # Déclarations de types serveur
├── server.js                # Artefact de construction serveur
├── .npmignore               # Configuration d'ignorance pour la publication
└── package.json
```

:::tip Astuce

Une fois la construction terminée, le répertoire `dist/` ainsi que les fichiers `client-v2.js` et `server.js` seront chargés lors de l'activation du plugin. Pendant le développement, il suffit de modifier le répertoire `src/` ; avant la publication, exécutez `nb source build <plugin>` ou `nb source build <plugin> --tar`.

:::

## Liens connexes

- [Écrire votre premier plugin](./write-your-first-plugin.md) — créez un plugin de zéro et expérimentez le flux complet de développement
- [Aperçu du développement serveur](./server/index.md) — présentation et concepts centraux des plugins serveur
- [Aperçu du développement client](./client/index.md) — présentation et concepts centraux des plugins client
- [Construction et packaging](./build.md) — processus de construction, de packaging et de distribution des plugins
- [Gestion des dépendances](./dependency-management.md) — déclaration et gestion des dépendances de plugins
