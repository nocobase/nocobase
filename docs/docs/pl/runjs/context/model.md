:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/model).
:::

# ctx.model

Instancja `FlowModel`, w której znajduje się bieżący kontekst wykonania RunJS. Służy jako domyślny punkt wejścia dla scenariuszy takich jak JSBlock, JSField i JSAction. Konkretny typ zmienia się w zależności od kontekstu: może to być podklasa taka jak `BlockModel`, `ActionModel` lub `JSEditableFieldModel`.

## Scenariusze zastosowania

| Scenariusz | Opis |
|------|------|
| **JSBlock** | `ctx.model` to bieżący model bloku. Można uzyskać dostęp do `resource`, `collection`, `setProps` itp. |
| **JSField / JSItem / JSColumn** | `ctx.model` to model pola. Można uzyskać dostęp do `setProps`, `dispatchEvent` itp. |
| **Zdarzenia akcji / ActionModel** | `ctx.model` to model akcji. Można odczytywać/zapisywać parametry kroków, wysyłać zdarzenia itp. |

> Wskazówka: Jeśli potrzebują Państwo uzyskać dostęp do **bloku nadrzędnego zawierającego bieżący JS** (np. blok formularza lub tabeli), należy użyć `ctx.blockModel`. Aby uzyskać dostęp do **innych modeli**, należy użyć `ctx.getModel(uid)`.

## Definicja typu

```ts
model: FlowModel;
```

`FlowModel` jest klasą bazową. W czasie wykonywania jest to instancja różnych podklas (takich jak `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` itp.). Dostępne właściwości i metody zależą od konkretnego typu.

## Często używane właściwości

| Właściwość | Typ | Opis |
|------|------|------|
| `uid` | `string` | Unikalny identyfikator modelu. Może być użyty w `ctx.getModel(uid)` lub do powiązania UID wyskakującego okienka (popup). |
| `collection` | `Collection` | Kolekcja powiązana z bieżącym modelem (istnieje, gdy blok/pole jest powiązane z danymi). |
| `resource` | `Resource` | Powiązana instancja zasobu, używana do odświeżania, pobierania wybranych wierszy itp. |
| `props` | `object` | Konfiguracja UI/zachowania modelu. Można ją zaktualizować za pomocą `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Zbiór modeli podrzędnych (np. pola w formularzu, kolumny w tabeli). |
| `parent` | `FlowModel` | Model nadrzędny (jeśli istnieje). |

## Często używane metody

| Metoda | Opis |
|------|------|
| `setProps(partialProps: any): void` | Aktualizuje konfigurację modelu i wyzwala ponowne renderowanie (np. `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Wysyła zdarzenie do modelu, wyzwalając przepływy pracy skonfigurowane dla tego modelu, które nasłuchują danej nazwy zdarzenia. Opcjonalny `payload` jest przekazywany do handlera przepływu pracy; `options.debounce` umożliwia włączenie funkcji debounce. |
| `getStepParams?.(flowKey, stepKey)` | Odczytuje parametry kroków przepływu konfiguracji (używane w panelach ustawień, akcjach niestandardowych itp.). |
| `setStepParams?.(flowKey, stepKey, params)` | Zapisuje parametry kroków przepływu konfiguracji. |

## Relacja z ctx.blockModel i ctx.getModel

| Potrzeba | Zalecane użycie |
|------|----------|
| **Model bieżącego kontekstu wykonania** | `ctx.model` |
| **Blok nadrzędny bieżącego JS** | `ctx.blockModel`. Często używany do uzyskania dostępu do `resource`, `form` lub `collection`. |
| **Pobieranie dowolnego modelu przez UID** | `ctx.getModel(uid)` lub `ctx.getModel(uid, true)` (przeszukiwanie stosów widoków). |

W JSField `ctx.model` jest modelem pola, podczas gdy `ctx.blockModel` jest blokiem formularza lub tabeli zawierającym to pole.

## Przykłady

### Aktualizacja statusu bloku/akcji

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Wysyłanie zdarzeń modelu

```ts
// Wysyła zdarzenie, aby wyzwolić przepływ pracy skonfigurowany dla tego modelu, który nasłuchuje tej nazwy zdarzenia
await ctx.model.dispatchEvent('remove');

// Gdy podano payload, zostanie on przekazany do ctx.inputArgs handlera przepływu pracy
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Użycie UID do powiązania wyskakującego okienka lub dostępu między modelami

```ts
const myUid = ctx.model.uid;
// W konfiguracji popup można przekazać openerUid: myUid w celu powiązania
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Powiązane

- [ctx.blockModel](./block-model.md): Model bloku nadrzędnego, w którym znajduje się bieżący JS.
- [ctx.getModel()](./get-model.md): Pobieranie innych modeli według UID.