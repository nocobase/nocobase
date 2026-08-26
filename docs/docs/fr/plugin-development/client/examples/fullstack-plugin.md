---
title: "Faire un plugin de gestion de données front+back"
description: "Pratique des plugins NocoBase : table de données serveur + TableBlockModel client pour afficher les données + champs et actions personnalisés, plugin complet à intégration front-back."
keywords: "front+back,TableBlockModel,defineCollection,ActionModel,ClickableFieldModel,ctx.viewer,NocoBase"
---

# Faire un plugin de gestion de données front+back

Les exemples précédents étaient soit purement côté client (bloc, champ, action), soit côté client + API simple (page de configuration). Cet exemple présente un scénario plus complet — le serveur définit une table de données, le client étend `TableBlockModel` pour bénéficier de capacités de tableau complètes, et on y ajoute des composants de champ et boutons d'action personnalisés, le tout formant un plugin de gestion de données avec CRUD.

Cet exemple combine ce qui a été vu dans les précédents — bloc, champ, action — et montre le flux de développement complet d'un plugin.

:::tip Lecture préalable

Il est conseillé de connaître les contenus suivants pour faciliter le développement :

- [Écrire votre premier plugin](../../write-your-first-plugin) — création d'un plugin et structure du répertoire
- [Plugin](../plugin) — point d'entrée du plugin et cycle de vie `load()`
- [FlowEngine → Extension de bloc](../flow-engine/block) — BlockModel, CollectionBlockModel, TableBlockModel
- [FlowEngine → Extension de champ](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Extension d'action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de `tExpr()`
- [Aperçu du développement côté serveur](../../server) — bases du plugin serveur

:::

## Résultat final

Nous allons créer un plugin de gestion de « tâches à faire » avec les capacités suivantes :

- Le serveur définit une table de données `todoItems`, et insère automatiquement des données d'exemple à l'installation du plugin
- Le client étend `TableBlockModel` pour un bloc tableau prêt à l'emploi (colonnes de champs, pagination, barre d'actions, etc.)
- Composant de champ personnalisé — affiche le champ priority avec un Tag coloré
- Bouton d'action personnalisé — bouton « Nouvelle tâche » qui ouvre une boîte de dialogue avec un formulaire pour créer un enregistrement

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/iShot_2026-04-08_16.32.52.mp4" type="video/mp4">
</video>

Code source complet : [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource). Pour le faire tourner directement en local :

```bash
yarn pm enable @nocobase-example/plugin-custom-table-block-resource
```

Construisons ce plugin pas à pas, à partir de zéro.

## Étape 1 : créer le squelette du plugin

À la racine du dépôt :

```bash
yarn pm create @my-project/plugin-custom-table-block-resource
```

Voir [Écrire votre premier plugin](../../write-your-first-plugin) pour les détails.

## Étape 2 : définir la table de données (côté serveur)

Créez `src/server/collections/todoItems.ts`. NocoBase chargera automatiquement les définitions de collections de ce répertoire :

```ts
// src/server/collections/todoItems.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'todoItems',
  title: 'Todo Items',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    {
      name: 'completed',
      type: 'boolean',
      title: 'Completed',
      defaultValue: false,
    },
    {
      name: 'priority',
      type: 'string',
      title: 'Priority',
      defaultValue: 'medium',
    },
  ],
});
```

Contrairement à l'exemple de la page de configuration, ici il n'est pas nécessaire d'enregistrer une ressource manuellement — NocoBase génère automatiquement les endpoints CRUD standards (`list`, `get`, `create`, `update`, `destroy`) pour chaque collection.

## Étape 3 : configurer les permissions et les données d'exemple (côté serveur)

