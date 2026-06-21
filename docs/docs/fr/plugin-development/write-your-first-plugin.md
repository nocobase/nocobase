---
title: "Écrire votre premier plugin NocoBase"
description: "Créez un plugin de bloc de zéro : yarn pm create, ossature du plugin, répertoires client/server, enregistrer un bloc, flux de développement et de débogage."
keywords: "écrire un plugin, premier plugin, yarn pm create, ossature de plugin, plugin de bloc, développement de plugins NocoBase"
---

# Écrire votre premier plugin

Cette documentation vous accompagnera pour créer de zéro un plugin de bloc utilisable dans une page, et vous aidera à comprendre la structure de base et le flux de développement d'un plugin NocoBase.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé NocoBase. Si ce n'est pas encore fait, vous pouvez consulter :

- [Installer avec create-nocobase-app](../get-started/installation/create-nocobase-app)
- [Installer depuis les sources Git](../get-started/installation/git)

Une fois l'installation terminée, vous pouvez commencer.

## Étape 1 : créer l'ossature du plugin via la CLI

Exécutez la commande suivante à la racine du dépôt pour générer rapidement un plugin vide :

```bash
yarn pm create @my-project/plugin-hello
```

Une fois la commande exécutée avec succès, des fichiers de base seront générés dans le répertoire `packages/plugins/@my-project/plugin-hello`. La structure par défaut est la suivante :

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client-v2.d.ts
  ├─ client-v2.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Export par défaut du plugin serveur
     ├─ client-v2                 # Emplacement du code client
     │  ├─ index.tsx             # Classe de plugin client exportée par défaut
     │  ├─ plugin.tsx            # Point d'entrée du plugin (étend @nocobase/client-v2 Plugin)
     │  ├─ models                # Optionnel : modèles frontend (par exemple, nœuds de flux)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Emplacement du code serveur
     │  ├─ index.ts              # Classe de plugin serveur exportée par défaut
     │  ├─ plugin.ts             # Point d'entrée du plugin (étend @nocobase/server Plugin)
     │  ├─ collections           # Optionnel : collections serveur
     │  ├─ migrations            # Optionnel : migrations de données
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Optionnel : multilingue
        ├─ en-US.json
        └─ zh-CN.json
