---
title: "Aperçu de FlowEngine"
description: "Guide de développement de plugins NocoBase FlowEngine : utilisation de base de FlowModel, renderComponent, registerFlow, configuration uiSchema, choix de la classe parente."
keywords: "FlowEngine,FlowModel,BlockModel,registerFlow,uiSchema,renderComponent,NocoBase"
---

# FlowEngine

Dans NocoBase, **FlowEngine (moteur de flow)** est le moteur central qui pilote la configuration visuelle. Les blocs, champs et boutons d'action de l'interface NocoBase sont tous gérés par FlowEngine — leur rendu, leur panneau de configuration et la persistance de leur configuration.

![20260403215904](https://static-docs.nocobase.com/20260403215904.png)

Pour les développeurs de plugins, FlowEngine fournit deux concepts clés :

- **FlowModel** — modèle de composant configurable, chargé du rendu UI et de la gestion des props
- **Flow** — processus de configuration, qui définit le panneau de configuration du composant et la logique de traitement des données

Si votre composant doit apparaître dans le menu « Ajouter un bloc / champ / action », ou doit supporter la configuration visuelle dans l'interface, il faut l'encapsuler avec FlowModel. Sinon, un composant React standard suffit — voir [Component vs FlowModel](../component-vs-flow-model).

## Qu'est-ce qu'un FlowModel

À la différence d'un composant React standard, FlowModel ne gère pas seulement le rendu UI : il gère aussi la source des props, la définition du panneau de configuration et la persistance de la configuration. En somme : les props d'un composant standard sont fixées, les props d'un FlowModel sont générées dynamiquement par le Flow.

Pour comprendre l'architecture globale de FlowEngine, voir [Documentation complète FlowEngine](../../../flow-engine/index.md). Ci-dessous, présentation pour les développeurs de plugins.

## Exemple minimal

De la création à l'enregistrement, un FlowModel se construit en trois étapes :

### 1. Étendre la classe parente et implémenter renderComponent

```tsx
// models/HelloBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Hello FlowEngine!</h3>
        <p>Voici un bloc personnalisé.</p>
      </div>
    );
  }
}

// define() définit le nom affiché dans le menu
HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

`renderComponent()` est la méthode de rendu du modèle, similaire au `render()` d'un composant React. `tExpr()` sert à la traduction différée — car `define()` s'exécute au chargement du module, alors qu'i18n n'est pas encore initialisé. Voir [Capacités courantes du Context → tExpr](../ctx/common-capabilities#texpr) pour les détails.

### 2. Enregistrer dans le Plugin

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class MyPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        // Chargement à la demande : ne charge le module qu'à la première utilisation
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

### 3. Utiliser depuis l'interface

Une fois enregistré et le plugin activé (voir [Aperçu du développement de plugin](../../index.md) pour activer un plugin), créez une nouvelle page dans l'interface NocoBase, cliquez sur « Ajouter un bloc » et vous verrez votre « Hello block ».

![20260403221815](https://static-docs.nocobase.com/20260403221815.png)

## Ajouter des éléments de configuration avec registerFlow

Le simple rendu ne suffit pas — la valeur principale de FlowModel réside dans sa **configurabilité**. Avec `registerFlow()`, vous pouvez ajouter un panneau de configuration au modèle pour que l'utilisateur en modifie les propriétés depuis l'interface.

Par exemple, un bloc supportant l'édition de contenu HTML :

```tsx
// models/SimpleBlockModel.tsx
import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    // La valeur de this.props vient du handler du Flow
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender', // S'exécute avant le rendu
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      // uiSchema définit l'UI du panneau de configuration
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      // Valeurs par défaut
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      // handler écrit la valeur du panneau de configuration dans les props du modèle
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Quelques points clés :

- **`on: 'beforeRender'`** — indique que ce Flow s'exécute avant le rendu ; la valeur du panneau de configuration est écrite dans `this.props` avant le rendu
- **`uiSchema`** — définit l'UI du panneau de configuration au format JSON Schema. Voir [UI Schema](../../../flow-engine/ui-schema) pour la syntaxe
- **`handler(ctx, params)`** — `params` est la valeur saisie par l'utilisateur dans le panneau de configuration ; on l'écrit dans le modèle via `ctx.model.props`
- **`defaultParams`** — valeurs par défaut du panneau de configuration

## Écritures uiSchema courantes

`uiSchema` est basé sur JSON Schema ; v2 reste compatible avec la syntaxe uiSchema, mais ses cas d'usage sont limités — principalement pour décrire l'UI de formulaire dans le panneau de configuration d'un Flow. La plupart des rendus de composants au runtime sont recommandés directement avec des composants Antd, sans passer par uiSchema.

Voici les composants les plus courants (référence complète : [UI Schema](../../../flow-engine/ui-schema)) :

```ts
uiSchema: {
  // Saisie texte
  title: {
    type: 'string',
    title: 'Titre',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  // Texte multiligne
  content: {
    type: 'string',
    title: 'Contenu',
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
  },
  // Liste déroulante
  type: {
    type: 'string',
    title: 'Type',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: 'Principal', value: 'primary' },
      { label: 'Par défaut', value: 'default' },
      { label: 'Pointillé', value: 'dashed' },
    ],
  },
  // Interrupteur
  bordered: {
    type: 'boolean',
    title: 'Afficher la bordure',
    'x-decorator': 'FormItem',
    'x-component': 'Switch',
  },
}
```

Chaque champ est enveloppé par `'x-decorator': 'FormItem'` pour porter automatiquement le titre et la mise en page.

## Paramètres de define()

`FlowModel.define()` définit les métadonnées du modèle qui contrôlent son affichage dans le menu. Le plus utilisé est `label`, mais d'autres paramètres existent :

| Paramètre | Type | Description |
|------|------|------|
| `label` | `string \| ReactNode` | Nom affiché dans le menu « Ajouter un bloc / champ / action », supporte la traduction différée via `tExpr()` |
| `icon` | `ReactNode` | Icône dans le menu |
| `sort` | `number` | Poids de tri, plus la valeur est petite, plus c'est en avant. Par défaut `0` |
| `hide` | `boolean \| (ctx) => boolean` | Masquer dans le menu, supporte une décision dynamique |
| `group` | `string` | Identifiant de groupe, classe l'entrée dans un sous-menu spécifique |
| `children` | `SubModelItem[] \| (ctx) => SubModelItem[]` | Sous-éléments de menu, supporte une fonction async pour la construction dynamique |
| `toggleable` | `boolean \| (model) => boolean` | Comportement de bascule (unicité sous le même parent) |
| `searchable` | `boolean` | Sous-menu avec recherche |

La plupart des plugins n'ont besoin que du `label` :

```ts
MyBlockModel.define({
  label: tExpr('My block'),
});
```

Pour contrôler le tri ou le masquage, ajoutez `sort` et `hide` :

```ts
MyBlockModel.define({
  label: tExpr('My block'),
  sort: 10,       // Placé plus loin
  hide: (ctx) => !ctx.someCondition,  // Masquage conditionnel
});
```

## Choix de la classe parente FlowModel

NocoBase propose plusieurs classes parentes FlowModel ; choisissez selon ce que vous voulez étendre :

| Classe parente | Utilité | Documentation détaillée |
| ---------------------- | ---------------------------------- | -------------------- |
| `BlockModel` | Bloc standard | [Extension de bloc](./block) |
| `DataBlockModel` | Bloc gérant lui-même la récupération des données | [Extension de bloc](./block) |
| `CollectionBlockModel` | Lié à une table, récupération automatique des données | [Extension de bloc](./block) |
| `TableBlockModel` | Bloc tableau complet, avec colonnes et barre d'actions | [Extension de bloc](./block) |
| `FieldModel` | Composant de champ | [Extension de champ](./field) |
| `ActionModel` | Bouton d'action | [Extension d'action](./action) |

En général : pour un bloc tableau, utilisez `TableBlockModel` (le plus utilisé, prêt à l'emploi) ; pour un rendu entièrement personnalisé, utilisez `CollectionBlockModel` ou `BlockModel` ; pour un champ, `FieldModel` ; pour un bouton d'action, `ActionModel`.

## Liens connexes

- [Extension de bloc](./block) — développer un bloc avec les classes parentes BlockModel
- [Extension de champ](./field) — développer un champ personnalisé avec FieldModel
- [Extension d'action](./action) — développer un bouton d'action avec ActionModel
- [Component vs FlowModel](../component-vs-flow-model) — vous hésitez sur l'approche ?
- [Définition de Flow FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — paramètres complets de registerFlow et types d'événements
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète FlowModel, Flow, Context
- [Démarrage rapide FlowEngine](../../../flow-engine/quickstart) — construire un composant bouton orchestrable de zéro
- [Aperçu du développement de plugin](../../index.md) — présentation générale du développement de plugin
- [UI Schema](../../../flow-engine/ui-schema) — référence syntaxique uiSchema
