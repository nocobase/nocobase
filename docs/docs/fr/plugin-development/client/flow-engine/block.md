---
title: "Extension de bloc"
description: "Développement d'extensions de bloc NocoBase : classes parentes BlockModel, DataBlockModel, CollectionBlockModel, TableBlockModel et leurs modes d'enregistrement."
keywords: "extension de bloc,Block,BlockModel,DataBlockModel,CollectionBlockModel,TableBlockModel,renderComponent,NocoBase"
---

# Extension de bloc

Dans NocoBase, un **bloc (Block)** est une zone de contenu sur la page — par exemple un tableau, un formulaire, un graphique, des détails, etc. En étendant les classes parentes BlockModel, vous pouvez créer un bloc personnalisé et l'enregistrer dans le menu « Ajouter un bloc ».

## Choix de la classe parente

NocoBase fournit trois classes parentes de bloc, à choisir selon vos besoins de données :

| Classe parente | Héritage | Cas d'usage |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| `BlockModel` | Bloc le plus basique | Bloc d'affichage sans source de données |
| `DataBlockModel` | Hérite de `BlockModel` | Données nécessaires mais pas liées à une table NocoBase |
| `CollectionBlockModel` | Hérite de `DataBlockModel` | Lié à une table NocoBase, récupère automatiquement les données |
| `TableBlockModel` | Hérite de `CollectionBlockModel` | Bloc tableau complet, avec colonnes, barre d'actions, pagination, etc. |

Chaîne d'héritage : `BlockModel` → `DataBlockModel` → `CollectionBlockModel` → `TableBlockModel`.

En général, si vous voulez un bloc tableau prêt à l'emploi, utilisez directement `TableBlockModel` — il fournit colonnes, barre d'actions, pagination, tri et toutes les capacités essentielles ; c'est la classe parente la plus utilisée. Si vous avez besoin d'un rendu entièrement personnalisé (par exemple liste de cartes, ligne de temps, etc.), utilisez `CollectionBlockModel` et écrivez votre propre `renderComponent`. Pour afficher uniquement du contenu statique ou une UI personnalisée, `BlockModel` suffit.

`DataBlockModel` a un positionnement particulier — il n'ajoute aucune nouvelle propriété ni méthode, son corps de classe est vide. Son rôle est de **classification** : les blocs étendant `DataBlockModel` sont regroupés dans le sous-menu « Blocs de données » de l'UI. Si votre bloc gère sa propre logique de récupération de données (sans passer par la liaison Collection standard de NocoBase), vous pouvez étendre `DataBlockModel`. Par exemple, le `ChartBlockModel` du plugin de graphique fonctionne ainsi — il utilise un `ChartResource` personnalisé pour récupérer les données, sans liaison de table standard. Dans la plupart des cas, vous n'utiliserez pas directement `DataBlockModel` ; `CollectionBlockModel` ou `TableBlockModel` suffisent.

## Exemple BlockModel

Un bloc minimaliste — supportant l'édition de contenu HTML :

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-07_17.23.49.mp4" type="video/mp4">
</video>

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Cet exemple couvre les trois étapes du développement d'un bloc :

1. **`renderComponent()`** — rend l'UI du bloc en lisant les attributs via `this.props`
2. **`define()`** — définit le nom affiché dans le menu « Ajouter un bloc »
3. **`registerFlow()`** — ajoute un panneau de configuration visuelle ; l'utilisateur peut éditer le HTML directement dans l'interface

## Exemple CollectionBlockModel

Si le bloc doit être lié à une table de données NocoBase, utilisez `CollectionBlockModel`. Il gère automatiquement la récupération des données :

```tsx
// models/ManyRecordBlockModel.tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '@nocobase/flow-engine';

export class ManyRecordBlockModel extends CollectionBlockModel {
  // Déclare qu'il s'agit d'un bloc à plusieurs enregistrements
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h3>Bloc de table de données</h3>
        {/* resource.getData() récupère les données de la table */}
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records'),
});
```

Par rapport à `BlockModel`, `CollectionBlockModel` ajoute les éléments suivants :

- **`static scene`** — déclare le scénario du bloc. Valeurs courantes : `BlockSceneEnum.many` (liste à plusieurs enregistrements), `BlockSceneEnum.one` (détail/formulaire à enregistrement unique). L'énumération complète inclut aussi `new`, `select`, `filter`, `subForm`, `bulkEditForm`, etc.
- **`createResource()`** — crée la ressource de données ; `MultiRecordResource` sert à récupérer plusieurs enregistrements
- **`this.resource.getData()`** — récupère les données de la table

## Exemple TableBlockModel

`TableBlockModel` étend `CollectionBlockModel` ; c'est le bloc tableau complet intégré à NocoBase — colonnes de champs, barre d'actions, pagination, tri, etc. Quand l'utilisateur sélectionne « Table » dans « Ajouter un bloc », c'est ce qui est utilisé.

En général, si le `TableBlockModel` intégré répond déjà à vos besoins, l'utilisateur peut simplement l'ajouter depuis l'interface, et le développeur n'a rien à faire. Vous n'avez besoin de l'étendre que pour **personnaliser TableBlockModel** — par exemple :

- Surcharger `customModelClasses` pour remplacer les groupes d'actions ou les modèles de colonnes intégrés
- Limiter le bloc à des tables spécifiques via `filterCollection`
- Enregistrer des Flows supplémentaires pour ajouter des éléments de configuration

```tsx
// Exemple : bloc tableau limité à la table todoItems
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

Voir [Faire un plugin de gestion de données front+back](../examples/fullstack-plugin) pour un exemple complet de personnalisation de `TableBlockModel`.

## Enregistrer un bloc

Dans `load()` du Plugin :

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleBlockModel: {
        loader: () => import('./models/SimpleBlockModel'),
      },
      ManyRecordBlockModel: {
        loader: () => import('./models/ManyRecordBlockModel'),
      },
    });
  }
}
```

Une fois enregistré, en cliquant sur « Ajouter un bloc » dans l'interface NocoBase, vous verrez votre bloc personnalisé.

## Code source complet

- [@nocobase-example/plugin-simple-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block) — exemple BlockModel
- [@nocobase-example/plugin-collection-block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-collection-block) — exemple CollectionBlockModel

## Liens connexes

- [Pratique : faire un bloc d'affichage personnalisé](../examples/custom-block) — construire un bloc BlockModel configurable de zéro
- [Pratique : faire un plugin de gestion de données front+back](../examples/fullstack-plugin) — exemple complet TableBlockModel + champ personnalisé + action personnalisée
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel et registerFlow
- [Extension de champ](./field) — composant de champ personnalisé
- [Extension d'action](./action) — bouton d'action personnalisé
- [Aide-mémoire Resource API](../../../api/flow-engine/resource.md) — signatures complètes des méthodes de MultiRecordResource / SingleRecordResource
- [Définition de Flow FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — paramètres complets de registerFlow et types d'événements
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète
