:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/block-model).
:::

# ctx.blockModel

Model bloku nadrzędnego (instancja BlockModel), w którym znajduje się bieżące pole JS / blok JS. W scenariuszach takich jak JSField, JSItem i JSColumn, `ctx.blockModel` wskazuje na blok formularza lub blok tabeli zawierający bieżącą logikę JS. W samodzielnym bloku JSBlock może on mieć wartość `null` lub być identyczny z `ctx.model`.

## Scenariusze zastosowania

| Scenariusz | Opis |
|------|------|
| **JSField** | Dostęp do `form`, `kolekcji` i `zasobu` (resource) nadrzędnego bloku formularza wewnątrz pola formularza w celu implementacji powiązań lub walidacji. |
| **JSItem** | Dostęp do informacji o zasobach i kolekcjach nadrzędnego bloku tabeli/formularza wewnątrz elementu podtabeli. |
| **JSColumn** | Dostęp do `resource` (np. `getSelectedRows`) i `kolekcji` nadrzędnego bloku tabeli wewnątrz kolumny tabeli. |
| **Operacje na formularzach / Przepływ pracy** | Dostęp do `form` w celu walidacji przed wysłaniem, `resource` do odświeżania itp. |

> Uwaga: `ctx.blockModel` jest dostępny tylko w kontekstach RunJS, w których istnieje blok nadrzędny. W samodzielnych blokach JSBlock (bez nadrzędnego formularza/tabeli) może on mieć wartość `null`. Zaleca się sprawdzenie wartości pod kątem `null` przed użyciem.

## Definicja typu

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Konkretny typ zależy od typu bloku nadrzędnego: bloki formularzy to najczęściej `FormBlockModel` lub `EditFormModel`, podczas gdy bloki tabel to zazwyczaj `TableBlockModel`.

## Typowe właściwości

| Właściwość | Typ | Opis |
|------|------|------|
| `uid` | `string` | Unikalny identyfikator modelu bloku. |
| `collection` | `Collection` | Kolekcja powiązana z bieżącym blokiem. |
| `resource` | `Resource` | Instancja zasobu używana przez blok (`SingleRecordResource` / `MultiRecordResource` itp.). |
| `form` | `FormInstance` | Blok formularza: Instancja formularza Ant Design, obsługująca `getFieldsValue`, `validateFields`, `setFieldsValue` itp. |
| `emitter` | `EventEmitter` | Emiter zdarzeń, używany do nasłuchiwania `formValuesChange`, `onFieldReset` itp. |

## Relacja z ctx.model i ctx.form

| Potrzeba | Zalecane użycie |
|------|----------|
| **Nadrzędny blok bieżącego JS** | `ctx.blockModel` |
| **Odczyt/zapis pól formularza** | `ctx.form` (odpowiednik `ctx.blockModel?.form`, wygodniejszy w blokach formularzy) |
| **Model bieżącego kontekstu wykonania** | `ctx.model` (model pola w JSField, model bloku w JSBlock) |

W JSField `ctx.model` jest modelem pola, a `ctx.blockModel` jest blokiem formularza lub tabeli zawierającym to pole; `ctx.form` to zazwyczaj `ctx.blockModel.form`.

## Przykłady

### Tabela: Pobieranie wybranych wierszy i przetwarzanie

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Proszę najpierw wybrać dane');
  return;
}
```

### Scenariusz formularza: Walidacja i odświeżanie

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Nasłuchiwanie zmian w formularzu

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implementacja powiązań lub ponownego renderowania na podstawie najnowszych wartości formularza
});
```

### Wyzwalanie ponownego renderowania bloku

```ts
ctx.blockModel?.rerender?.();
```

## Uwagi

- W **samodzielnym bloku JSBlock** (bez nadrzędnego bloku formularza lub tabeli), `ctx.blockModel` może mieć wartość `null`. Zaleca się używanie opcjonalnego łańcuchowania (optional chaining) podczas dostępu do jego właściwości: `ctx.blockModel?.resource?.refresh?.()`.
- W **JSField / JSItem / JSColumn**, `ctx.blockModel` odnosi się do bloku formularza lub tabeli zawierającej bieżące pole. W **JSBlock** może to być on sam lub blok wyższego poziomu, w zależności od rzeczywistej hierarchii.
- `resource` istnieje tylko w blokach danych; `form` istnieje tylko w blokach formularzy. Bloki tabel zazwyczaj nie posiadają `form`.

## Powiązane

- [ctx.model](./model.md): Model bieżącego kontekstu wykonania.
- [ctx.form](./form.md): Instancja formularza, powszechnie używana w blokach formularzy.
- [ctx.resource](./resource.md): Instancja zasobu (odpowiednik `ctx.blockModel?.resource`, należy używać bezpośrednio, jeśli jest dostępna).
- [ctx.getModel()](./get-model.md): Pobieranie innych modeli bloków za pomocą UID.