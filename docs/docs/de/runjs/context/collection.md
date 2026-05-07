:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/collection).
:::

# ctx.collection

Die Instanz der Sammlung (Collection), die mit dem aktuellen RunJS-Ausführungskontext verknüpft ist. Sie wird verwendet, um auf Metadaten der Sammlung, Felddefinitionen, Primärschlüssel und andere Konfigurationen zuzugreifen. Sie stammt normalerweise von `ctx.blockModel.collection` oder `ctx.collectionField?.collection`.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JS-Block** | Die an den Block gebundene Sammlung; Zugriff auf `name`, `getFields`, `filterTargetKey` usw. möglich. |
| **JS-Feld / JS-Element / JS-Spalte** | Die Sammlung, zu der das aktuelle Feld gehört (oder die Sammlung des übergeordneten Blocks), wird verwendet, um Feldlisten, Primärschlüssel usw. abzurufen. |
| **Tabellenspalte / Detail-Block** | Wird für das Rendering basierend auf der Sammlungsstruktur oder zur Übergabe von `filterByTk` beim Öffnen von Popups verwendet. |

> Hinweis: `ctx.collection` ist in Szenarien verfügbar, in denen ein Daten-Block, Formular-Block oder Tabellen-Block an eine Sammlung gebunden ist. In einem unabhängigen JS-Block, der nicht an eine Sammlung gebunden ist, kann dieser Wert `null` sein. Es wird empfohlen, vor der Verwendung eine Prüfung auf Nullwerte durchzuführen.

## Typdefinition

```ts
collection: Collection | null | undefined;
```

## Gängige Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|------|------|------|
| `name` | `string` | Name der Sammlung (z. B. `users`, `orders`) |
| `title` | `string` | Titel der Sammlung (einschließlich Internationalisierung) |
| `filterTargetKey` | `string \| string[]` | Name des Primärschlüsselfeldes, verwendet für `filterByTk` und `getFilterByTK` |
| `dataSourceKey` | `string` | Schlüssel der Datenquelle (z. B. `main`) |
| `dataSource` | `DataSource` | Die Instanz der Datenquelle, zu der sie gehört |
| `template` | `string` | Vorlage der Sammlung (z. B. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Liste der Felder, die als Titel angezeigt werden können |
| `titleCollectionField` | `CollectionField` | Die Instanz des Titelfeldes |

## Gängige Methoden

| Methode | Beschreibung |
|------|------|
| `getFields(): CollectionField[]` | Ruft alle Felder ab (einschließlich vererbter Felder) |
| `getField(name: string): CollectionField \| undefined` | Ruft ein einzelnes Feld anhand des Feldnamens ab |
| `getFieldByPath(path: string): CollectionField \| undefined` | Ruft ein Feld anhand des Pfads ab (unterstützt Assoziationen, z. B. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Ruft Assoziationsfelder ab; `types` können `['one']`, `['many']` usw. sein |
| `getFilterByTK(record): any` | Extrahiert den Primärschlüsselwert aus einem Datensatz, verwendet für `filterByTk` der API |

## Beziehung zu ctx.collectionField und ctx.blockModel

| Anforderung | Empfohlene Verwendung |
|------|----------|
| **Mit dem aktuellen Kontext verknüpfte Sammlung** | `ctx.collection` (entspricht `ctx.blockModel?.collection` oder `ctx.collectionField?.collection`) |
| **Sammlungsdefinition des aktuellen Feldes** | `ctx.collectionField?.collection` (die Sammlung, zu der das Feld gehört) |
| **Ziel-Sammlung der Assoziation** | `ctx.collectionField?.targetCollection` (die Ziel-Sammlung eines Assoziationsfeldes) |

In Szenarien wie Untertabellen kann `ctx.collection` die Ziel-Sammlung der Assoziation sein; in Standardformularen oder Tabellen ist es normalerweise die an den Block gebundene Sammlung.

## Beispiele

### Primärschlüssel abrufen und Popup öffnen

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Felder für Validierung oder Verknüpfung durchlaufen

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} ist ein Pflichtfeld`);
    return;
  }
}
```

### Assoziationsfelder abrufen

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Wird zum Erstellen von Untertabellen, verknüpften Ressourcen usw. verwendet
```

## Hinweise

- `filterTargetKey` ist der Name des Primärschlüsselfeldes der Sammlung. Einige Sammlungen verwenden möglicherweise ein `string[]` für zusammengesetzte Primärschlüssel. Wenn dies nicht konfiguriert ist, wird üblicherweise `'id'` als Rückfalloption verwendet.
- In Szenarien wie **Untertabellen oder Assoziationsfeldern** kann `ctx.collection` auf die Ziel-Sammlung der Assoziation verweisen, was sich von `ctx.blockModel.collection` unterscheidet.
- `getFields()` führt Felder aus vererbten Sammlungen zusammen; lokale Felder überschreiben vererbte Felder mit demselben Namen.

## Verwandte Themen

- [ctx.collectionField](./collection-field.md): Die Felddefinition der Sammlung für das aktuelle Feld
- [ctx.blockModel](./block-model.md): Der übergeordnete Block, der das aktuelle JS hostet, einschließlich `collection`
- [ctx.model](./model.md): Das aktuelle Modell, das `collection` enthalten kann