Modifiez `src/server/plugin.ts` ; configurez les permissions ACL dans `load()` et insérez les données d'exemple dans `install()` :

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginDataBlockServer extends Plugin {
  async load() {
    // Les utilisateurs connectés peuvent effectuer un CRUD sur todoItems
    this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
  }

  async install() {
    // À la première installation, insère quelques exemples
    const repo = this.db.getRepository('todoItems');
    const count = await repo.count();
    if (count === 0) {
      await repo.createMany({
        records: [
          { title: 'Learn NocoBase plugin development', completed: true, priority: 'high' },
          { title: 'Build a custom block', completed: false, priority: 'high' },
          { title: 'Write documentation', completed: false, priority: 'medium' },
          { title: 'Add unit tests', completed: false, priority: 'low' },
        ],
      });
    }
  }
}

export default PluginDataBlockServer;
```

Quelques points clés :

- **`acl.allow()`** — `['list', 'get', 'create', 'update', 'destroy']` ouvre les permissions CRUD complètes ; `'loggedIn'` signifie que tout utilisateur connecté peut accéder
- **`install()`** — ne s'exécute qu'à la première installation du plugin, idéal pour l'écriture des données initiales
- **`this.db.getRepository()`** — récupère l'objet d'opération sur les données via le nom de collection
- Pas besoin de `resourceManager.define()` — NocoBase génère automatiquement les endpoints CRUD pour les collections

## Étape 4 : créer le modèle de bloc (côté client)

Créez `src/client-v2/models/TodoBlockModel.tsx`. En étendant `TableBlockModel`, vous obtenez immédiatement toutes les capacités d'un bloc tableau — colonnes de champs, barre d'actions, pagination, tri, etc., sans avoir à écrire `renderComponent`.

![20260408164204](https://static-docs.nocobase.com/20260408164204.png)

:::tip Astuce

Dans le développement réel d'un plugin, si vous n'avez pas besoin de personnaliser `TableBlockModel`, vous pouvez vous passer d'étendre et d'enregistrer ce bloc, et laisser l'utilisateur choisir « Tableau » lors de l'ajout d'un bloc. Ici, nous écrivons `TodoBlockModel` qui étend `TableBlockModel` uniquement pour montrer le flux de définition et d'enregistrement d'un modèle de bloc. `TableBlockModel` se charge de tout le reste (colonnes, barre d'actions, pagination, etc.).

:::

```tsx
// src/client-v2/models/TodoBlockModel.tsx
import { TableBlockModel } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class TodoBlockModel extends TableBlockModel {
  // Limite ce bloc à la table todoItems uniquement
  static filterCollection(collection: Collection) {
    return collection.name === 'todoItems';
  }
}

TodoBlockModel.define({
  label: tExpr('Todo block'),
});
```

`filterCollection` limite ce bloc à la table `todoItems` — quand l'utilisateur ajoute « Todo block », seule `todoItems` apparaît dans la liste de sélection des tables, sans autre table sans rapport.

![20260408170026](https://static-docs.nocobase.com/20260408170026.png)

## Étape 5 : créer le composant de champ personnalisé (côté client)

Créez `src/client-v2/models/PriorityFieldModel.tsx`. Affiche le champ priority avec un Tag coloré, bien plus parlant qu'un texte brut :

![20260408163645](https://static-docs.nocobase.com/20260408163645.png)

```tsx
// src/client-v2/models/PriorityFieldModel.tsx
import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// Lie à l'interface input (texte sur une ligne)
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
```

Une fois enregistré, dans la configuration de la colonne priority du tableau, vous pourrez basculer le menu déroulant « Composant de champ » sur « Priority tag ».

## Étape 6 : créer le bouton d'action personnalisé (côté client)

Créez `src/client-v2/models/NewTodoActionModel.tsx`. Au clic sur « Nouvelle tâche », `ctx.viewer.dialog()` ouvre une boîte de dialogue ; après remplissage du formulaire, l'enregistrement est créé :

![20260408163810](https://static-docs.nocobase.com/20260408163810.png)

```tsx
// src/client-v2/models/NewTodoActionModel.tsx
import React from 'react';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource, observable, observer } from '@nocobase/flow-engine';
import { Button, Form, Input, Select, Space, Switch } from 'antd';
import { ButtonProps } from 'antd';
import { tExpr } from '../locale';

