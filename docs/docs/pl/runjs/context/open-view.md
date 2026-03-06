:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/open-view).
:::

# ctx.openView()

Programowe otwieranie określonego widoku (szuflada, okno dialogowe, strona osadzona itp.). Funkcja dostarczana przez `FlowModelContext`, używana do otwierania skonfigurowanych widoków `ChildPage` lub `PopupAction` w scenariuszach takich jak `JSBlock`, komórki tabeli czy przepływy pracy.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock** | Otwarcie okna dialogowego szczegółów/edycji po kliknięciu przycisku, z przekazaniem `filterByTk` bieżącego wiersza. |
| **Komórka tabeli** | Renderowanie przycisku wewnątrz komórki, który po kliknięciu otwiera okno szczegółów wiersza. |
| **Przepływ pracy / JSAction** | Otwarcie kolejnego widoku lub okna dialogowego po pomyślnym zakończeniu operacji. |
| **Pole powiązania** | Otwieranie okna wyboru/edycji za pomocą `ctx.runAction('openView', params)`. |

> Uwaga: `ctx.openView` jest dostępny w środowisku RunJS, w którym istnieje kontekst `FlowModel`. Jeśli model odpowiadający danemu `uid` nie istnieje, `PopupActionModel` zostanie automatycznie utworzony i zapisany.

## Sygnatura

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Opis parametrów

### uid

Unikalny identyfikator modelu widoku. Jeśli nie istnieje, zostanie automatycznie utworzony i zapisany. Zaleca się używanie stabilnego UID, takiego jak `${ctx.model.uid}-detail`, aby konfiguracja mogła być ponownie wykorzystana przy wielokrotnym otwieraniu tego samego okna.

### Często używane pola options

| Pole | Typ | Opis |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Sposób otwarcia: szuflada (drawer), okno dialogowe (dialog) lub osadzenie (embed). Domyślnie `drawer`. |
| `size` | `small` / `medium` / `large` | Rozmiar okna lub szuflady. Domyślnie `medium`. |
| `title` | `string` | Tytuł widoku. |
| `params` | `Record<string, any>` | Dowolne parametry przekazywane do widoku. |
| `filterByTk` | `any` | Wartość klucza głównego, używana w scenariuszach szczegółów lub edycji pojedynczego rekordu. |
| `sourceId` | `string` | ID rekordu źródłowego, używane w scenariuszach powiązań. |
| `dataSourceKey` | `string` | Źródło danych. |
| `collectionName` | `string` | Nazwa kolekcji. |
| `associationName` | `string` | Nazwa pola powiązania. |
| `navigation` | `boolean` | Czy używać nawigacji tras (routera). W przypadku przekazania `defineProperties` lub `defineMethods`, wartość ta jest wymuszana na `false`. |
| `preventClose` | `boolean` | Czy zapobiegać zamknięciu. |
| `defineProperties` | `Record<string, PropertyOptions>` | Dynamiczne wstrzykiwanie właściwości do modelu wewnątrz widoku. |
| `defineMethods` | `Record<string, Function>` | Dynamiczne wstrzykiwanie metod do modelu wewnątrz widoku. |

## Przykłady

### Podstawowe użycie: Otwarcie szuflady

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Szczegóły'),
});
```

### Przekazywanie kontekstu bieżącego wiersza

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Szczegóły wiersza'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Otwieranie przez runAction

Gdy model ma skonfigurowaną akcję `openView` (np. pola powiązań lub pola klikalne), można wywołać:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Wstrzykiwanie niestandardowego kontekstu

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Relacja z ctx.viewer i ctx.view

| Zastosowanie | Zalecane użycie |
|------|----------|
| **Otwarcie skonfigurowanego widoku przepływu** | `ctx.openView(uid, options)` |
| **Otwarcie własnej treści (bez przepływu)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Operowanie na aktualnie otwartym widoku** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` otwiera `FlowPage` (`ChildPageModel`), który wewnętrznie renderuje pełną stronę przepływu; `ctx.viewer` otwiera dowolną treść React.

## Uwagi

- Zaleca się powiązanie `uid` z `ctx.model.uid` (np. `${ctx.model.uid}-xxx`), aby uniknąć konfliktów między wieloma blokami.
- Gdy przekazywane są `defineProperties` lub `defineMethods`, `navigation` jest wymuszane na `false`, aby zapobiec utracie kontekstu po odświeżeniu.
- Wewnątrz okna dialogowego `ctx.view` odnosi się do bieżącej instancji widoku, a `ctx.view.inputArgs` pozwala na odczyt parametrów przekazanych podczas otwierania.

## Powiązane

- [ctx.view](./view.md): Instancja aktualnie otwartego widoku.
- [ctx.model](./model.md): Bieżący model, używany do tworzenia stabilnego `popupUid`.