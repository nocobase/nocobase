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
