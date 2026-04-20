:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/filter-manager).
:::

# ctx.filterManager

Le gestionnaire de connexions de filtres est utilisé pour gérer les associations de filtrage entre les formulaires de filtrage (FilterForm) et les blocs de données (tableaux, listes, graphiques, etc.). Il est fourni par `BlockGridModel` et n'est disponible que dans son contexte (par exemple, les blocs de formulaire de filtrage, les blocs de données).

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Bloc de formulaire de filtrage** | Gère les configurations de connexion entre les éléments de filtrage et les blocs cibles ; actualise les données cibles lorsque les filtres changent. |
| **Bloc de données (Tableau/Liste)** | Agit comme une cible de filtrage, liant les conditions de filtrage via `bindToTarget`. |
| **Règles de liaison / FilterModel personnalisé** | Appelle `refreshTargetsByFilter` dans `doFilter` ou `doReset` pour déclencher l'actualisation des cibles. |
| **Configuration des champs de connexion** | Utilise `getConnectFieldsConfig` et `saveConnectFieldsConfig` pour maintenir les correspondances de champs entre les filtres et les cibles. |

> **Note** : `ctx.filterManager` n'est disponible que dans les contextes RunJS disposant d'un `BlockGridModel` (par exemple, à l'intérieur d'une page contenant un formulaire de filtrage) ; il est `undefined` dans les JSBlocks ordinaires ou les pages indépendantes. Il est recommandé d'utiliser le chaînage optionnel avant d'y accéder.

## Définitions de types

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID du modèle de filtre
  targetId: string;   // UID du modèle de bloc de données cible
  filterPaths?: string[];  // Chemins de champs du bloc cible
  operator?: string;  // Opérateur de filtre
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Méthodes courantes

| Méthode | Description |
|------|------|
| `getFilterConfigs()` | Récupère toutes les configurations de connexion de filtres actuelles. |
| `getConnectFieldsConfig(filterId)` | Récupère la configuration des champs de connexion pour un filtre spécifique. |
| `saveConnectFieldsConfig(filterId, config)` | Enregistre la configuration des champs de connexion pour un filtre. |
| `addFilterConfig(config)` | Ajoute une configuration de filtre (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Supprime les configurations de filtre par filterId, targetId, ou les deux. |
| `bindToTarget(targetId)` | Lie la configuration du filtre à un bloc cible, déclenchant sa ressource pour appliquer le filtre. |
| `unbindFromTarget(targetId)` | Délie le filtre du bloc cible. |
| `refreshTargetsByFilter(filterId | filterId[])` | Actualise les données des blocs cibles associés en fonction du ou des filtres. |

## Concepts clés

- **FilterModel** : Un modèle fournissant des conditions de filtrage (par exemple, FilterFormItemModel), qui doit implémenter `getFilterValue()` pour retourner la valeur de filtrage actuelle.
- **TargetModel** : Le bloc de données filtré ; sa `resource` doit supporter `addFilterGroup`, `removeFilterGroup` et `refresh`.

## Exemples

### Ajouter une configuration de filtre

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Actualiser les blocs cibles

```ts
// Dans doFilter / doReset d'un formulaire de filtrage
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Actualiser les cibles associées à plusieurs filtres
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Configuration des champs de connexion

```ts
// Obtenir la configuration de connexion
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Enregistrer la configuration de connexion
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Supprimer une configuration

```ts
// Supprimer toutes les configurations pour un filtre spécifique
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Supprimer toutes les configurations de filtre pour une cible spécifique
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Relatif à

- [ctx.resource](./resource.md) : La ressource du bloc cible doit supporter l'interface de filtrage.
- [ctx.model](./model.md) : Utilisé pour obtenir l'UID du modèle actuel pour filterId / targetId.