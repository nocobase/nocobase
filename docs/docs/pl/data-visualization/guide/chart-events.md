:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Niestandardowe zdarzenia interakcji

Proszę napisać kod JavaScript w edytorze zdarzeń i zarejestrować interakcje za pomocą instancji ECharts `chart`, aby umożliwić powiązania, takie jak nawigacja do nowej strony lub otwarcie okna dialogowego do analizy szczegółowej.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Rejestracja i wyrejestrowanie zdarzeń
- Rejestracja: `chart.on(eventName, handler)`
- Wyrejestrowanie: `chart.off(eventName, handler)` lub `chart.off(eventName)` w celu usunięcia zdarzeń o tej samej nazwie.

**Uwaga:**
Ze względów bezpieczeństwa zdecydowanie zalecamy wyrejestrowanie zdarzenia przed jego ponowną rejestracją!

## Struktura danych parametru `params` funkcji `handler`

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Często używane pola to `params.data`, `params.name` i inne.

## Przykład: kliknięcie w celu podświetlenia wyboru
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Podświetlenie bieżącego punktu danych
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Wyłączenie podświetlenia dla pozostałych
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Przykład: kliknięcie w celu nawigacji do strony
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Opcja 1: nawigacja wewnętrzna bez pełnego odświeżania strony (zalecane), wystarczy ścieżka względna
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Opcja 2: nawigacja do strony zewnętrznej, wymagany pełny URL
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Opcja 3: otwarcie strony zewnętrznej w nowej karcie, wymagany pełny URL
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Przykład: kliknięcie w celu otwarcia okna dialogowego szczegółów (analiza szczegółowa)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // rejestracja zmiennych kontekstowych dla nowego okna dialogowego
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

W nowo otwartym oknie dialogowym proszę używać zmiennych kontekstowych wykresu za pośrednictwem `ctx.view.inputArgs.XXX`.

## Podgląd i zapis
- Proszę kliknąć „Podgląd”, aby załadować i wykonać kod zdarzenia.
- Proszę kliknąć „Zapisz”, aby zachować bieżącą konfigurację zdarzenia.
- Proszę kliknąć „Anuluj”, aby powrócić do ostatniego zapisanego stanu.

**Zalecenia:**
- Zawsze proszę używać `chart.off('event')` przed powiązaniem, aby uniknąć wielokrotnego wykonywania lub zwiększonego zużycia pamięci.
- W procedurach obsługi zdarzeń proszę stosować lekkie operacje (np. `dispatchAction`, `setOption`), aby uniknąć blokowania procesu renderowania.
- Proszę weryfikować pola obsługiwane w zdarzeniu z opcjami wykresu i zapytaniami o dane, aby upewnić się, że są one zgodne z bieżącymi danymi.