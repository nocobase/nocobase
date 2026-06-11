---
title: "Faire un bouton d'action personnalisé"
description: "Pratique des plugins NocoBase : créer un bouton d'action personnalisé avec ActionModel + ActionSceneEnum, prenant en charge les actions au niveau de la table et au niveau de l'enregistrement."
keywords: "action personnalisée,ActionModel,ActionSceneEnum,bouton d'action,NocoBase"
---

# Faire un bouton d'action personnalisé

Dans NocoBase, une action (Action) est un bouton à l'intérieur d'un bloc, qui déclenche une logique métier — par exemple « Nouveau », « Modifier », « Supprimer ». Cet exemple montre comment créer des boutons d'action personnalisés avec `ActionModel` et contrôler leur scénario d'apparition via `ActionSceneEnum`.

:::tip Lecture préalable

Il est conseillé de connaître les contenus suivants pour faciliter le développement :

- [Écrire votre premier plugin](../../write-your-first-plugin) — création d'un plugin et structure du répertoire
- [Plugin](../plugin) — point d'entrée du plugin et cycle de vie `load()`
- [FlowEngine → Extension d'action](../flow-engine/action) — présentation de ActionModel et ActionSceneEnum
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de `tExpr()` pour la traduction différée

:::

## Résultat final

Nous allons créer trois boutons d'action personnalisés correspondant à trois scénarios :

- **Action au niveau de la table** (`collection`) — apparaît dans la barre d'actions en haut du bloc, par exemple à côté du bouton « Nouveau »
- **Action au niveau de l'enregistrement** (`record`) — apparaît dans la colonne d'actions de chaque ligne, par exemple à côté de « Modifier » et « Supprimer »
- **Disponible dans les deux** (`both`) — apparaît dans les deux scénarios

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_17.55.43.mp4" type="video/mp4">
</video>

Code source complet : [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action). Pour le faire tourner directement en local :

```bash
yarn pm enable @nocobase-example/plugin-simple-action
```

Construisons ce plugin pas à pas, à partir de zéro.

## Étape 1 : créer le squelette du plugin

À la racine du dépôt :

```bash
yarn pm create @my-project/plugin-simple-action
```

Voir [Écrire votre premier plugin](../../write-your-first-plugin) pour les détails.

## Étape 2 : créer les modèles d'action

Chaque action déclare son scénario d'apparition via la propriété `static scene` :

| Scénario | Valeur | Description |
| ---------- | ---------------------------- | ---------------------------------------- |
| collection | `ActionSceneEnum.collection` | S'applique à la table de données, par exemple bouton « Nouveau » |
| record | `ActionSceneEnum.record` | S'applique à un enregistrement, par exemple boutons « Modifier » / « Supprimer » |
| both | `ActionSceneEnum.both` | Disponible dans les deux scénarios |

### Action au niveau de la table

Créez `src/client-v2/models/SimpleCollectionActionModel.tsx` :

```tsx
// src/client-v2/models/SimpleCollectionActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleCollectionActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    children: tExpr('Simple collection action'),
  };
}

SimpleCollectionActionModel.define({
  label: tExpr('Simple collection action'),
});

// Écoute l'événement de clic via registerFlow et donne un retour à l'utilisateur via ctx.message
SimpleCollectionActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple collection action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('Collection action clicked'));
      },
    },
  },
});
```

### Action au niveau de l'enregistrement

Créez `src/client-v2/models/SimpleRecordActionModel.tsx` :

```tsx
// src/client-v2/models/SimpleRecordActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleRecordActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    children: tExpr('Simple record action'),
  };
}

SimpleRecordActionModel.define({
  label: tExpr('Simple record action'),
});

// L'action au niveau de l'enregistrement peut récupérer les données et l'index de la ligne courante via ctx.model.context
SimpleRecordActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple record action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        const id = record?.id;
        ctx.message.info(ctx.t('Record action clicked, record ID: {{id}}, row index: {{index}}', { id, index }));
      },
    },
  },
});
```

### Disponible dans les deux scénarios

Créez `src/client-v2/models/SimpleBothActionModel.tsx` :

```tsx
// src/client-v2/models/SimpleBothActionModel.tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

export class SimpleBothActionModel extends ActionModel {
  static scene = ActionSceneEnum.both;

  defaultProps: ButtonProps = {
    children: tExpr('Simple both action'),
  };
}

SimpleBothActionModel.define({
  label: tExpr('Simple both action'),
});

SimpleBothActionModel.registerFlow({
  key: 'clickFlow',
  title: tExpr('Simple both action'),
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.info(ctx.t('Both action clicked'));
      },
    },
  },
});
```

Les trois écritures partagent la même structure — la seule différence vient de la valeur de `static scene` et du libellé du bouton. Chaque bouton écoute le clic via `registerFlow({ on: 'click' })` et affiche un message via `ctx.message`, pour que l'utilisateur voie que le bouton est bien actif.

## Étape 3 : ajouter les fichiers de traduction

Modifiez les fichiers de traduction sous `src/locale/` du plugin :

```json
// src/locale/zh-CN.json
{
  "Simple collection action": "简单数据表操作",
  "Simple record action": "简单记录操作",
  "Simple both action": "简单通用操作",
  "Collection action clicked": "数据表操作被点击了",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "记录操作被点击了，记录 ID：{{id}}，行索引：{{index}}",
  "Both action clicked": "通用操作被点击了"
}
```

```json
// src/locale/en-US.json
{
  "Simple collection action": "Simple collection action",
  "Simple record action": "Simple record action",
  "Simple both action": "Simple both action",
  "Collection action clicked": "Collection action clicked",
  "Record action clicked, record ID: {{id}}, row index: {{index}}": "Record action clicked, record ID: {{id}}, row index: {{index}}",
  "Both action clicked": "Both action clicked"
}
```

:::warning Attention

L'ajout initial des fichiers de langue nécessite un redémarrage de l'application pour prendre effet.

:::

Pour l'écriture des fichiers de traduction et plus d'utilisations de `tExpr()`, voir [Internationalisation i18n](../component/i18n).

## Étape 4 : enregistrer dans le plugin

Modifiez `src/client-v2/plugin.tsx` et utilisez `registerModelLoaders` pour le chargement à la demande :

```ts
// src/client-v2/plugin.tsx
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

export default PluginSimpleActionClient;
```

## Étape 5 : activer le plugin

```bash
yarn pm enable @my-project/plugin-simple-action
```

Une fois activé, vous pourrez ajouter ces boutons d'action personnalisés dans « Configurer les actions » d'un bloc tableau.

## Code source complet

- [@nocobase-example/plugin-simple-action](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-action) — exemple complet pour les trois scénarios d'action

## Récapitulatif

Capacités utilisées dans cet exemple :

| Capacité | Utilisation | Documentation |
| -------- | -------------------------------------------- | ---------------------------------------------- |
| Bouton d'action | `ActionModel` + `static scene` | [FlowEngine → Extension d'action](../flow-engine/action) |
| Scénario d'action | `ActionSceneEnum.collection / record / both / all` | [FlowEngine → Extension d'action](../flow-engine/action) |
| Inscription au menu | `define({ label })` | [Aperçu de FlowEngine](../flow-engine/index.md) |
| Enregistrement de modèle | `this.flowEngine.registerModelLoaders()` | [Plugin](../plugin) |
| Traduction différée | `tExpr()` | [Internationalisation i18n](../component/i18n) |

## Liens connexes

- [Écrire votre premier plugin](../../write-your-first-plugin) — créer le squelette d'un plugin de zéro
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel
- [FlowEngine → Extension d'action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [FlowEngine → Extension de bloc](../flow-engine/block) — bloc personnalisé
- [FlowEngine → Extension de champ](../flow-engine/field) — composant de champ personnalisé
- [Component vs FlowModel](../component-vs-flow-model) — quand utiliser FlowModel
- [Plugin](../plugin) — point d'entrée et cycle de vie load()
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de tExpr
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète FlowModel, Flow, Context
