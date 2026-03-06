:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/resource/sql-resource).
:::

# SQLResource

Une Resource permettant d'exécuter des requêtes basées sur des **configurations SQL enregistrées** ou du **SQL dynamique**, les données provenant d'interfaces telles que `flowSql:run` / `flowSql:runById`. Elle est adaptée aux rapports, aux statistiques, aux listes SQL personnalisées et à d'autres scénarios. Contrairement à [MultiRecordResource](./multi-record-resource.md), SQLResource ne dépend pas des collections ; elle exécute directement des requêtes SQL et prend en charge la pagination, la liaison de paramètres (binding), les variables de template (`{{ctx.xxx}}`) et le contrôle du type de résultat.

**Héritage** : FlowResource → APIResource → BaseRecordResource → SQLResource.

**Méthode de création** : `ctx.makeResource('SQLResource')` ou `ctx.initResource('SQLResource')`. Pour une exécution basée sur une configuration enregistrée, utilisez `setFilterByTk(uid)` (l'UID du template SQL). Pour le débogage, utilisez `setDebug(true)` + `setSQL(sql)` pour exécuter directement le SQL. Dans RunJS, `ctx.api` est injecté par l'environnement d'exécution.

---

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **Rapports / Statistiques** | Agrégations complexes, requêtes multi-tables et indicateurs statistiques personnalisés. |
| **Listes personnalisées JSBlock** | Implémentation de filtrages, tris ou associations spécifiques via SQL avec un rendu personnalisé. |
| **Blocs de graphique** | Pilotage des sources de données de graphiques avec des templates SQL enregistrés, incluant le support de la pagination. |
| **Choix entre SQLResource et ctx.sql** | Utilisez SQLResource lorsque la pagination, les événements ou les données réactives sont nécessaires ; utilisez `ctx.sql.run()` / `ctx.sql.runById()` pour des requêtes simples et ponctuelles. |

---

## Format des données

- `getData()` retourne différents formats selon `setSQLType()` :
  - `selectRows` (par défaut) : **Tableau**, résultats sur plusieurs lignes.
  - `selectRow` : **Objet unique**.
  - `selectVar` : **Valeur scalaire** (ex: COUNT, SUM).
- `getMeta()` retourne les métadonnées telles que la pagination : `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Configuration SQL et modes d'exécution

| Méthode | Description |
|------|------|
| `setFilterByTk(uid)` | Définit l'UID du template SQL à exécuter (correspond à `runById` ; doit être préalablement enregistré dans l'interface d'administration). |
| `setSQL(sql)` | Définit le SQL brut (utilisé pour `runBySQL` uniquement lorsque le mode débogage `setDebug(true)` est activé). |
| `setSQLType(type)` | Type de résultat : `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Si défini sur `true`, `refresh` appelle `runBySQL()` ; sinon, il appelle `runById()`. |
| `run()` | Appelle `runBySQL()` ou `runById()` selon l'état du débogage. |
| `runBySQL()` | Exécute en utilisant le SQL défini dans `setSQL` (nécessite `setDebug(true)`). |
| `runById()` | Exécute le template SQL enregistré en utilisant l'UID actuel. |

---

## Paramètres et contexte

| Méthode | Description |
|------|------|
| `setBind(bind)` | Lie les variables. Utilisez un objet pour les marqueurs `:name` ou un tableau pour les marqueurs `?`. |
| `setLiquidContext(ctx)` | Contexte du template (Liquid), utilisé pour analyser `{{ctx.xxx}}`. |
| `setFilter(filter)` | Conditions de filtrage supplémentaires (passées dans les données de la requête). |
| `setDataSourceKey(key)` | Identifiant de la source de données (utilisé dans les environnements multi-sources). |

---

## Pagination

| Méthode | Description |
|------|------|
| `setPage(page)` / `getPage()` | Page actuelle (par défaut 1). |
| `setPageSize(size)` / `getPageSize()` | Éléments par page (par défaut 20). |
| `next()` / `previous()` / `goto(page)` | Navigue entre les pages et déclenche `refresh`. |

Dans le SQL, vous pouvez utiliser `{{ctx.limit}}` et `{{ctx.offset}}` pour référencer les paramètres de pagination. SQLResource injecte automatiquement `limit` et `offset` dans le contexte.

---

## Récupération de données et événements

| Méthode | Description |
|------|------|
| `refresh()` | Exécute le SQL (`runById` ou `runBySQL`), écrit le résultat dans `setData(data)`, met à jour les métadonnées et déclenche l'événement `'refresh'`. |
| `runAction(actionName, options)` | Appelle les actions sous-jacentes (ex: `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Déclenché lorsque le rafraîchissement est terminé ou lorsque le chargement commence. |

---

## Exemples

### Exécution via un template enregistré (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID du template SQL enregistré
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, etc.
```

### Mode débogage : Exécution directe du SQL (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Pagination et navigation

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigation
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Types de résultats

```js
// Plusieurs lignes (par défaut)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Ligne unique
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Valeur unique (ex: COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Utilisation de variables de template

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Écoute de l'événement refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Remarques

- **runById nécessite l'enregistrement préalable du template** : L'UID utilisé dans `setFilterByTk(uid)` doit correspondre à un ID de template SQL déjà enregistré dans l'interface d'administration. Vous pouvez l'enregistrer via `ctx.sql.save({ uid, sql })`.
- **Le mode débogage nécessite des permissions** : `setDebug(true)` utilise `flowSql:run`, ce qui nécessite que le rôle actuel dispose des permissions de configuration SQL. `runById` nécessite seulement que l'utilisateur soit connecté.
- **Anti-rebond (Debouncing) du refresh** : Plusieurs appels à `refresh()` au sein de la même boucle d'événements n'exécuteront que le dernier appel afin d'éviter les requêtes redondantes.
- **Liaison de paramètres pour la prévention d'injections** : Utilisez `setBind()` avec les marqueurs `:name` ou `?` au lieu de la concaténation de chaînes de caractères pour prévenir les injections SQL.

---

## Voir aussi

- [ctx.sql](../context/sql.md) - Exécution et gestion SQL ; `ctx.sql.runById` est adapté aux requêtes simples et ponctuelles.
- [ctx.resource](../context/resource.md) - L'instance de ressource dans le contexte actuel.
- [ctx.initResource()](../context/init-resource.md) - Initialise et lie à `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Crée une nouvelle instance de ressource sans liaison.
- [APIResource](./api-resource.md) - Ressource API générale.
- [MultiRecordResource](./multi-record-resource.md) - Conçu pour les collections et les listes.