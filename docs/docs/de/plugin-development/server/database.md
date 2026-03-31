:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Database

`Database` ist ein wichtiger Bestandteil von Datenquellen (`DataSource`) vom Typ Datenbank. Jede datenbankbasierte Datenquelle verfügt über eine entsprechende `Database`-Instanz, die Sie über `dataSource.db` aufrufen können. Die `Database`-Instanz der Haupt-Datenquelle bietet zusätzlich den praktischen Alias `app.db`. Die Kenntnis der gängigen `db`-Methoden ist die Grundlage für die Entwicklung von serverseitigen Plugins.

## Bestandteile der Database

Eine typische `Database` setzt sich aus den folgenden Teilen zusammen:

- **Sammlung**: Definiert die Struktur von Datentabellen.
- **Model**: Entspricht den ORM-Modellen (normalerweise von Sequelize verwaltet).
- **Repository**: Die Repository-Schicht, die die Datenzugriffslogik kapselt und übergeordnete Operationsmethoden bereitstellt.
- **FieldType**: Feldtypen.
- **FilterOperator**: Operatoren, die zum Filtern verwendet werden.
- **Event**: Lebenszyklus-Ereignisse und Datenbank-Ereignisse.

## Einsatzzeitpunkte in Plugins

### Geeignete Aktionen in der `beforeLoad`-Phase

In dieser Phase sind Datenbankoperationen nicht erlaubt. Sie eignet sich für die Registrierung statischer Klassen oder das Abonnieren von Ereignissen.

- `db.registerFieldTypes()` — Benutzerdefinierte Feldtypen
- `db.registerModels()` — Benutzerdefinierte Modellklassen registrieren
- `db.registerRepositories()` — Benutzerdefinierte Repository-Klassen registrieren
- `db.registerOperators()` — Benutzerdefinierte Filteroperatoren registrieren
- `db.on()` — Datenbankbezogene Ereignisse abonnieren

### Geeignete Aktionen in der `load`-Phase

In dieser Phase sind alle vorhergehenden Klassendefinitionen und Ereignisse bereits geladen, sodass beim Laden von Datentabellen keine Abhängigkeiten fehlen oder übersehen werden.

- `db.defineCollection()` — Neue Datentabellen definieren
- `db.extendCollection()` — Bestehende Datentabellenkonfigurationen erweitern

Wenn Sie integrierte Tabellen für Plugins definieren, empfiehlt es sich, diese im Verzeichnis `./src/server/collections` abzulegen. Weitere Informationen finden Sie unter [Sammlungen](./collections.md).

## Datenoperationen

Die `Database` bietet zwei Hauptmethoden für den Datenzugriff und die Datenbearbeitung:

### Operationen über das Repository

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Die Repository-Schicht wird typischerweise verwendet, um Geschäftslogik wie Paginierung, Filterung, Berechtigungsprüfungen usw. zu kapseln.

### Operationen über das Model

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Die Model-Schicht entspricht direkt den ORM-Entitäten und eignet sich für Datenbankoperationen auf niedrigerer Ebene.

## In welchen Phasen sind Datenbankoperationen erlaubt?

### Plugin-Lebenszyklus

| Phase                | Datenbankoperationen erlaubt |
|----------------------|------------------------------|
| `staticImport`       | Nein                         |
| `afterAdd`           | Nein                         |
| `beforeLoad`         | Nein                         |
| `load`               | Nein                         |
| `install`            | Ja                           |
| `beforeEnable`       | Ja                           |
| `afterEnable`        | Ja                           |
| `beforeDisable`      | Ja                           |
| `afterDisable`       | Ja                           |
| `remove`             | Ja                           |
| `handleSyncMessage`  | Ja                           |

### App-Ereignisse

| Phase                | Datenbankoperationen erlaubt |
|----------------------|------------------------------|
| `beforeLoad`         | Nein                         |
| `afterLoad`          | Nein                         |
| `beforeStart`        | Ja                           |
| `afterStart`         | Ja                           |
| `beforeInstall`      | Nein                         |
| `afterInstall`       | Ja                           |
| `beforeStop`         | Ja                           |
| `afterStop`          | Nein                         |
| `beforeDestroy`      | Ja                           |
| `afterDestroy`       | Nein                         |
| `beforeLoadPlugin`   | Nein                         |
| `afterLoadPlugin`    | Nein                         |
| `beforeEnablePlugin` | Ja                           |
| `afterEnablePlugin`  | Ja                           |
| `beforeDisablePlugin`| Ja                           |
| `afterDisablePlugin` | Ja                           |
| `afterUpgrade`       | Ja                           |

### Database-Ereignisse/Hooks

| Phase                         | Datenbankoperationen erlaubt |
|-------------------------------|------------------------------|
| `beforeSync`                  | Nein                         |
| `afterSync`                   | Ja                           |
| `beforeValidate`              | Ja                           |
| `afterValidate`               | Ja                           |
| `beforeCreate`                | Ja                           |
| `afterCreate`                 | Ja                           |
| `beforeUpdate`                | Ja                           |
| `afterUpdate`                 | Ja                           |
| `beforeSave`                  | Ja                           |
| `afterSave`                   | Ja                           |
| `beforeDestroy`               | Ja                           |
| `afterDestroy`                | Ja                           |
| `afterCreateWithAssociations` | Ja                           |
| `afterUpdateWithAssociations` | Ja                           |
| `afterSaveWithAssociations`   | Ja                           |
| `beforeDefineCollection`      | Nein                         |
| `afterDefineCollection`       | Nein                         |
| `beforeRemoveCollection`      | Nein                         |
| `afterRemoveCollection`       | Nein                         |