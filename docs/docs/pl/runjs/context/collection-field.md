:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/collection-field).
:::

# ctx.collectionField

Instancja pola kolekcji (`CollectionField`) powiązana z bieżącym kontekstem wykonania RunJS, używana do uzyskiwania dostępu do metadanych pola, typów, reguł walidacji i informacji o powiązaniach. Istnieje tylko wtedy, gdy pole jest powiązane z definicją kolekcji; pola niestandardowe/wirtualne mogą mieć wartość `null`.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSField** | Wykonywanie powiązań (linkage) lub walidacji w polach formularza na podstawie `interface`, `enum`, `targetCollection` itp. |
| **JSItem** | Dostęp do metadanych pola odpowiadającego bieżącej kolumnie w elementach podtabeli. |
| **JSColumn** | Wybór metod renderowania na podstawie `collectionField.interface` lub dostęp do `targetCollection` w kolumnach tabeli. |

> Uwaga: `ctx.collectionField` jest dostępne tylko wtedy, gdy pole jest powiązane z definicją kolekcji (Collection); w scenariuszach takich jak niezależne bloki JSBlock lub zdarzenia akcji bez powiązania z polem, zazwyczaj ma wartość `undefined`. Przed użyciem zaleca się sprawdzenie, czy wartość nie jest pusta.

## Definicja typu

```ts
collectionField: CollectionField | null | undefined;
```

## Często używane właściwości

| Właściwość | Typ | Opis |
|------|------|------|
| `name` | `string` | Nazwa pola (np. `status`, `userId`) |
| `title` | `string` | Tytuł pola (z uwzględnieniem umiędzynarodowienia) |
| `type` | `string` | Typ danych pola (`string`, `integer`, `belongsTo` itp.) |
| `interface` | `string` | Typ interfejsu pola (`input`, `select`, `m2o`, `o2m`, `m2m` itp.) |
| `collection` | `Collection` | Kolekcja, do której należy pole |
| `targetCollection` | `Collection` | Docelowa kolekcja pola powiązania (tylko dla typów powiązań) |
| `target` | `string` | Nazwa docelowej kolekcji (dla pól powiązań) |
| `enum` | `array` | Opcje wyliczeniowe (select, radio itp.) |
| `defaultValue` | `any` | Wartość domyślna |
| `collectionName` | `string` | Nazwa kolekcji, do której należy pole |
| `foreignKey` | `string` | Nazwa pola klucza obcego (belongsTo itp.) |
| `sourceKey` | `string` | Klucz źródłowy powiązania (hasMany itp.) |
| `targetKey` | `string` | Klucz docelowy powiązania |
| `fullpath` | `string` | Pełna ścieżka (np. `main.users.status`), używana w API lub odniesieniach do zmiennych |
| `resourceName` | `string` | Nazwa zasobu (np. `users.status`) |
| `readonly` | `boolean` | Czy pole jest tylko do odczytu |
| `titleable` | `boolean` | Czy może być wyświetlane jako tytuł |
| `validation` | `object` | Konfiguracja reguł walidacji |
| `uiSchema` | `object` | Konfiguracja UI |
| `targetCollectionTitleField` | `CollectionField` | Pole tytułowe docelowej kolekcji (dla pól powiązań) |

## Często używane metody

| Metoda | Opis |
|------|------|
| `isAssociationField(): boolean` | Czy jest to pole powiązania (belongsTo, hasMany, hasOne, belongsToMany itp.) |
| `isRelationshipField(): boolean` | Czy jest to pole relacyjne (w tym o2o, m2o, o2m, m2m itp.) |
| `getComponentProps(): object` | Pobiera domyślne właściwości (props) komponentu pola |
| `getFields(): CollectionField[]` | Pobiera listę pól docelowej kolekcji (tylko pola powiązań) |
| `getFilterOperators(): object[]` | Pobiera operatory filtrowania obsługiwane przez to pole (np. `$eq`, `$ne` itp.) |

## Przykłady

### Renderowanie warunkowe na podstawie typu pola

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Pole powiązania: wyświetlanie powiązanych rekordów
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Sprawdzanie, czy pole jest powiązaniem i dostęp do kolekcji docelowej

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Przetwarzanie zgodnie ze strukturą kolekcji docelowej
}
```

### Pobieranie opcji wyliczeniowych

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Renderowanie warunkowe na podstawie trybu tylko do odczytu/wyświetlania

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Pobieranie pola tytułowego docelowej kolekcji

```ts
// Podczas wyświetlania pola powiązania, użyj targetCollectionTitleField, aby uzyskać nazwę pola tytułowego
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relacja z ctx.collection

| Potrzeba | Zalecane użycie |
|------|----------|
| **Kolekcja bieżącego pola** | `ctx.collectionField?.collection` lub `ctx.collection` |
| **Metadane pola (nazwa, typ, interfejs, enum itp.)** | `ctx.collectionField` |
| **Docelowa kolekcja powiązania** | `ctx.collectionField?.targetCollection` |

`ctx.collection` zazwyczaj reprezentuje kolekcję powiązaną z bieżącym blokiem; `ctx.collectionField` reprezentuje definicję bieżącego pola w kolekcji. W scenariuszach takich jak podtabele lub pola powiązań, te dwie wartości mogą się różnić.

## Uwagi

- W scenariuszach takich jak **JSBlock** lub **JSAction (bez powiązania z polem)**, `ctx.collectionField` zazwyczaj ma wartość `undefined`. Przed uzyskaniem dostępu zaleca się użycie opcjonalnego łańcuchowania (optional chaining).
- Jeśli niestandardowe pole JS nie jest powiązane z polem kolekcji, `ctx.collectionField` może mieć wartość `null`.
- `targetCollection` istnieje tylko dla pól typu powiązania (np. m2o, o2m, m2m); `enum` istnieje tylko dla pól z opcjami, takich jak select lub radioGroup.

## Powiązane

- [ctx.collection](./collection.md): Kolekcja powiązana z bieżącym kontekstem
- [ctx.model](./model.md): Model, w którym znajduje się bieżący kontekst wykonania
- [ctx.blockModel](./block-model.md): Blok nadrzędny zawierający bieżący kod JS
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Odczyt i zapis wartości bieżącego pola