---
title: "Extension d'action"
description: "Développement d'extensions d'action NocoBase : classe parente ActionModel, scénarios ActionSceneEnum, boutons d'action personnalisés."
keywords: "extension d'action,Action,ActionModel,ActionSceneEnum,bouton d'action,NocoBase"
---

# Extension d'action

Dans NocoBase, une **action (Action)** est un bouton dans un bloc qui déclenche une logique métier — par exemple « Nouveau », « Modifier », « Supprimer ». En étendant la classe parente `ActionModel`, vous pouvez ajouter des boutons d'action personnalisés.

## Scénarios d'action

Chaque action doit déclarer son scénario d'apparition via la propriété `static scene` :

| Scénario | Valeur | Description |
| ---------- | ---------------------------- | ------------------------------------------ |
| collection | `ActionSceneEnum.collection` | S'applique à la table de données, par exemple bouton « Nouveau » |
| record | `ActionSceneEnum.record` | S'applique à un enregistrement, par exemple boutons « Modifier » / « Supprimer » |
| both | `ActionSceneEnum.both` | Disponible dans les deux scénarios |
| all | `ActionSceneEnum.all` | Disponible dans tous les scénarios (y compris contextes spéciaux comme une boîte de dialogue) |

## Exemples

### Action au niveau de la table

S'applique à toute la table de données et apparaît dans la barre d'actions en haut du bloc :

```tsx
// models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});
```

### Action au niveau de l'enregistrement

S'applique à un seul enregistrement et apparaît dans la colonne d'actions de chaque ligne du tableau :

```tsx
// models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});
```

### Disponible dans les deux scénarios

Si l'action ne distingue pas les scénarios, utilisez `ActionSceneEnum.both` :

```tsx
// models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});
```

Les trois écritures partagent la même structure — la seule différence vient de la valeur de `static scene` et du libellé dans `defaultProps`.

## Enregistrer une action

Dans `load()` du Plugin, utilisez `registerModelLoaders` pour le chargement à la demande :

```ts
// plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginSimpleActionClient extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      SimpleCollectionActionModel: {
        loader: () => import('./models/SimpleCollectionActionModel'),
      },
      SimpleRecordActionModel: {
        loader: () => import('./models/SimpleRecordActionModel'),
      },
      SimpleBothActionModel: {
        loader: () => import('./models/SimpleBothActionModel'),
      },
    });
  }
}
```

Une fois enregistrés, vous pourrez ajouter ces boutons d'action personnalisés dans « Configurer les actions » d'un bloc.

## Code source complet

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — exemple complet pour les trois scénarios d'action

## Liens connexes

- [Pratique : faire un bouton d'action personnalisé](../examples/custom-action) — construire les trois scénarios d'action de zéro
- [Pratique : faire un plugin de gestion de données front+back](../examples/fullstack-plugin) — application réelle d'action personnalisée + ctx.viewer.dialog dans un plugin complet
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel
- [Extension de bloc](./block) — bloc personnalisé
- [Extension de champ](./field) — composant de champ personnalisé
- [Définition de Flow FlowDefinition](../../../flow-engine/definitions/flow-definition.md) — paramètres complets de registerFlow et types d'événements
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète
