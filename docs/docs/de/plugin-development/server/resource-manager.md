:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# ResourceManager Ressourcenverwaltung

Die Ressourcenverwaltung von NocoBase kann bestehende Datenbanktabellen (Sammlungen) und Verknüpfungen (Associations) automatisch in Ressourcen umwandeln. Sie bietet zudem integrierte Operationstypen, die Entwicklern helfen, REST-API-Ressourcenoperationen schnell zu erstellen. Im Gegensatz zu traditionellen REST-APIs basieren NocoBase-Ressourcenoperationen nicht auf HTTP-Anfragemethoden, sondern definieren die auszuführende Operation explizit über `:action`.

## Automatische Ressourcengenerierung

NocoBase wandelt in der Datenbank definierte `Sammlungen` und `Associations` automatisch in Ressourcen um. Definieren Sie beispielsweise zwei Sammlungen, `posts` und `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Dadurch werden automatisch die folgenden Ressourcen generiert:

*   `posts`-Ressource
*   `tags`-Ressource
*   `posts.tags`-Associationsressource

Anfragebeispiele:

| Methode | Pfad                     | Operation                 |
| -------- | ---------------------- | ------------------------- |
| `GET`  | `/api/posts:list`      | Liste abfragen            |
| `GET`  | `/api/posts:get/1`     | Einzelnen Datensatz abfragen |
| `POST` | `/api/posts:create`    | Neu hinzufügen            |
| `POST` | `/api/posts:update/1`  | Aktualisieren             |
| `POST` | `/api/posts:destroy/1` | Löschen                   |

| Methode | Pfad                   | Operation                 |
| -------- | ---------------------- | ------------------------- |
| `GET`  | `/api/tags:list`       | Liste abfragen            |
| `GET`  | `/api/tags:get/1`      | Einzelnen Datensatz abfragen |
| `POST` | `/api/tags:create`     | Neu hinzufügen            |
| `POST` | `/api/tags:update/1`   | Aktualisieren             |
| `POST` | `/api/tags:destroy/1`  | Löschen                   |

| Methode | Pfad                           | Operation                                       |
| -------- | ------------------------------ | ----------------------------------------------- |
| `GET`  | `/api/posts/1/tags:list`       | Alle `tags` abfragen, die mit einem `post` verknüpft sind |
| `GET`  | `/api/posts/1/tags:get/1`      | Einen einzelnen `tag` unter einem `post` abfragen |
| `POST` | `/api/posts/1/tags:create`     | Einen einzelnen `tag` unter einem `post` erstellen |
| `POST` | `/api/posts/1/tags:update/1`   | Einen einzelnen `tag` unter einem `post` aktualisieren |
| `POST` | `/api/posts/1/tags:destroy/1`  | Einen einzelnen `tag` unter einem `post` löschen |
| `POST` | `/api/posts/1/tags:add`        | Verknüpfte `tags` zu einem `post` hinzufügen    |
| `POST` | `/api/posts/1/tags:remove`     | Verknüpfte `tags` von einem `post` entfernen    |
| `POST` | `/api/posts/1/tags:set`        | Alle verknüpften `tags` für einen `post` festlegen |
| `POST` | `/api/posts/1/tags:toggle`     | Die `tags`-Verknüpfung für einen `post` umschalten |

:::tip Hinweis

NocoBase-Ressourcenoperationen hängen nicht direkt von den Anfragemethoden ab, sondern bestimmen die auszuführenden Operationen durch explizite `:action`-Definitionen.

:::

## Ressourcenoperationen

NocoBase bietet eine Vielzahl integrierter Operationstypen, um unterschiedliche Geschäftsanforderungen zu erfüllen.

### Grundlegende CRUD-Operationen

| Operationsname   | Beschreibung                             | Anwendbare Ressourcentypen | Anfragemethode | Beispielpfad                |
| ---------------- | ---------------------------------------- | -------------------------- | -------------- | --------------------------- |
| `list`           | Listendaten abfragen                     | Alle                       | GET/POST       | `/api/posts:list`           |
| `get`            | Einzelnen Datensatz abfragen             | Alle                       | GET/POST       | `/api/posts:get/1`          |
| `create`         | Neuen Datensatz erstellen                | Alle                       | POST           | `/api/posts:create`         |
| `update`         | Datensatz aktualisieren                  | Alle                       | POST           | `/api/posts:update/1`       |
| `destroy`        | Datensatz löschen                        | Alle                       | POST           | `/api/posts:destroy/1`      |
| `firstOrCreate`  | Ersten Datensatz finden, falls nicht vorhanden, erstellen | Alle                       | POST           | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Datensatz aktualisieren, falls nicht vorhanden, erstellen | Alle                       | POST           | `/api/users:updateOrCreate` |

### Beziehungsoperationen

| Operationsname | Beschreibung                     | Anwendbare Beziehungstypen                        | Beispielpfad                   |
| -------------- | -------------------------------- | ------------------------------------------------- | ------------------------------ |
| `add`          | Verknüpfung hinzufügen           | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`       | Verknüpfung entfernen            | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | Verknüpfung zurücksetzen         | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | Verknüpfung hinzufügen oder entfernen | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Operationsparameter