// Gère l'état de chargement avec observable, en remplacement de useState
const formState = observable({
  loading: false,
});

// Composant de formulaire dans la boîte de dialogue, enveloppé d'observer pour réagir aux changements d'observable
const NewTodoForm = observer(function NewTodoForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    formState.loading = true;
    try {
      await onSubmit(values);
    } finally {
      formState.loading = false;
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ priority: 'medium', completed: false }}>
      <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter title' }]}>
        <Input placeholder="Enter todo title" />
      </Form.Item>
      <Form.Item label="Priority" name="priority">
        <Select
          options={[
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ]}
        />
      </Form.Item>
      <Form.Item label="Completed" name="completed" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleSubmit} loading={formState.loading}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
});

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    type: 'primary',
    children: tExpr('New todo'),
  };
}

NewTodoActionModel.define({
  label: tExpr('New todo'),
});

NewTodoActionModel.registerFlow({
  key: 'newTodoFlow',
  title: tExpr('New todo'),
  on: 'click', // Écoute l'événement de clic du bouton
  steps: {
    openForm: {
      async handler(ctx) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        // Ouvre une boîte de dialogue avec ctx.viewer.dialog
        ctx.viewer.dialog({
          content: (view) => (
            <NewTodoForm
              onSubmit={async (values) => {
                await resource.create(values);
                ctx.message.success(ctx.t('Created successfully'));
                view.close();
              }}
              onCancel={() => view.close()}
            />
          ),
        });
      },
    },
  },
});
```

Quelques points clés :

- **`ActionSceneEnum.collection`** — le bouton apparaît dans la barre d'actions en haut du bloc
- **`on: 'click'`** — écoute l'événement `click` du bouton via `registerFlow`
- **`ctx.viewer.dialog()`** — capacité de boîte de dialogue intégrée à NocoBase ; `content` reçoit une fonction dont le paramètre `view` permet d'appeler `view.close()` pour fermer
- **`resource.create(values)`** — appelle l'endpoint create de la table pour créer un enregistrement ; le tableau se rafraîchit automatiquement
- **`observable` + `observer`** — gestion d'état réactive fournie par flow-engine, en remplacement de `useState` ; le composant réagit automatiquement aux changements de `formState.loading`

## Étape 7 : ajouter les fichiers de traduction

Modifiez les fichiers de traduction sous `src/locale/` du plugin :

```json
// src/locale/zh-CN.json
{
  "Todo block": "待办事项区块",
  "Priority tag": "优先级标签",
  "New todo": "新建待办",
  "Todo form": "待办表单",
  "Title": "标题",
  "Priority": "优先级",
  "Completed": "已完成",
  "Created successfully": "创建成功"
}
```

```json
// src/locale/en-US.json
{
  "Todo block": "Todo block",
  "Priority tag": "Priority tag",
  "New todo": "New todo",
  "Todo form": "Todo form",
  "Title": "Title",
  "Priority": "Priority",
  "Completed": "Completed",
  "Created successfully": "Created successfully"
}
```

:::warning Attention

L'ajout initial des fichiers de langue nécessite un redémarrage de l'application pour prendre effet.

:::

Pour l'écriture des fichiers de traduction et plus d'utilisations de `tExpr()`, voir [Internationalisation i18n](../component/i18n).

## Étape 8 : enregistrer dans le plugin (côté client)

Modifiez `src/client-v2/plugin.tsx`. Deux choses à faire : enregistrer les modèles et déclarer `todoItems` auprès de la source de données client.

:::warning Attention

Enregistrer une table de données manuellement via `addCollection` dans le code du plugin est une **pratique peu fréquente** ; nous le faisons ici pour démontrer le flux complet d'intégration front-back. Dans un projet réel, les tables de données sont généralement créées et configurées par l'utilisateur dans l'interface NocoBase, ou gérées via API / MCP, sans avoir besoin d'être enregistrées explicitement dans le code client du plugin.

:::

Les tables définies via `defineCollection` sont des tables internes côté serveur et n'apparaissent pas par défaut dans la liste de sélection des tables des blocs. Une fois enregistrées manuellement via `addCollection`, l'utilisateur pourra choisir `todoItems` lors de l'ajout d'un bloc.

![20260408164023](https://static-docs.nocobase.com/20260408164023.png)

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

const todoItemsCollection = {
  name: 'todoItems',
  title: 'Todo Items',
  // filterTargetKey doit être défini, sinon la collection n'apparaîtra pas dans la liste de sélection des tables
  filterTargetKey: 'id',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Title', 'x-component': 'Input' },
    },
    {
      type: 'boolean',
      name: 'completed',
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: 'Completed', 'x-component': 'Checkbox' },
    },
    {
      type: 'string',
      name: 'priority',
      interface: 'input',
      uiSchema: { type: 'string', title: 'Priority', 'x-component': 'Input' },
    },
  ],
};

export class PluginCustomTableBlockResourceClientV2 extends Plugin {
  async load() {
    // Enregistre les modèles bloc, champ et action
    this.flowEngine.registerModelLoaders({
      TodoBlockModel: {
        loader: () => import('./models/TodoBlockModel'),
      },
      PriorityFieldModel: {
        loader: () => import('./models/PriorityFieldModel'),
      },
      NewTodoActionModel: {
        loader: () => import('./models/NewTodoActionModel'),
      },
    });

    // Enregistre todoItems auprès de la source de données client.
    // On doit écouter l'événement 'dataSource:loaded' car ensureLoaded() s'exécute après load(),
    // et appelle setCollections() qui vide toutes les collections avant de les rétablir depuis le serveur.
    // En réenregistrant dans le callback de l'événement, addCollection survit au rechargement.
    const addTodoCollection = () => {
      const mainDS = this.flowEngine.dataSourceManager.getDataSource('main');
      if (mainDS && !mainDS.getCollection('todoItems')) {
        mainDS.addCollection(todoItemsCollection);
      }
    };

    this.app.eventBus.addEventListener('dataSource:loaded', (event: Event) => {
      if ((event as CustomEvent).detail?.dataSourceKey === 'main') {
        addTodoCollection();
      }
    });
  }
}

export default PluginCustomTableBlockResourceClientV2;
```

