:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/collection-field).
:::

# ctx.collectionField

Die Instanz des Datentabellenfeldes (`CollectionField`), die mit dem aktuellen RunJS-Ausführungskontext verknüpft ist. Sie wird verwendet, um auf Metadaten, Typen, Validierungsregeln und Verknüpfungsinformationen des Feldes zuzugreifen. Sie existiert nur, wenn das Feld an eine Definition einer **Sammlung** gebunden ist; benutzerdefinierte oder virtuelle Felder können `null` sein.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSField** | Durchführung von Verknüpfungen oder Validierungen in Formularfeldern basierend auf `interface`, `enum`, `targetCollection` usw. |
| **JSItem** | Zugriff auf Metadaten des Feldes, das der aktuellen Spalte in Untertabellen-Elementen entspricht. |
| **JSColumn** | Auswahl der Darstellungsmethode basierend auf `collectionField.interface` oder Zugriff auf `targetCollection` in Tabellenspalten. |

> Hinweis: `ctx.collectionField` ist nur verfügbar, wenn das Feld an die Definition einer **Sammlung** (Collection) gebunden ist. In Szenarien wie unabhängigen JSBlock-Blöcken oder Aktionsereignissen ohne Feldanbindung ist es normalerweise `undefined`. Es wird empfohlen, vor der Verwendung eine Prüfung auf Nullwerte durchzuführen.

## Typdefinition

```ts
collectionField: CollectionField | null | undefined;
```

## Gängige Eigenschaften

| Eigenschaft | Typ | Beschreibung |
|------|------|------|
| `name` | `string` | Feldname (z. B. `status`, `userId`) |
| `title` | `string` | Feldtitel (einschließlich Internationalisierung) |
| `type` | `string` | Datentyp des Feldes (`string`, `integer`, `belongsTo` usw.) |
| `interface` | `string` | Interface-Typ des Feldes (`input`, `select`, `m2o`, `o2m`, `m2m` usw.) |
| `collection` | `Collection` | Die **Sammlung**, zu der das Feld gehört |
| `targetCollection` | `Collection` | Die Ziel-**Sammlung** des Verknüpfungsfeldes (nur bei Verknüpfungstypen vorhanden) |
| `target` | `string` | Name der Ziel-**Sammlung** (für Verknüpfungsfelder) |
| `enum` | `array` | Aufzählungsoptionen (Select, Radio usw.) |
| `defaultValue` | `any` | Standardwert |
| `collectionName` | `string` | Name der zugehörigen **Sammlung** |
| `foreignKey` | `string` | Name des Fremdschlüsselfeldes (belongsTo usw.) |
| `sourceKey` | `string` | Verknüpfungs-Quellschlüssel (hasMany usw.) |
| `targetKey` | `string` | Verknüpfungs-Zielschlüssel |
| `fullpath` | `string` | Vollständiger Pfad (z. B. `main.users.status`), verwendet für API- oder Variablenreferenzen |
| `resourceName` | `string` | Ressourcenname (z. B. `users.status`) |
| `readonly` | `boolean` | Ob das Feld schreibgeschützt ist |
| `titleable` | `boolean` | Ob es als Titel angezeigt werden kann |
| `validation` | `object` | Konfiguration der Validierungsregeln |
| `uiSchema` | `object` | UI-Konfiguration |
| `targetCollectionTitleField` | `CollectionField` | Das Titelfeld der Ziel-**Sammlung** (für Verknüpfungsfelder) |

## Gängige Methoden

| Methode | Beschreibung |
|------|------|
| `isAssociationField(): boolean` | Ob es ein Verknüpfungsfeld ist (belongsTo, hasMany, hasOne, belongsToMany usw.) |
| `isRelationshipField(): boolean` | Ob es ein Beziehungsfeld ist (einschließlich o2o, m2o, o2m, m2m usw.) |
| `getComponentProps(): object` | Ruft die Standard-Props der Feldkomponente ab |
| `getFields(): CollectionField[]` | Ruft die Feldliste der Ziel-**Sammlung** ab (nur für Verknüpfungsfelder) |
| `getFilterOperators(): object[]` | Ruft die von diesem Feld unterstützten Filteroperatoren ab (z. B. `$eq`, `$ne` usw.) |

## Beispiele

### Verzweigtes Rendering basierend auf dem Feldtyp

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Verknüpfungsfeld: Verknüpfte Datensätze anzeigen
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Prüfen, ob es ein Verknüpfungsfeld ist, und auf die Ziel-Sammlung zugreifen

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Verarbeitung gemäß der Struktur der Ziel-Sammlung
}
```

### Aufzählungsoptionen abrufen

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Bedingtes Rendering basierend auf Schreibschutz-/Anzeigemodus

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Titelfeld der Ziel-Sammlung abrufen

```ts
// Bei der Anzeige eines Verknüpfungsfeldes kann targetCollectionTitleField verwendet werden, um den Namen des Titelfeldes abzurufen
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Beziehung zu ctx.collection

| Bedarf | Empfohlene Verwendung |
|------|----------|
| **Sammlung des aktuellen Feldes** | `ctx.collectionField?.collection` oder `ctx.collection` |
| **Feld-Metadaten (Name, Typ, Interface, Enum usw.)** | `ctx.collectionField` |
| **Ziel-Sammlung** | `ctx.collectionField?.targetCollection` |

`ctx.collection` repräsentiert normalerweise die an den aktuellen Block gebundene **Sammlung**; `ctx.collectionField` repräsentiert die Definition des aktuellen Feldes in der **Sammlung**. In Szenarien wie Untertabellen oder Verknüpfungsfeldern können sich beide unterscheiden.

## Hinweise

- In Szenarien wie **JSBlock** oder **JSAction (ohne Feldanbindung)** ist `ctx.collectionField` normalerweise `undefined`. Es wird empfohlen, vor dem Zugriff Optional Chaining zu verwenden.
- Wenn ein benutzerdefiniertes JS-Feld nicht an ein Sammlungsfeld gebunden ist, kann `ctx.collectionField` den Wert `null` haben.
- `targetCollection` existiert nur für Felder vom Typ Verknüpfung (z. B. m2o, o2m, m2m); `enum` existiert nur für Felder mit Optionen wie Select oder RadioGroup.

## Verwandte Themen

- [ctx.collection](./collection.md): Mit dem aktuellen Kontext verknüpfte Sammlung
- [ctx.model](./model.md): Modell, in dem sich der aktuelle Ausführungskontext befindet
- [ctx.blockModel](./block-model.md): Übergeordneter Block, der das aktuelle JS enthält
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Aktuellen Feldwert lesen und schreiben