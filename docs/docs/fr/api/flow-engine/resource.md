---
title: "Resource API"
description: "Référence Resource API du FlowEngine NocoBase : signatures complètes des méthodes, formats de paramètres et syntaxe de filter pour MultiRecordResource et SingleRecordResource."
keywords: "Resource,MultiRecordResource,SingleRecordResource,FlowResource,CRUD,filter,NocoBase"
---

# Resource API

Le FlowEngine NocoBase fournit deux classes Resource pour gérer les opérations sur les données côté frontend : `MultiRecordResource` pour les listes/tables (plusieurs enregistrements) et `SingleRecordResource` pour les formulaires/détails (un seul enregistrement). Elles encapsulent les appels REST API et offrent une gestion réactive des données.

Chaîne d'héritage : `FlowResource` → `APIResource` → `BaseRecordResource` → `MultiRecordResource` / `SingleRecordResource`

## MultiRecordResource

Utilisée pour les scénarios à plusieurs enregistrements comme les listes, les tables, les kanbans, etc. À importer depuis `@nocobase/flow-engine`.

### Opérations sur les données

| Méthode | Paramètres | Description |
|------|------|------|
| `getData()` | - | Retourne `TDataItem[]`, valeur initiale `[]` |
| `hasData()` | - | Indique si le tableau de données n'est pas vide |
| `create(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Crée un enregistrement, refresh automatique par défaut après création |
| `get(filterByTk)` | `filterByTk: string \| number` | Récupère un enregistrement par sa clé primaire |
| `update(filterByTk, data, options?)` | `filterByTk: string \| number`, `data: object` | Met à jour un enregistrement, refresh automatique après l'opération |
| `destroy(filterByTk, options?)` | `filterByTk: string \| number \| Array` | Supprime un enregistrement, prend en charge le mode batch |
| `destroySelectedRows()` | - | Supprime toutes les lignes sélectionnées |
| `refresh()` | - | Rafraîchit les données (appelle l'action `list`). Plusieurs appels dans la même boucle d'événements seront fusionnés |

### Pagination

| Méthode | Description |
|------|------|
| `getPage()` | Récupère le numéro de page courant |
| `setPage(page)` | Définit le numéro de page |
| `getPageSize()` | Récupère le nombre d'éléments par page (par défaut 20) |
| `setPageSize(pageSize)` | Définit le nombre d'éléments par page |
| `getCount()` | Récupère le nombre total d'enregistrements |
| `getTotalPage()` | Récupère le nombre total de pages |
| `next()` | Page suivante et rafraîchit |
| `previous()` | Page précédente et rafraîchit |
| `goto(page)` | Va à la page spécifiée et rafraîchit |

### Lignes sélectionnées

| Méthode | Description |
|------|------|
| `setSelectedRows(rows)` | Définit les lignes sélectionnées |
| `getSelectedRows()` | Récupère les lignes sélectionnées |

### Exemple : utilisation dans CollectionBlockModel

Lorsque vous héritez de `CollectionBlockModel`, vous devez créer la resource via `createResource()`, puis lire les données dans `renderComponent()` :

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class ManyRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  // Déclare l'utilisation de MultiRecordResource pour gérer les données
  createResource() {
    return this.context.makeResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData();   // TDataItem[]
    const count = this.resource.getCount(); // Nombre total d'enregistrements

    return (
      <div>
        <h3>{count} enregistrements au total (page {this.resource.getPage()})</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
}

ManyRecordBlockModel.define({
  label: tExpr('Many records block'),
});
```

L'exemple complet est disponible dans [FlowEngine → Extension de blocs](../../plugin-development/client/flow-engine/block.md).

### Exemple : appel CRUD dans un bouton d'action

Dans le handler `registerFlow` d'un `ActionModel`, récupérez la resource du bloc courant via `ctx.blockModel?.resource` et appelez les méthodes CRUD :

