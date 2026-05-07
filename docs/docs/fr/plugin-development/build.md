---
title: "Construction et packaging"
description: "Construction et packaging de plugins NocoBase : yarn build, yarn nocobase tar, configuration personnalisée build.config.ts, packaging client avec Rsbuild, packaging serveur avec tsup."
keywords: "construction de plugin,packaging de plugin,yarn build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Construction et packaging

Une fois le développement du plugin terminé, vous devez passer par deux étapes — construction (compilation du code source) et packaging (génération d'un `.tar.gz`) — avant de pouvoir le distribuer à d'autres applications NocoBase.

## Construire le plugin

La construction compile le code source TypeScript de `src/` en JavaScript : le code client est packagé par Rsbuild, et le code serveur par tsup :

```bash
yarn build @my-project/plugin-hello
```

Les artefacts de build sont produits dans le répertoire `dist/` à la racine du plugin.

:::tip Astuce

Si le plugin a été créé dans le dépôt source, la première construction déclenchera une vérification de type sur l'ensemble du dépôt, ce qui peut prendre du temps. Veillez à ce que les dépendances soient installées et que le dépôt soit dans un état compilable.

:::

## Packager le plugin

Le packaging compresse les artefacts de build en un fichier `.tar.gz`, pratique pour les téléverser dans d'autres environnements :

```bash
yarn nocobase tar @my-project/plugin-hello
```

Par défaut, le fichier de package est produit dans `storage/tar/@my-project/plugin-hello.tar.gz`.

Vous pouvez également utiliser le paramètre `--tar` pour combiner construction et packaging en une seule étape :

```bash
yarn build @my-project/plugin-hello --tar
```

## Téléverser dans une autre application NocoBase

Téléversez et décompressez le fichier `.tar.gz` dans le répertoire `./storage/plugins` de l'application cible. Voir [Installer et mettre à niveau les plugins](../get-started/install-upgrade-plugins.mdx) pour les détails.

## Configuration de construction personnalisée

En général, la configuration de construction par défaut suffit. Si vous avez besoin de personnaliser — par exemple modifier le point d'entrée du package, ajouter des alias ou ajuster les options de compression — vous pouvez créer un fichier `build.config.ts` à la racine du plugin :

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Modifier la configuration de packaging Rsbuild côté client (src/client-v2)
    // Référence : https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // Modifier la configuration de packaging tsup côté serveur (src/server)
    // Référence : https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback avant le démarrage de la construction, par exemple nettoyer les fichiers temporaires, générer du code, etc.
  },
  afterBuild: (log) => {
    // Callback après la fin de la construction, par exemple copier des ressources supplémentaires, sortir des statistiques, etc.
  },
});
```

Quelques points clés :

- `modifyRsbuildConfig` — sert à ajuster le packaging client : ajouter des plugins Rsbuild, modifier les alias resolve, ajuster la stratégie de code splitting, etc. Les options de configuration sont décrites dans la [documentation Rsbuild](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` — sert à ajuster le packaging serveur : modifier target, externals, entry, etc. Les options de configuration sont décrites dans la [documentation tsup](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` — hooks avant et après la construction, qui reçoivent une fonction `log` pour produire du logging. Par exemple, générer des fichiers de code dans `beforeBuild`, ou copier des ressources statiques vers le répertoire d'artefacts dans `afterBuild`

## Liens connexes

- [Écrire votre premier plugin](./write-your-first-plugin.md) — Création d'un plugin de zéro, incluant la chaîne complète construction/packaging
- [Structure du projet](./project-structure.md) — Comprendre le rôle des répertoires `packages/plugins`, `storage/tar`, etc.
- [Gestion des dépendances](./dependency-management.md) — Déclaration des dépendances de plugin et dépendances globales
- [Vue d'ensemble du développement de plugins](./index.md) — Présentation générale du développement de plugin
- [Installer et mettre à niveau les plugins](../get-started/install-upgrade-plugins.mdx) — Téléverser le fichier package dans l'environnement cible
