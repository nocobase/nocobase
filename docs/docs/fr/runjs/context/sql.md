:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` fournit des capacités d'exécution et de gestion SQL, couramment utilisées dans RunJS (comme JSBlock et les flux de travail) pour accéder directement à la base de données. Il prend en charge l'exécution SQL temporaire, l'exécution de modèles SQL enregistrés par ID, la liaison de paramètres (binding), les variables de modèle (`{{ctx.xxx}}`) et le contrôle du type de résultat.

## Scénarios d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock** | Rapports statistiques personnalisés, listes filtrées complexes et requêtes d'agrégation multi-tables. |
| **Bloc de graphique** | Enregistrement de modèles SQL pour piloter les sources de données des graphiques. |
| **Flux de travail / Liaison** | Exécution de SQL prédéfini pour récupérer des données destinées à la logique suivante. |
| **SQLResource** | Utilisé en conjonction avec `ctx.initResource('SQLResource')` pour des scénarios tels que les listes paginées. |

> Remarque : `ctx.sql` accède à la base de données via l'API `flowSql`. Assurez-vous que l'utilisateur actuel dispose des permissions d'exécution pour la source de données correspondante.

## Permissions

| Permission | Méthode | Description |
|------|------|------|
| **Utilisateur connecté** | `runById` | Exécuter selon l'ID d'un modèle SQL configuré. |
| **Permission de configuration SQL** | `run`, `save`, `destroy` | Exécuter du SQL temporaire, ou enregistrer/mettre à jour/supprimer des modèles SQL. |

La logique front-end destinée aux utilisateurs réguliers doit utiliser `ctx.sql.runById(uid, options)`. Lorsqu'un SQL dynamique ou la gestion de modèles est nécessaire, assurez-vous que le rôle actuel possède les permissions de configuration SQL.

## Définition des types

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Méthodes courantes

| Méthode | Description | Exigence de permission |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Exécute du SQL temporaire ; prend en charge la liaison de paramètres et les variables de modèle. | Permission de configuration SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Enregistre ou met à jour un modèle SQL par ID pour réutilisation. | Permission de configuration SQL |
| `ctx.sql.runById(uid, options?)` | Exécute un modèle SQL précédemment enregistré par son ID. | Tout utilisateur connecté |
| `ctx.sql.destroy(uid)` | Supprime un modèle SQL spécifié par ID. | Permission de configuration SQL |

Remarque :

- `run` est utilisé pour le débogage SQL et nécessite des permissions de configuration.
- `save` et `destroy` sont utilisés pour gérer les modèles SQL et nécessitent des permissions de configuration.
- `runById` est ouvert aux utilisateurs réguliers ; il peut uniquement exécuter des modèles enregistrés et ne peut pas déboguer ou modifier le SQL.
- Lorsqu'un modèle SQL est modifié, `save` doit être appelé pour persister les changements.

## Paramètres

### options pour run / runById

| Paramètre | Type | Description |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Variables de liaison. Utilisez un objet pour les espaces réservés `:name` ou un tableau pour les espaces réservés `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Type de résultat : plusieurs lignes, ligne unique ou valeur unique. Par défaut `selectRows`. |
| `dataSourceKey` | `string` | Identifiant de la source de données. Par défaut, la source de données principale. |
| `filter` | `Record<string, any>` | Conditions de filtrage supplémentaires (selon le support de l'interface). |

### options pour save

| Paramètre | Type | Description |
|------|------|------|
| `uid` | `string` | Identifiant unique du modèle. Une fois enregistré, il peut être exécuté via `runById(uid, ...)`. |
| `sql` | `string` | Contenu SQL. Prend en charge les variables de modèle `{{ctx.xxx}}` et les espaces réservés `:name` / `?`. |
| `dataSourceKey` | `string` | Optionnel. Identifiant de la source de données. |

## Variables de modèle SQL et liaison de paramètres

### Variables de modèle `{{ctx.xxx}}`

Vous pouvez utiliser `{{ctx.xxx}}` dans le SQL pour référencer des variables de contexte. Celles-ci sont analysées en valeurs réelles avant l'exécution :

```js
// Référence à ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Les sources des variables référençables sont les mêmes que pour `ctx.getVar()` (par exemple, `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` personnalisé, etc.).

### Liaison de paramètres (Parameter Binding)

- **Paramètres nommés** : Utilisez `:name` dans le SQL et passez un objet `{ name: value }` dans `bind`.
- **Paramètres positionnels** : Utilisez `?` dans le SQL et passez un tableau `[value1, value2]` dans `bind`.

```js
// Paramètres nommés
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Paramètres positionnels
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Paris', 'active'], type: 'selectVar' }
);
```

## Exemples

### Exécution d'un SQL temporaire (Nécessite la permission de configuration SQL)

```js
// Plusieurs lignes (par défaut)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Ligne unique
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Valeur unique (ex: COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Utilisation de variables de modèle

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Enregistrement et réutilisation de modèles

```js
// Enregistrer (Nécessite la permission de configuration SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Tout utilisateur connecté peut exécuter ceci
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Supprimer le modèle (Nécessite la permission de configuration SQL)
await ctx.sql.destroy('active-users-report');
```

### Liste paginée (SQLResource)

```js
// Utilisez SQLResource lorsque la pagination ou le filtrage est nécessaire
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID du modèle SQL enregistré
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Contient page, pageSize, etc.
```

## Relation avec ctx.resource et ctx.request

| Usage | Utilisation recommandée |
|------|----------|
| **Exécuter une requête SQL** | `ctx.sql.run()` ou `ctx.sql.runById()` |
| **Liste paginée SQL (Bloc)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Requête HTTP générale** | `ctx.request()` |

`ctx.sql` encapsule l'API `flowSql` et est spécialisé pour les scénarios SQL ; `ctx.request` peut être utilisé pour appeler n'importe quelle API.

## Précautions

- Utilisez la liaison de paramètres (`:name` / `?`) au lieu de la concaténation de chaînes pour éviter les injections SQL.
- `type: 'selectVar'` retourne une valeur scalaire, généralement utilisée pour `COUNT`, `SUM`, etc.
- Les variables de modèle `{{ctx.xxx}}` sont résolues avant l'exécution ; assurez-vous que les variables correspondantes sont définies dans le contexte.

## Voir aussi

- [ctx.resource](./resource.md) : Ressources de données ; SQLResource appelle l'API `flowSql` en interne.
- [ctx.initResource()](./init-resource.md) : Initialise SQLResource pour les listes paginées, etc.
- [ctx.request()](./request.md) : Requêtes HTTP générales.