```tsx
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class NewTodoActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
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
  on: 'click',
  steps: {
    openForm: {
      async handler(ctx) {
        // Récupère la resource du bloc courant
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) return;

        ctx.viewer.dialog({
          title: ctx.t('New todo'),
          content: (view) => (
            <MyForm
              onSubmit={async (values) => {
                // Crée un enregistrement, la resource sera refresh automatiquement après la création
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

L'exemple complet est disponible dans [Réaliser un plugin de gestion de données frontend-backend](../../plugin-development/client/examples/fullstack-plugin.md).

### Exemple : aide-mémoire des opérations CRUD

```ts
async handler(ctx) {
  const resource = ctx.blockModel?.resource as MultiRecordResource;

  // --- Créer ---
  await resource.create({ title: 'New item', completed: false });
  // Sans rafraîchissement automatique
  await resource.create({ title: 'Draft' }, { refresh: false });

  // --- Lire ---
  const items = resource.getData();     // TDataItem[]
  const count = resource.getCount();    // Nombre total d'enregistrements
  const item = await resource.get(1);   // Récupère un seul enregistrement par clé primaire

  // --- Mettre à jour ---
  await resource.update(1, { title: 'Updated' });

  // --- Supprimer ---
  await resource.destroy(1);            // Suppression unique
  await resource.destroy([1, 2, 3]);    // Suppression en lot

  // --- Pagination ---
  resource.setPage(2);
  resource.setPageSize(50);
  await resource.refresh();
  // Ou utiliser les méthodes raccourcies
  await resource.goto(3);
  await resource.next();
  await resource.previous();

  // --- Rafraîchir ---
  await resource.refresh();
}
```

## SingleRecordResource

Utilisée pour les scénarios à un seul enregistrement comme les formulaires, les pages de détails, etc. À importer depuis `@nocobase/flow-engine`.

### Opérations sur les données

| Méthode | Paramètres | Description |
|------|------|------|
| `getData()` | - | Retourne `TData` (un seul objet), valeur initiale `null` |
| `save(data, options?)` | `data: object`, `options?: { refresh?: boolean }` | Sauvegarde intelligente : appelle create si `isNewRecord` est true, sinon update |
| `destroy(options?)` | - | Supprime l'enregistrement courant (utilise le filterByTk déjà défini) |
| `refresh()` | - | Rafraîchit les données (appelle l'action `get`). Ignoré si `isNewRecord` est true |

### Propriétés clés

| Propriété | Description |
|------|------|
| `isNewRecord` | Indique s'il s'agit d'un nouvel enregistrement. `setFilterByTk()` le définira automatiquement à `false` |

### Exemple : scénario formulaire/détails

```tsx
import React from 'react';
import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { SingleRecordResource } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DetailBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.one;

  createResource() {
    return this.context.makeResource(SingleRecordResource);
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    const data = this.resource.getData(); // Un seul objet ou null
    if (!data) return <div>Chargement...</div>;

    return (
      <div>
        <h3>{data.title}</h3>
        <p>{data.content}</p>
      </div>
    );
  }
}

DetailBlockModel.define({
  label: tExpr('Detail block'),
});
```

### Exemple : créer et modifier un enregistrement

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource as SingleRecordResource;

  // --- Créer un enregistrement ---
  resource.isNewRecord = true;
  await resource.save({ name: 'John', age: 30 });
  // save appelle en interne l'action create, refresh automatique après l'opération

  // --- Modifier un enregistrement existant ---
  resource.setFilterByTk(1);  // Définit automatiquement isNewRecord = false
  await resource.refresh();   // Charge d'abord les données courantes
  const data = resource.getData();
  await resource.save({ ...data, name: 'Jane' });
  // save appelle en interne l'action update

  // --- Supprimer l'enregistrement courant ---
  await resource.destroy();   // Utilise le filterByTk déjà défini
}
```

## Méthodes communes

Les méthodes suivantes sont disponibles à la fois sur `MultiRecordResource` et `SingleRecordResource` :

### Filtrage

| Méthode | Description |
|------|------|
| `setFilter(filter)` | Définit directement l'objet filter |
| `addFilterGroup(key, filter)` | Ajoute un groupe de filtres nommé (recommandé, combinable et amovible) |
| `removeFilterGroup(key)` | Supprime un groupe de filtres nommé |
| `getFilter()` | Récupère le filter agrégé. Plusieurs groupes sont automatiquement combinés avec `$and` |