Quelques points clés :

- **`registerModelLoaders`** — enregistre les trois modèles avec chargement à la demande : bloc, champ, action
- **`this.app.eventBus`** — bus d'événements au niveau de l'application, sert à écouter les événements de cycle de vie
- **Événement `dataSource:loaded`** — déclenché après le chargement de la source de données. `addCollection` doit être appelé dans le callback de cet événement, car `ensureLoaded()` s'exécute après `load()` et vide d'abord puis rétablit toutes les collections — appeler `addCollection` directement dans `load()` serait écrasé
- **`addCollection()`** — déclare la collection auprès de la source de données client. Les champs doivent comporter les attributs `interface` et `uiSchema` pour que NocoBase sache comment les afficher
- **`filterTargetKey: 'id'`** — doit être défini ; il indique le champ qui identifie de manière unique un enregistrement (généralement la clé primaire). Sans cela, la collection n'apparaîtra pas dans la liste de sélection des tables
- `defineCollection` côté serveur crée la table physique et le mapping ORM ; `addCollection` côté client fait connaître la table à l'UI — la coopération des deux côtés rend l'intégration front-back possible

## Étape 9 : activer le plugin

```bash
yarn pm enable @my-project/plugin-custom-table-block-resource
```

Une fois activé :

1. Créez une nouvelle page, cliquez sur « Ajouter un bloc », choisissez « Todo block » et liez-le à la table `todoItems`
2. Le tableau charge automatiquement les données et affiche les colonnes, la pagination, etc.
3. Dans « Configurer les actions », ajoutez le bouton « New todo » : un clic ouvre une boîte de dialogue pour remplir le formulaire et créer un enregistrement
4. Dans la colonne priority, basculez « Composant de champ » sur « Priority tag » : la priorité s'affichera avec un Tag coloré

