---
title: "Construction et packaging"
description: "Construction et packaging de plugins NocoBase : nb source build, configuration personnalisée build.config.ts, packaging client avec Rsbuild, packaging serveur avec tsup."
keywords: "construction de plugin,packaging de plugin,nb source build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Construction et packaging

Une fois le développement du plugin terminé, vous devez passer par deux étapes — construction (compilation du code source) et packaging (génération d'un `.tgz`) — avant de pouvoir le distribuer à d'autres applications NocoBase.

## Construire le plugin

Exécutez la commande de construction dans le répertoire source (`<app-path>/source/`). La construction compile le code TypeScript de `src/` en JavaScript — le code client est empaqueté par Rsbuild, et le code serveur par tsup :

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello
```

Les artefacts de construction sont produits dans le répertoire `dist/` à la racine du plugin.

:::tip Astuce

La première construction peut déclencher une vérification de type sur l'ensemble du dépôt, ce qui peut prendre du temps. Veillez à ce que les dépendances soient installées et que le dépôt soit dans un état compilable.

:::

## Empaqueter le plugin

Exécutez également dans le répertoire source (`<app-path>/source/`). Le paramètre `--tar` permet de combiner construction et packaging en une seule étape, générant un fichier compressé `.tgz` :

```bash
cd <app-path>/source
nb source build @my-project/plugin-hello --tar
```

Le fichier empaqueté est produit par défaut dans le répertoire `source/storage/tar/`. Une fois la construction terminée, la commande affiche le chemin complet du tarball.

## Téléverser dans une autre application NocoBase

Téléversez et décompressez le fichier `.tar.gz` dans le répertoire `./storage/plugins` de l'application cible. Voir [Installer et mettre à niveau les plugins](../get-started/install-upgrade-plugins.mdx) pour les détails.

### Activer le plugin par défaut

Après le téléversement, le plugin n'est pas automatiquement activé — il apparaît dans le « Gestionnaire de plugins » et doit être activé manuellement. Si vous maintenez votre propre application NocoBase et souhaitez que le plugin soit activé par défaut avec l'application, vous pouvez utiliser la variable d'environnement `APPEND_PRESET_BUILT_IN_PLUGINS` (ajouter aux plugins intégrés par défaut) pour le contrôler. Consultez [Rendre le plugin préinstallé ou activé par défaut](./write-your-first-plugin.md#rendre-le-plugin-préinstallé-ou-activé-par-défaut-optionnel) pour plus de détails.

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

- [Écrire votre premier plugin](./write-your-first-plugin.md) — création d'un plugin de zéro, incluant la chaîne complète construction/packaging
- [Structure du répertoire du projet](./project-structure.md) — comprendre le rôle des répertoires `plugins/`, `storage/tar`, etc.
- [Gestion des dépendances](./dependency-management.md) — déclaration des dépendances de plugin et dépendances globales
- [Présentation du développement de plugins](./index.md) — présentation générale du développement de plugins
- [Installer et mettre à niveau les plugins](../get-started/install-upgrade-plugins.mdx) — téléverser le fichier package dans l'environnement cible
- [Variables d'environnement](../get-started/installation/env.md) — configuration des variables d'environnement pour les plugins préinstallés et intégrés