### Contrôle des champs

| Méthode | Description |
|------|------|
| `setFields(fields)` | Définit les champs à retourner |
| `setAppends(appends)` | Définit les appends pour les champs de relation |
| `addAppends(appends)` | Ajoute des appends (déduplique) |
| `setSort(sort)` | Définit le tri, par exemple `['-createdAt', 'name']` |
| `setFilterByTk(value)` | Définit le filtrage par clé primaire |

### Configuration de la resource

| Méthode | Description |
|------|------|
| `setResourceName(name)` | Définit le nom de la resource, par exemple `'users'` ou une resource associée `'users.tags'` |
| `setSourceId(id)` | Définit l'ID de l'enregistrement parent pour une resource associée |
| `setDataSourceKey(key)` | Définit la source de données (ajoute l'en-tête `X-Data-Source`) |

### Métadonnées et état

| Méthode | Description |
|------|------|
| `getMeta(key?)` | Récupère les métadonnées. Sans key, retourne l'objet meta complet |
| `loading` | Indique si le chargement est en cours (getter) |
| `getError()` | Récupère le message d'erreur |
| `clearError()` | Efface l'erreur |

### Événements

| Événement | Déclencheur |
|------|----------|
| `'refresh'` | Après un appel réussi à `refresh()` |
| `'saved'` | Après le succès d'une opération `create` / `update` / `save` |

```ts
resource.on('saved', (data) => {
  console.log('Enregistrement sauvegardé :', data);
});
```

## Syntaxe Filter

NocoBase utilise une syntaxe de filtrage de style JSON, les opérateurs commencent par `$` :

```ts
// Égal à
{ status: { $eq: 'active' } }

// Différent de
{ status: { $ne: 'deleted' } }

// Supérieur à
{ age: { $gt: 18 } }

// Contient (correspondance floue)
{ name: { $includes: 'test' } }

// Conditions combinées
{
  $and: [
    { status: { $eq: 'active' } },
    { age: { $gt: 18 } },
  ]
}

// Conditions OU
{
  $or: [
    { status: { $eq: 'active' } },
    { role: { $eq: 'admin' } },
  ]
}
```

Sur la Resource, il est recommandé d'utiliser `addFilterGroup` pour gérer les conditions de filtrage :

```ts
// Ajoute plusieurs groupes de filtres
resource.addFilterGroup('status', { status: { $eq: 'active' } });
resource.addFilterGroup('age', { age: { $gt: 18 } });
// getFilter() agrège automatiquement en : { $and: [...] }

// Supprime un groupe de filtres
resource.removeFilterGroup('status');

// Rafraîchit pour appliquer le filtre
await resource.refresh();
```

## Comparaison entre MultiRecordResource et SingleRecordResource

| Caractéristique | MultiRecordResource | SingleRecordResource |
|------|-------|-------|
| Retour de getData() | `TDataItem[]` (tableau) | `TData` (un seul objet) |
| Action refresh par défaut | `list` | `get` |
| Pagination | Prise en charge | Non prise en charge |
| Lignes sélectionnées | Prise en charge | Non prise en charge |
| Création | `create(data)` | `save(data)` + `isNewRecord=true` |
| Mise à jour | `update(filterByTk, data)` | `save(data)` + `setFilterByTk(id)` |
| Suppression | `destroy(filterByTk)` | `destroy()` |
| Scénarios typiques | Listes, tables, kanbans | Formulaires, pages de détails |

## Liens connexes

- [Réaliser un plugin de gestion de données frontend-backend](../../plugin-development/client/examples/fullstack-plugin.md) — Exemple complet : utilisation pratique de `resource.create()` dans un bouton d'action personnalisé
- [FlowEngine → Extension de blocs](../../plugin-development/client/flow-engine/block.md) — Utilisation de `createResource()` et `resource.getData()` dans CollectionBlockModel
- [ResourceManager : gestion des ressources (côté serveur)](../../plugin-development/server/resource-manager.md) — Définition des ressources REST API côté serveur. C'est ce que les Resources côté client appellent
- [FlowContext API](./flow-context.md) — Description de méthodes telles que `ctx.makeResource()`, `ctx.initResource()`
