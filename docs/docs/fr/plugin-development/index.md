---
title: "Présentation du développement de plugins NocoBase"
description: "Architecture micro-noyau NocoBase, cycle de vie des plugins, structure des répertoires, plug-and-play, full-stack, code source client/server, métadonnées package.json."
keywords: "développement de plugins,plugin NocoBase,micro-noyau,cycle de vie des plugins,full-stack,extension NocoBase"
---

# Présentation du développement de plugins

NocoBase adopte une **architecture micro-noyau** — le cœur se charge uniquement de l'ordonnancement du cycle de vie des plugins, de la gestion des dépendances et de l'encapsulation des capacités de base. Toutes les fonctionnalités métier sont fournies sous forme de plugins. Comprendre la structure organisationnelle, le cycle de vie et le mode de gestion des plugins est la première étape pour personnaliser NocoBase.

## Concepts clés

- **Plug and play** : vous pouvez installer, activer ou désactiver des plugins selon vos besoins, ce qui permet de combiner des fonctionnalités métier de manière flexible sans modifier le code.
- **Full-stack** : les plugins incluent généralement des implémentations côté serveur et côté client, la logique des données et les interactions de l'interface sont gérées ensemble.

## Structure de base d'un plugin

Chaque plugin est un package npm indépendant, contenant généralement la structure de répertoires suivante :

```bash
plugin-hello/
├─ package.json          # Nom du plugin, dépendances et métadonnées du plugin NocoBase
├─ client-v2.js          # Artefact de compilation frontend, pour le chargement à l'exécution
├─ server.js             # Artefact de compilation côté serveur, pour le chargement à l'exécution
├─ src/
│  ├─ client-v2/         # Code source côté client, peut enregistrer des blocs, des actions, des champs, etc.
│  └─ server/            # Code source côté serveur, peut enregistrer des ressources, des événements, des commandes, etc.
```

## Prérequis

Avant de développer un plugin, vous devez d'abord initialiser une application via le CLI NocoBase. Le CLI prend en charge deux sources : npm et Git :

- **Source npm** (`create-nocobase-app`) : idéale pour démarrer rapidement, prête à l'emploi.
- **Source Git** (recommandée) : clonez le dépôt source de NocoBase ; lors du développement avec l'IA, vous pouvez directement consulter le code source du framework pour de meilleurs résultats.

Voir [Installer l'application via le CLI](../nocobase-cli/installation/cli.md) ou le [Guide de démarrage AI Agent](../ai/quick-start.mdx).

## Conventions de répertoires et ordre de chargement

L'application créée via `nb init` a la structure de répertoires suivante :

```bash
<app-path>/
├── .nb/                  # Métadonnées sauvegardées par le CLI pour l'env courant
├── source/               # Code source de l'application (projet NocoBase)
├── storage/              # Répertoire de données d'exécution
│   └── plugins/          # Plugins compilés (uploadés ou importés)
├── plugins/              # Code source de vos plugins (nb scaffold plugin génère ici)
└── .env                  # Fichier de variables d'environnement de l'application
```

- `plugins/` : le répertoire du code source de vos plugins en développement. Les plugins créés via `nb scaffold plugin` sont placés ici. `nb` les synchronise automatiquement vers `source/packages/plugins/` pour le développement et la construction ; vous n'avez pas besoin de manipuler manuellement le répertoire `source/`.
- `storage/plugins/` : stocke les plugins déjà compilés, comme les plugins commerciaux ou tiers.

## Cycle de vie et états des plugins

Un plugin passe généralement par les étapes suivantes :

1. **Création (create)** : créer un modèle de plugin via le CLI.
2. **Téléchargement (pull)** : télécharger le package du plugin en local, sans encore l'écrire dans la base de données.
3. **Activation (enable)** : lors de la première activation, les étapes « enregistrement + initialisation » sont exécutées ; les activations suivantes ne font que charger la logique.
4. **Désactivation (disable)** : arrêter l'exécution du plugin.
5. **Suppression (remove)** : supprimer complètement le plugin de NocoBase.

:::tip Astuce

- `pull` ne fait que télécharger le package du plugin ; le processus d'installation réel est déclenché par le premier `enable`.
- Si un plugin est seulement `pull` mais non activé, il ne sera pas chargé.

:::

### Exemples de commandes CLI

```bash
# 1. Créer l'ossature du plugin
nb scaffold plugin @my-project/plugin-hello

# 2. Activer le plugin (s'installe automatiquement lors de la première activation)
nb plugin enable @my-project/plugin-hello

# 3. Désactiver le plugin
nb plugin disable @my-project/plugin-hello
```

## Interface de gestion des plugins

Accédez au « Gestionnaire de plugins » dans votre navigateur pour visualiser et gérer les plugins de manière intuitive :

**Adresse par défaut :** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Gestionnaire de plugins](https://static-docs.nocobase.com/20251030195350.png)

## Liens connexes

- [Écrire votre premier plugin](./write-your-first-plugin.md) — créer un plugin de bloc de zéro, démarrer rapidement le flux de développement
- [Structure du répertoire du projet](./project-structure.md) — conventions de l'arborescence NocoBase et ordre de chargement des plugins
- [Aperçu du développement serveur](./server/index.md) — présentation et concepts centraux des plugins serveur
- [Aperçu du développement client](./client/index.md) — présentation et concepts centraux des plugins client
- [Construction et packaging](./build.md) — processus de construction et de packaging des plugins
- [Gestion des dépendances](./dependency-management.md) — déclaration et gestion des dépendances de plugins