```

Une fois la création terminée, vous pouvez accéder à la page «Gestionnaire de plugins» dans votre navigateur (adresse par défaut : http://localhost:13000/admin/settings/plugin-manager) pour vérifier que le plugin apparaît bien dans la liste.

## Étape 2 : implémenter un bloc client simple

Ajoutons maintenant un modèle de bloc personnalisé au plugin pour afficher un texte de bienvenue.

1. **Ajoutez le fichier de modèle de bloc** `client-v2/models/HelloBlockModel.tsx` :

```tsx pure
import { BlockModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Enregistrez le modèle de bloc**. Modifiez `client-v2/models/index.ts` pour exporter le nouveau modèle, afin qu'il puisse être chargé par le runtime frontend :

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Après avoir sauvegardé le code, si vous exécutez un script de développement, vous devriez voir des journaux de rechargement à chaud (hot-reload) dans la sortie du terminal.

## Étape 3 : activer et tester le plugin

Vous pouvez activer le plugin via la ligne de commande ou via l'interface :

- **Ligne de commande**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Interface d'administration** : accédez au «Gestionnaire de plugins», localisez `@my-project/plugin-hello` et cliquez sur «Activer».

Après l'activation, créez une nouvelle page «Modern page (v2)». Lors de l'ajout de blocs, vous verrez apparaître «Hello block» ; insérez-le dans la page pour visualiser le contenu de bienvenue que vous venez de créer.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Rendre le plugin préinstallé ou activé par défaut (optionnel)

Ce qui précède décrit l'activation manuelle d'un plugin individuel. Si vous maintenez votre propre application NocoBase et souhaitez que certains plugins soient automatiquement disponibles après l'exécution de `nocobase install` (première installation) ou `nocobase upgrade` (mise à niveau), vous pouvez utiliser deux variables d'environnement pour contrôler l'état par défaut des plugins :

- **`APPEND_PRESET_LOCAL_PLUGINS` (ajouter aux plugins locaux préinstallés par défaut)** — ajoute le plugin à la liste des plugins locaux préinstallés ; il apparaît dans le «Gestionnaire de plugins» après l'installation, mais n'est pas activé par défaut et doit être activé manuellement
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (ajouter aux plugins intégrés par défaut)** — ajoute le plugin à la liste des plugins intégrés, qui sont automatiquement activés lors de l'installation ; en tant que plugins intégrés, **ils ne peuvent pas être désactivés ni supprimés dans le «Gestionnaire de plugins»**

La valeur de ces deux variables est le nom du package du plugin (le champ `name` dans `package.json`), avec plusieurs plugins séparés par des virgules. Configurez-les dans le fichier `.env` :

```bash
# Préinstallé par défaut : apparaît dans la liste du Gestionnaire de plugins, mais n'est pas activé automatiquement
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world

# Activé par défaut : installé et activé automatiquement, et ne peut pas être désactivé depuis l'interface
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world
```

En règle générale, `yarn pm enable` suffit pour le développement et le débogage en local. Ces deux variables sont davantage adaptées aux scénarios de distribution «prêts à l'emploi» — par exemple, si vous avez empaqueté une application NocoBase avec un ensemble fixe de plugins et souhaitez que ces plugins soient directement disponibles après l'initialisation.

:::tip Astuce

- Le plugin doit être téléchargé localement et pouvoir être résolu dans `node_modules` ; voir [Structure du projet](./project-structure.md)
- Après configuration, il faut réexécuter `nocobase install` ou `nocobase upgrade` pour que les changements prennent effet
- La description complète des variables d'environnement est disponible dans [Variables d'environnement](../get-started/installation/env.md#append_preset_local_plugins)

:::

## Étape 4 : compiler et empaqueter

Lorsque vous êtes prêt à distribuer votre plugin vers d'autres environnements, vous devez d'abord le compiler, puis l'empaqueter :

```bash
yarn build @my-project/plugin-hello --tar
# Ou exécutez en deux étapes
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

:::tip Astuce

Si le plugin est créé dans le dépôt source, la première compilation déclenchera une vérification de type complète du dépôt, ce qui peut prendre un certain temps. Il est recommandé de s'assurer que les dépendances sont installées et que le dépôt est dans un état compilable.

:::

Une fois la compilation terminée, le fichier empaqueté se trouve par défaut dans `storage/tar/@my-project/plugin-hello.tar.gz`.

:::tip Astuce

Avant la publication, il est recommandé d'écrire des tests pour vérifier la logique centrale du plugin ; NocoBase fournit une chaîne d'outils de tests serveur complète. Voir [Test](./server/test.md).

:::

## Étape 5 : téléverser vers une autre application NocoBase

Téléversez et décompressez le fichier dans le répertoire `./storage/plugins` de l'application cible. Pour les étapes détaillées, voir [Installer et mettre à niveau les plugins](../get-started/install-upgrade-plugins.mdx).

## Liens connexes

- [Aperçu du développement de plugins](./index.md) — comprendre l'architecture micro-noyau de NocoBase et le cycle de vie des plugins
- [Structure du projet](./project-structure.md) — conventions de l'arborescence du projet, chemins de chargement et priorité des plugins
- [Aperçu du développement serveur](./server/index.md) — présentation et concepts centraux des plugins serveur
- [Aperçu du développement client](./client/index.md) — présentation et concepts centraux des plugins client
- [Build et empaquetage](./build.md) — processus de build, d'empaquetage et de distribution des plugins
- [Test](./server/test.md) — écrire des tests de plugins serveur
- [Installer avec create-nocobase-app](../get-started/installation/create-nocobase-app) — l'une des méthodes d'installation de NocoBase
- [Installer depuis les sources Git](../get-started/installation/git) — installer NocoBase depuis le code source
- [Installer et mettre à niveau les plugins](../get-started/install-upgrade-plugins.mdx) — téléverser le plugin empaqueté vers d'autres environnements
- [Variables d'environnement](../get-started/installation/env.md) — configuration des variables d'environnement pour les plugins préinstallés et intégrés
