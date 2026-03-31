:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Écrire votre premier plugin

Ce guide vous accompagnera pas à pas dans la création d'un plugin de bloc utilisable sur vos pages. Il vous aidera à comprendre la structure de base et le flux de travail de développement des plugins NocoBase.

## Prérequis

Avant de commencer, assurez-vous d'avoir correctement installé NocoBase. Si ce n'est pas déjà fait, vous pouvez consulter les guides d'installation suivants :

- [Installer avec create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Installer depuis les sources Git](/get-started/installation/git)

Une fois l'installation terminée, vous pourrez officiellement démarrer votre parcours de développement de plugins.

## Étape 1 : Créer l'ossature du plugin via la CLI

Exécutez la commande suivante à la racine de votre dépôt pour générer rapidement un plugin vide :

```bash
yarn pm create @my-project/plugin-hello
```

Une fois la commande exécutée avec succès, des fichiers de base seront générés dans le répertoire `packages/plugins/@my-project/plugin-hello`. Voici la structure par défaut :

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Exportation par défaut du plugin côté serveur
     ├─ client                   # Emplacement du code côté client
     │  ├─ index.tsx             # Classe de plugin côté client exportée par défaut
     │  ├─ plugin.tsx            # Point d'entrée du plugin (étend @nocobase/client Plugin)
     │  ├─ models                # Optionnel : modèles frontend (par exemple, nœuds de flux de travail)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Emplacement du code côté serveur
     │  ├─ index.ts              # Classe de plugin côté serveur exportée par défaut
     │  ├─ plugin.ts             # Point d'entrée du plugin (étend @nocobase/server Plugin)
     │  ├─ collections           # Optionnel : collections côté serveur
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

Une fois la création terminée, vous pouvez accéder à la page du gestionnaire de plugins dans votre navigateur (adresse par défaut : http://localhost:13000/admin/settings/plugin-manager) pour vérifier si le plugin apparaît bien dans la liste.

## Étape 2 : Implémenter un simple bloc client

Nous allons maintenant ajouter un modèle de bloc personnalisé à notre plugin pour afficher un message de bienvenue.

1.  **Créez un nouveau fichier de modèle de bloc** `client/models/HelloBlockModel.tsx` :

```tsx pure
import { BlockModel } from '@nocobase/client';
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

2.  **Enregistrez le modèle de bloc**. Modifiez `client/models/index.ts` pour exporter le nouveau modèle, afin qu'il puisse être chargé par le runtime frontend :

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Après avoir sauvegardé le code, si vous exécutez un script de développement, vous devriez voir les journaux de rechargement à chaud (hot-reload) dans la sortie du terminal.

## Étape 3 : Activer et tester le plugin

Vous pouvez activer le plugin via la ligne de commande ou l'interface :

-   **Ligne de commande**

    ```bash
    yarn pm enable @my-project/plugin-hello
    ```

-   **Interface d'administration** : Accédez au gestionnaire de plugins, localisez `@my-project/plugin-hello` et cliquez sur « Activer ».

Après l'activation, créez une nouvelle page « Modern page (v2) ». Lorsque vous ajouterez des blocs, vous verrez apparaître « Hello block ». Insérez-le dans la page pour visualiser le contenu de bienvenue que vous venez de créer.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Étape 4 : Compiler et empaqueter

Lorsque vous êtes prêt à distribuer le plugin vers d'autres environnements, vous devez d'abord le compiler, puis l'empaqueter :

```bash
yarn build @my-project/plugin-hello --tar
# Ou exécutez en deux étapes
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> **Conseil** : Si le plugin est créé dans le dépôt source, la première compilation déclenchera une vérification de type complète du dépôt, ce qui peut prendre un certain temps. Il est recommandé de s'assurer que les dépendances sont installées et que le dépôt est dans un état compilable.

Une fois la compilation terminée, le fichier empaqueté se trouve par défaut dans `storage/tar/@my-project/plugin-hello.tar.gz`.

## Étape 5 : Télécharger vers une autre application NocoBase

Téléchargez et décompressez le fichier dans le répertoire `./storage/plugins` de l'application cible. Pour plus de détails, consultez [Installer et mettre à jour des plugins](../get-started/install-upgrade-plugins.mdx).