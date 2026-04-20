:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/open-view).
:::

# ctx.openView()

Ouvrez une vue spécifiée (tiroir, boîte de dialogue, page intégrée, etc.) par programmation. Fourni par `FlowModelContext`, il est utilisé pour ouvrir des vues `ChildPage` ou `PopupAction` configurées dans des scénarios tels que `JSBlock`, les cellules de tableau, les flux de travail, etc.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock** | Ouvrir une boîte de dialogue de détail/édition après un clic sur un bouton, en passant le `filterByTk` de la ligne actuelle. |
| **Cellule de tableau** | Rendre un bouton dans une cellule qui ouvre une boîte de dialogue de détail de ligne lors du clic. |
| **Flux de travail / JSAction** | Ouvrir la vue suivante ou une boîte de dialogue après une opération réussie. |
| **Champ d'association** | Ouvrir une boîte de dialogue de sélection/édition via `ctx.runAction('openView', params)`. |

> **Remarque :** `ctx.openView` est disponible dans un environnement RunJS où un contexte `FlowModel` existe. Si le modèle correspondant à l' `uid` n'existe pas, un `PopupActionModel` sera automatiquement créé et persisté.

## Signature

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Paramètres

### uid

L'identifiant unique du modèle de vue. S'il n'existe pas, il sera automatiquement créé et enregistré. Il est recommandé d'utiliser un UID stable, tel que `${ctx.model.uid}-detail`, afin que la configuration puisse être réutilisée lors de l'ouverture de la même boîte de dialogue plusieurs fois.

### Champs communs de `options`

| Champ | Type | Description |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Méthode d'ouverture : tiroir (drawer), boîte de dialogue (dialog) ou intégré (embed). Par défaut `drawer`. |
| `size` | `small` / `medium` / `large` | Taille de la boîte de dialogue ou du tiroir. Par défaut `medium`. |
| `title` | `string` | Titre de la vue. |
| `params` | `Record<string, any>` | Paramètres arbitraires transmis à la vue. |
| `filterByTk` | `any` | Valeur de la clé primaire, utilisée pour les scénarios de détail/édition d'un seul enregistrement. |
| `sourceId` | `string` | ID de l'enregistrement source, utilisé dans les scénarios d'association. |
| `dataSourceKey` | `string` | Source de données. |
| `collectionName` | `string` | Nom de la collection. |
| `associationName` | `string` | Nom du champ d'association. |
| `navigation` | `boolean` | Indique s'il faut utiliser la navigation par route. Si `defineProperties` ou `defineMethods` sont fournis, cette option est forcée à `false`. |
| `preventClose` | `boolean` | Indique s'il faut empêcher la fermeture. |
| `defineProperties` | `Record<string, PropertyOptions>` | Injecter dynamiquement des propriétés dans le modèle au sein de la vue. |
| `defineMethods` | `Record<string, Function>` | Injecter dynamiquement des méthodes dans le modèle au sein de la vue. |

## Exemples

### Utilisation de base : Ouvrir un tiroir

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Détails'),
});
```

### Passer le contexte de la ligne actuelle

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Détails de la ligne'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Ouvrir via runAction

Lorsqu'un modèle est configuré avec une action `openView` (comme les champs d'association ou les champs cliquables), vous pouvez appeler :

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Injecter un contexte personnalisé

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Relation avec ctx.viewer et ctx.view

| Usage | Utilisation recommandée |
|------|----------|
| **Ouvrir une vue de flux de travail configurée** | `ctx.openView(uid, options)` |
| **Ouvrir un contenu personnalisé (sans flux)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Opérer sur la vue actuellement ouverte** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` ouvre une `FlowPage` (`ChildPageModel`), qui rend une page de flux complète en interne ; `ctx.viewer` ouvre n'importe quel contenu React.

## Notes

- Il est recommandé d'associer l' `uid` à `ctx.model.uid` (par exemple, `${ctx.model.uid}-xxx`) pour éviter les conflits entre plusieurs blocs.
- Lorsque `defineProperties` ou `defineMethods` sont transmis, `navigation` est forcée à `false` pour éviter la perte de contexte après un rafraîchissement.
- À l'intérieur de la boîte de dialogue, `ctx.view` fait référence à l'instance de la vue actuelle, et `ctx.view.inputArgs` peut être utilisé pour lire les paramètres passés lors de l'ouverture.

## Voir aussi

- [ctx.view](./view.md) : L'instance de la vue actuellement ouverte.
- [ctx.model](./model.md) : Le modèle actuel, utilisé pour construire un `popupUid` stable.