<!-- Une capture d'écran complète après activation est attendue ici -->

## Code source complet

- [@nocobase-example/plugin-custom-table-block-resource](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-custom-table-block-resource) — exemple complet de plugin de gestion de données front+back

## Récapitulatif

Capacités utilisées dans cet exemple :

| Capacité | Utilisation | Documentation |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Définir une table | `defineCollection()` | [Serveur → Tables de données Collections](../../server/collections) |
| Permissions | `acl.allow()` | [Serveur → Contrôle d'accès ACL](../../server/acl) |
| Données initiales | `install()` + `repo.createMany()` | [Serveur → Plugin](../../server/plugin) |
| Bloc tableau | `TableBlockModel` | [FlowEngine → Extension de bloc](../flow-engine/block) |
| Déclarer la table côté client | `addCollection()` + `eventBus` + `filterTargetKey` | [Plugin](../plugin) |
| Champ personnalisé | `ClickableFieldModel` + `bindModelToInterface` | [FlowEngine → Extension de champ](../flow-engine/field) |
| Action personnalisée | `ActionModel` + `registerFlow({ on: 'click' })` | [FlowEngine → Extension d'action](../flow-engine/action) |
| Boîte de dialogue | `ctx.viewer.dialog()` | [Context → Capacités courantes](../ctx/common-capabilities) |
| État réactif | `observable` + `observer` | [Développement de composants Component](../component/index.md) |
| Enregistrement de modèle | `this.flowEngine.registerModelLoaders()` | [Plugin](../plugin) |
| Traduction différée | `tExpr()` | [Internationalisation i18n](../component/i18n) |

## Liens connexes

- [Écrire votre premier plugin](../../write-your-first-plugin) — créer le squelette d'un plugin de zéro
- [Aperçu de FlowEngine](../flow-engine/index.md) — utilisation de base de FlowModel et registerFlow
- [FlowEngine → Extension de bloc](../flow-engine/block) — BlockModel, TableBlockModel
- [FlowEngine → Extension de champ](../flow-engine/field) — ClickableFieldModel, bindModelToInterface
- [FlowEngine → Extension d'action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [Faire un bloc d'affichage personnalisé](./custom-block) — exemple de base BlockModel
- [Faire un composant de champ personnalisé](./custom-field) — exemple de base FieldModel
- [Faire un bouton d'action personnalisé](./custom-action) — exemple de base ActionModel
- [Aperçu du développement côté serveur](../../server) — bases du plugin serveur
- [Serveur → Tables de données Collections](../../server/collections) — defineCollection et addCollection
- [Aide-mémoire Resource API](../../../api/flow-engine/resource.md) — signatures complètes des méthodes de MultiRecordResource / SingleRecordResource
- [Plugin](../plugin) — point d'entrée et cycle de vie load()
- [Internationalisation i18n](../component/i18n) — écriture des fichiers de traduction et utilisation de tExpr
- [Serveur → Contrôle d'accès ACL](../../server/acl) — configuration des permissions
- [Serveur → Plugin](../../server/plugin) — cycle de vie du plugin serveur
- [Context → Capacités courantes](../ctx/common-capabilities) — ctx.viewer, ctx.message, etc.
- [Développement de composants Component](../component/index.md) — utilisation des composants Antd Form, etc.
- [Documentation complète FlowEngine](../../../flow-engine/index.md) — référence complète FlowModel, Flow, Context