Häufig verwendete Operationsparameter sind:

*   `filter`: Abfragebedingungen
*   `values`: Festzulegende Werte
*   `fields`: Anzugebende Rückgabefelder
*   `appends`: Verknüpfte Daten einschließen
*   `except`: Felder ausschließen
*   `sort`: Sortierregeln
*   `page`, `pageSize`: Paginierungsparameter
*   `paginate`: Paginierung aktivieren
*   `tree`: Baumstruktur zurückgeben
*   `whitelist`, `blacklist`: Feld-Whitelist/Blacklist
*   `updateAssociationValues`: Verknüpfungswerte aktualisieren

---

## Benutzerdefinierte Ressourcenoperationen

NocoBase ermöglicht das Registrieren zusätzlicher Operationen für bestehende Ressourcen. Sie können `registerActionHandlers` verwenden, um Operationen für alle oder bestimmte Ressourcen anzupassen.

### Globale Operationen registrieren

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Ressourcenspezifische Operationen registrieren

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Anfragebeispiele:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Namenskonvention: `resourceName:actionName`. Bei Verknüpfungen wird die Punktsyntax (`posts.comments`) verwendet.

## Benutzerdefinierte Ressourcen

Wenn Sie Ressourcen bereitstellen müssen, die nicht mit Datenbanktabellen verknüpft sind, können Sie diese mit der Methode `resourceManager.define` definieren:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Die Anfragemethoden sind konsistent mit den automatisch generierten Ressourcen:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (unterstützt standardmäßig sowohl GET als auch POST)

## Benutzerdefinierte Middleware

Verwenden Sie die Methode `resourceManager.use()`, um globale Middleware zu registrieren. Zum Beispiel:

Globale Logging-Middleware

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Spezielle Context-Eigenschaften

Wenn Middleware oder Aktionen die `resourceManager`-Ebene erreichen können, bedeutet dies, dass die Ressource definitiv existiert.

### ctx.action

- `ctx.action.actionName`: Operationsname
- `ctx.action.resourceName`: Kann eine Sammlung oder Association sein
- `ctx.action.params`: Operationsparameter

### ctx.dataSource

Das aktuelle Datenquellenobjekt.

### ctx.getCurrentRepository()

Das aktuelle Repository-Objekt.

## So erhalten Sie `resourceManager`-Objekte für verschiedene Datenquellen

`resourceManager` gehört zu einer Datenquelle; Operationen können für verschiedene Datenquellen separat registriert werden.

### Haupt-Datenquelle

Für die Haupt-Datenquelle können Sie `app.resourceManager` direkt verwenden, um Operationen auszuführen:

```ts
app.resourceManager.registerActionHandlers();
```

### Andere Datenquellen

Für andere Datenquellen können Sie über `dataSourceManager` eine spezifische Datenquelleninstanz abrufen und deren `resourceManager` für Operationen verwenden:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Alle Datenquellen durchlaufen

Wenn Sie dieselben Operationen für alle hinzugefügten Datenquellen ausführen möchten, können Sie die Methode `dataSourceManager.afterAddDataSource` verwenden, um diese zu durchlaufen und sicherzustellen, dass der `resourceManager` jeder Datenquelle die entsprechenden Operationen registrieren kann:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```