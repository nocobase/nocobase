:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/collection).
:::

# ctx.collection

Instancja kolekcji (Collection) powiązana z bieżącym kontekstem wykonania RunJS, używana do uzyskiwania dostępu do metadanych kolekcji, definicji pól, kluczy głównych oraz innych konfiguracji. Zazwyczaj pochodzi z `ctx.blockModel.collection` lub `ctx.collectionField?.collection`.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock** | Kolekcja powiązana z blokiem; umożliwia dostęp do `name`, `getFields`, `filterTargetKey` itp. |
| **JSField / JSItem / JSColumn** | Kolekcja, do której należy bieżące pole (lub kolekcja bloku nadrzędnego), używana do pobierania list pól, kluczy głównych itp. |
| **Kolumna tabeli / Blok szczegółów** | Używane do renderowania na podstawie struktury kolekcji lub przekazywania `filterByTk` podczas otwierania okien wyskakujących. |

> Uwaga: `ctx.collection` jest dostępny w scenariuszach, w których blok danych, blok formularza lub blok tabeli jest powiązana z kolekcją. W niezależnym JSBlock, który nie jest powiązany z kolekcją, może on mieć wartość `null`. Zaleca się sprawdzenie, czy wartość nie jest pusta, przed jej użyciem.

## Definicja typu

```ts
collection: Collection | null | undefined;
```

## Typowe właściwości

| Właściwość | Typ | Opis |
|------|------|------|
| `name` | `string` | Nazwa kolekcji (np. `users`, `orders`) |
| `title` | `string` | Tytuł kolekcji (uwzględnia umiędzynarodowienie) |
| `filterTargetKey` | `string \| string[]` | Nazwa pola klucza głównego, używana dla `filterByTk` i `getFilterByTK` |
| `dataSourceKey` | `string` | Klucz źródła danych (np. `main`) |
| `dataSource` | `DataSource` | Instancja źródła danych, do którego należy kolekcja |
| `template` | `string` | Szablon kolekcji (np. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Lista pól, które mogą być wyświetlane jako tytuły |
| `titleCollectionField` | `CollectionField` | Instancja pola tytułowego |

## Typowe metody

| Metoda | Opis |
|------|------|
| `getFields(): CollectionField[]` | Pobiera wszystkie pola (w tym dziedziczone) |
| `getField(name: string): CollectionField \| undefined` | Pobiera pojedyncze pole według nazwy |
| `getFieldByPath(path: string): CollectionField \| undefined` | Pobiera pole według ścieżki (obsługuje powiązania, np. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Pobiera pola powiązań; `types` może przyjmować wartości `['one']`, `['many']` itp. |
| `getFilterByTK(record): any` | Wyodrębnia wartość klucza głównego z rekordu, używane dla `filterByTk` w API |

## Relacja z ctx.collectionField i ctx.blockModel

| Potrzeba | Zalecane użycie |
|------|----------|
| **Kolekcja powiązana z bieżącym kontekstem** | `ctx.collection` (równoważne `ctx.blockModel?.collection` lub `ctx.collectionField?.collection`) |
| **Definicja kolekcji bieżącego pola** | `ctx.collectionField?.collection` (kolekcja, do której należy pole) |
| **Docelowa kolekcja powiązania** | `ctx.collectionField?.targetCollection` (docelowa kolekcja pola powiązania) |

W scenariuszach takich jak podtabele, `ctx.collection` może być docelową kolekcją powiązania; w standardowych formularzach lub tabelach jest to zazwyczaj kolekcja powiązana z blokiem.

## Przykłady

### Pobieranie klucza głównego i otwieranie okna wyskakującego

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

### Iteracja przez pola w celu walidacji lub powiązania

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} jest wymagane`);
    return;
  }
}
```

### Pobieranie pól powiązań

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Używane do budowania podtabel, zasobów powiązanych itp.
```

## Uwagi

- `filterTargetKey` to nazwa pola klucza głównego kolekcji. Niektóre kolekcje mogą używać złożonych kluczy głównych typu `string[]`. Jeśli nie skonfigurowano inaczej, jako wartość domyślną zazwyczaj przyjmuje się `'id'`.
- W scenariuszach takich jak **podtabele lub pola powiązań**, `ctx.collection` może wskazywać na docelową kolekcję powiązania, co różni się od `ctx.blockModel.collection`.
- `getFields()` scala pola z kolekcji dziedziczonych; pola lokalne nadpisują pola dziedziczone o tej samej nazwie.

## Powiązane

- [ctx.collectionField](./collection-field.md): Definicja pola kolekcji dla bieżącego pola
- [ctx.blockModel](./block-model.md): Blok nadrzędny zawierający bieżący kod JS, w tym `collection`
- [ctx.model](./model.md): Bieżący model, który może zawierać `collection`