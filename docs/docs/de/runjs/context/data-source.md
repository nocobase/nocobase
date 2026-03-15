:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/data-source).
:::

# ctx.dataSource

Die an den aktuellen RunJS-Ausführungskontext gebundene `Datenquelle`-Instanz (`DataSource`), die verwendet wird, um auf Sammlungen, Feld-Metadaten zuzugreifen und Sammlungs-Konfigurationen **innerhalb der aktuellen Datenquelle** zu verwalten. Sie entspricht normalerweise der für die aktuelle Seite oder den aktuellen Block ausgewählten Datenquelle (z. B. die Hauptdatenbank `main`).

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **Operationen auf einer einzelnen Datenquelle** | Abrufen von Sammlungs- und Feld-Metadaten, wenn die aktuelle Datenquelle bekannt ist. |
| **Verwaltung von Sammlungen** | Abrufen, Hinzufügen, Aktualisieren oder Löschen von Sammlungen unter der aktuellen Datenquelle. |
| **Felder über Pfade abrufen** | Verwendung des Formats `sammlungsName.feldPfad`, um Felddefinitionen abzurufen (unterstützt Verknüpfungspfade). |

> Hinweis: `ctx.dataSource` repräsentiert eine einzelne Datenquelle für den aktuellen Kontext. Um andere Datenquellen aufzuzählen oder darauf zuzugreifen, verwenden Sie bitte [ctx.dataSourceManager](./data-source-manager.md).

## Typdefinition

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Schreibgeschützte Eigenschaften
  get flowEngine(): FlowEngine;   // Aktuelle FlowEngine-Instanz
  get displayName(): string;      // Anzeigename (unterstützt i18n)
  get key(): string;              // Datenquellen-Key, z. B. 'main'
  get name(): string;             // Entspricht dem Key

  // Lesen von Sammlungen
  getCollections(): Collection[];                      // Alle Sammlungen abrufen
  getCollection(name: string): Collection | undefined; // Sammlung nach Name abrufen
  getAssociation(associationName: string): CollectionField | undefined; // Verknüpfungs feld abrufen (z. B. users.roles)

  // Verwaltung von Sammlungen
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Feld-Metadaten
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Häufig genutzte Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|------|------|------|
| `key` | `string` | Datenquellen-Key, z. B. `'main'` |
| `name` | `string` | Entspricht dem Key |
| `displayName` | `string` | Anzeigename (unterstützt i18n) |
| `flowEngine` | `FlowEngine` | Aktuelle FlowEngine-Instanz |

## Häufig genutzte Methoden

| Methode | Beschreibung |
|------|------|
| `getCollections()` | Ruft alle Sammlungen unter der aktuellen Datenquelle ab (sortiert, versteckte gefiltert). |
| `getCollection(name)` | Ruft eine Sammlung nach Name ab; `name` kann `sammlungsName.feldName` sein, um die Ziel-Sammlung einer Verknüpfung abzurufen. |
| `getAssociation(associationName)` | Ruft eine Verknüpfungsfeld-Definition über `sammlungsName.feldName` ab. |
| `getCollectionField(fieldPath)` | Ruft eine Felddefinition über `sammlungsName.feldPfad` ab, unterstützt Verknüpfungspfade wie `users.profile.avatar`. |

## Beziehung zu ctx.dataSourceManager

| Anforderung | Empfohlene Verwendung |
|------|----------|
| **Einzelne an den aktuellen Kontext gebundene Datenquelle** | `ctx.dataSource` |
| **Einstiegspunkt für alle Datenquellen** | `ctx.dataSourceManager` |
| **Sammlung innerhalb der aktuellen Datenquelle abrufen** | `ctx.dataSource.getCollection(name)` |
| **Datenquellenübergreifendes Abrufen von Sammlungen** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Feld innerhalb der aktuellen Datenquelle abrufen** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Datenquellenübergreifendes Abrufen von Feldern** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Beispiel

### Sammlungen und Felder abrufen

```ts
// Alle Sammlungen abrufen
const collections = ctx.dataSource.getCollections();

// Sammlung nach Name abrufen
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Felddefinition über "sammlungsName.feldPfad" abrufen (unterstützt Verknüpfungen)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Verknüpfungsfelder abrufen

```ts
// Verknüpfungsfeld-Definition über sammlungsName.feldName abrufen
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Basierend auf der Struktur der Ziel-Sammlung verarbeiten
}
```

### Sammlungen für dynamische Verarbeitung durchlaufen

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Validierung oder dynamische Benutzeroberfläche basierend auf Feld-Metadaten durchführen

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // UI-Logik oder Validierung basierend auf Interface, Enum, Validierung usw. durchführen
}
```

## Hinweise

- Das Pfadformat für `getCollectionField(fieldPath)` ist `sammlungsName.feldPfad`, wobei das erste Segment der Name der Sammlung ist und die folgenden Segmente der Feldpfad sind (unterstützt Verknüpfungen, z. B. `user.name`).
- `getCollection(name)` unterstützt das Format `sammlungsName.feldName` und gibt die Ziel-Sammlung des Verknüpfungsfeldes zurück.
- Im RunJS-Kontext wird `ctx.dataSource` normalerweise durch die Datenquelle des aktuellen Blocks oder der aktuellen Seite bestimmt. Wenn keine Datenquelle an den Kontext gebunden ist, kann sie `undefined` sein; es wird empfohlen, vor der Verwendung eine Prüfung auf Nullwerte durchzuführen.

## Verwandte Themen

- [ctx.dataSourceManager](./data-source-manager.md): Datenquellen-Manager, verwaltet alle Datenquellen.
- [ctx.collection](./collection.md): Die mit dem aktuellen Kontext verknüpfte Sammlung.
- [ctx.collectionField](./collection-field.md): Die Sammlungsfeld-Definition für das aktuelle Feld.