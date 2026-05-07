:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Une ressource orientée vers les tables de données (collections) : les requêtes renvoient un tableau et prennent en charge la pagination, le filtrage, le tri ainsi que les opérations CRUD (création, lecture, mise à jour, suppression). Elle est adaptée aux scénarios impliquant "plusieurs enregistrements" tels que les tableaux et les listes. Contrairement à [APIResource](./api-resource.md), `MultiRecordResource` spécifie le nom de la ressource via `setResourceName()`, construit automatiquement des URL telles que `users:list` ou `users:create`, et intègre des capacités natives pour la pagination, le filtrage et la sélection de lignes.

**Héritage** : FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Mode de création** : `ctx.makeResource('MultiRecordResource')` ou `ctx.initResource('MultiRecordResource')`. Avant toute utilisation, vous devez appeler `setResourceName('nom_de_la_collection')` (par exemple `'users'`) ; dans RunJS, `ctx.api` est injecté par l'environnement d'exécution.

---

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Blocs de tableau** | Les blocs de tableau et de liste utilisent `MultiRecordResource` par défaut, prenant en charge la pagination, le filtrage et le tri. |
| **Listes JSBlock** | Charger des données à partir de collections (utilisateurs, commandes, etc.) dans un JSBlock et effectuer un rendu personnalisé. |
| **Opérations groupées** | Utiliser `getSelectedRows()` pour obtenir les lignes sélectionnées et `destroySelectedRows()` pour une suppression groupée. |
| **Ressources associées** | Charger des collections associées via des formats tels que `users.tags`, ce qui nécessite l'utilisation de `setSourceId(ID_enregistrement_parent)`. |

---

## Format des données

- `getData()` renvoie un **tableau d'enregistrements**, correspondant au champ `data` de la réponse de l'API de liste.
- `getMeta()` renvoie les métadonnées de pagination et autres : `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Nom de la ressource et source de données

| Méthode | Description |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nom de la ressource, ex: `'users'`, `'users.tags'` (ressource associée). |
| `setSourceId(id)` / `getSourceId()` | ID de l'enregistrement parent pour les ressources associées (ex: pour `users.tags`, passez la clé primaire de l'utilisateur). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifiant de la source de données (utilisé dans les scénarios multi-sources). |

---

## Paramètres de requête (Filtre / Champs / Tri)

| Méthode | Description |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filtrer par clé primaire (pour un `get` unique, etc.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Conditions de filtrage, prenant en charge les opérateurs `$eq`, `$ne`, `$in`, etc. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Groupes de filtres (pour combiner plusieurs conditions). |
| `setFields(fields)` / `getFields()` | Champs demandés (liste blanche). |
| `setSort(sort)` / `getSort()` | Tri, ex: `['-createdAt']` pour un tri décroissant par date de création. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Chargement des associations (ex: `['user', 'tags']`). |

---

## Pagination

| Méthode | Description |
|------|------|
| `setPage(page)` / `getPage()` | Page actuelle (commence à 1). |
| `setPageSize(size)` / `getPageSize()` | Nombre d'éléments par page, par défaut 20. |
| `getTotalPage()` | Nombre total de pages. |
| `getCount()` | Nombre total d'enregistrements (provenant des métadonnées du serveur). |
| `next()` / `previous()` / `goto(page)` | Changer de page et déclencher `refresh`. |

---

## Lignes sélectionnées (Scénarios de tableau)

| Méthode | Description |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Données des lignes actuellement sélectionnées, utilisées pour les suppressions groupées ou d'autres opérations. |

---

## CRUD et opérations de liste

| Méthode | Description |
|------|------|
| `refresh()` | Demande la liste avec les paramètres actuels, met à jour `getData()` et les métadonnées de pagination, et déclenche l'événement `'refresh'`. |
| `get(filterByTk)` | Demande un enregistrement unique et le renvoie (ne l'écrit pas dans `getData`). |
| `create(data, options?)` | Crée un enregistrement. L'option `{ refresh: false }` empêche le rafraîchissement automatique. Déclenche `'saved'`. |
| `update(filterByTk, data, options?)` | Met à jour un enregistrement par sa clé primaire. |
| `destroy(target)` | Supprime des enregistrements ; `target` peut être une clé primaire, un objet de ligne ou un tableau de clés/objets (suppression groupée). |
| `destroySelectedRows()` | Supprime les lignes actuellement sélectionnées (génère une erreur si aucune n'est sélectionnée). |
| `setItem(index, item)` | Remplace localement une ligne de données spécifique (n'initie pas de requête). |
| `runAction(actionName, options)` | Appelle n'importe quelle action de ressource (ex: actions personnalisées). |

---

## Configuration et événements

| Méthode | Description |
|------|------|
| `setRefreshAction(name)` | L'action appelée lors du rafraîchissement, par défaut `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Configuration de la requête pour la création ou la mise à jour. |
| `on('refresh', fn)` / `on('saved', fn)` | Déclenché après la fin du rafraîchissement ou après une sauvegarde. |

---

## Exemples

### Liste de base

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtrage et tri

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Chargement des associations

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Création et pagination

```js
await ctx.resource.create({ name: 'Jean Dupont', email: 'jean.dupont@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Suppression groupée des lignes sélectionnées

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Veuillez d’abord sélectionner des données');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Supprimé'));
```

### Écouter l'événement refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Ressource associée (Sous-table)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Remarques

- **setResourceName est obligatoire** : Vous devez appeler `setResourceName('nom_de_la_collection')` avant toute utilisation, sinon l'URL de la requête ne pourra pas être construite.
- **Ressources associées** : Lorsque le nom de la ressource est au format `parent.enfant` (ex: `users.tags`), vous devez d'abord appeler `setSourceId(clé_primaire_parent)`.
- **Anti-rebond (Debouncing) du refresh** : Plusieurs appels à `refresh()` au sein de la même boucle d'événements n'exécuteront que le dernier appel pour éviter les requêtes redondantes.
- **getData renvoie un tableau** : Les données renvoyées par l'API de liste sont un tableau d'enregistrements, et `getData()` renvoie directement ce tableau.

---

## Liens associés

- [ctx.resource](../context/resource.md) - L'instance de ressource dans le contexte actuel
- [ctx.initResource()](../context/init-resource.md) - Initialiser et lier à ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Créer une nouvelle instance de ressource sans liaison
- [APIResource](./api-resource.md) - Ressource API générale appelée par URL
- [SingleRecordResource](./single-record-resource.md) - Orientée vers un enregistrement unique