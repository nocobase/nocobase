:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/get-model).
:::

# ctx.getModel()

Pobiera instancję modelu (taką jak `BlockModel`, `PageModel`, `ActionModel` itp.) z bieżącego silnika lub stosu widoków na podstawie `uid` modelu. Jest to używane w RunJS do uzyskiwania dostępu do innych modeli między blokami, stronami lub wyskakującymi okienkami.

Jeśli potrzebują Państwo tylko modelu lub bloku, w którym znajduje się bieżący kontekst wykonania, należy priorytetowo traktować użycie `ctx.model` lub `ctx.blockModel` zamiast `ctx.getModel`.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSAction** | Pobieranie modeli innych bloków na podstawie znanego `uid` w celu odczytu lub zapisu ich `resource`, `form`, `setProps` itp. |
| **RunJS w wyskakujących okienkach** | Gdy zachodzi potrzeba uzyskania dostępu do modelu na stronie, która otworzyła okienko, należy przekazać `searchInPreviousEngines: true`. |
| **Niestandardowe akcje** | Lokalizowanie formularzy lub podmodeli w panelu konfiguracji według `uid` w stosach widoków, aby odczytać ich konfigurację lub stan. |

## Definicja typu

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parametry

| Parametr | Typ | Opis |
|------|------|------|
| `uid` | `string` | Unikalny identyfikator docelowej instancji modelu, określony podczas konfiguracji lub tworzenia (np. `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Opcjonalne, domyślnie `false`. Gdy ma wartość `true`, przeszukuje od bieżącego silnika w górę do korzenia w „stosie widoków”, umożliwiając dostęp do modeli w silnikach wyższego poziomu (np. na stronie, która otworzyła okienko). |

## Wartość zwracana

- Zwraca instancję odpowiedniej podklasy `FlowModel` (np. `BlockModel`, `FormBlockModel`, `ActionModel`), jeśli zostanie znaleziona.
- Zwraca `undefined`, jeśli nie zostanie znaleziona.

## Zakres wyszukiwania

- **Domyślnie (`searchInPreviousEngines: false`)**: Przeszukuje tylko w obrębie **bieżącego silnika** według `uid`. W wyskakujących okienkach lub widokach wielopoziomowych każdy widok ma niezależny silnik; domyślnie wyszukiwane są tylko modele w bieżącym widoku.
- **`searchInPreviousEngines: true`**: Przeszukuje w górę wzdłuż łańcucha `previousEngine`, zaczynając od bieżącego silnika, zwracając pierwsze dopasowanie. Jest to przydatne do uzyskiwania dostępu do modelu na stronie, która otworzyła bieżące okienko.

## Przykłady

### Pobieranie innego bloku i odświeżanie

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Dostęp do modelu na stronie z poziomu wyskakującego okienka

```ts
// Dostęp do bloku na stronie, która otworzyła bieżące okienko
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Odczyt/zapis między modelami i wyzwalanie ponownego renderowania (rerender)

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Weryfikacja bezpieczeństwa

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Model docelowy nie istnieje');
  return;
}
```

## Powiązane

- [ctx.model](./model.md): Model, w którym znajduje się bieżący kontekst wykonania.
- [ctx.blockModel](./block-model.md): Model bloku nadrzędnego, w którym znajduje się bieżący kod JS; zazwyczaj dostępny bez konieczności użycia `getModel`.