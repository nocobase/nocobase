:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/require-async).
:::

# ctx.requireAsync()

Asynchronicznie ładuje skrypty **UMD/AMD** lub skrypty montowane globalnie za pomocą adresu URL, a także pliki **CSS**. Jest odpowiedni dla scenariuszy RunJS wymagających bibliotek UMD/AMD, takich jak ECharts, Chart.js, FullCalendar (wersja UMD) lub wtyczek jQuery. Jeśli biblioteka udostępnia również wersję ESM, należy priorytetowo traktować [ctx.importAsync()](./import-async.md).

## Scenariusze użycia

Można go używać w dowolnym scenariuszu RunJS, w którym skrypty UMD/AMD/globalne lub pliki CSS muszą być ładowane na żądanie, np. JSBlock, JSField, JSItem, JSColumn, przepływ pracy, JSAction itp. Typowe zastosowania: ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), wtyczki jQuery itp.

## Definicja typu

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parametry

| Parametr | Typ | Opis |
|----------|-----|------|
| `url` | `string` | Adres skryptu lub pliku CSS. Obsługuje **skrócony zapis** `<nazwa-pakietu>@<wersja>/<ścieżka-pliku>` (dodaje `?raw` dla oryginalnego pliku UMD podczas rozwiązywania przez ESM CDN) lub **pełny adres URL**. Ładuje i wstrzykuje style, jeśli przekazano plik `.css`. |

## Wartość zwracana

- Załadowany obiekt biblioteki (pierwsza wartość modułu z wywołania zwrotnego UMD/AMD). Wiele bibliotek UMD dołącza się do obiektu `window` (np. `window.echarts`), więc zwracana wartość może wynosić `undefined`. W takich przypadkach należy uzyskać dostęp do zmiennej globalnej zgodnie z dokumentacją biblioteki.
- Zwraca wynik `loadCSS`, gdy przekazano plik `.css`.

## Opis formatu URL

- **Ścieżka skrócona**: np. `echarts@5/dist/echarts.min.js`. W domyślnym ESM CDN (esm.sh) wyśle zapytanie do `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Parametr `?raw` służy do pobrania oryginalnego pliku UMD zamiast opakowania ESM.
- **Pełny adres URL**: Można bezpośrednio użyć dowolnego adresu CDN, np. `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: Adres URL kończący się rozszerzeniem `.css` zostanie załadowany i wstrzyknięty do strony.

## Różnica względem ctx.importAsync()

- **ctx.requireAsync()**: Ładuje skrypty **UMD/AMD/globalne**. Odpowiedni dla ECharts, Chart.js, FullCalendar (UMD), wtyczek jQuery itp. Biblioteki po załadowaniu często dołączają się do `window`; zwracana wartość może być obiektem biblioteki lub `undefined`.
- **ctx.importAsync()**: Ładuje **moduły ESM** i zwraca przestrzeń nazw modułu. Jeśli biblioteka udostępnia ESM, należy użyć `ctx.importAsync()` dla lepszej semantyki modułów i mechanizmu Tree-shaking.

## Przykłady

### Podstawowe użycie

```javascript
// Ścieżka skrócona (rozwiązywana przez ESM CDN jako ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Pełny adres URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Załadowanie CSS i wstrzyknięcie do strony
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Wykres ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('Biblioteka ECharts nie została załadowana');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Przegląd sprzedaży') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Wykres słupkowy Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js nie został załadowany');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Ilość'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Uwagi

- **Format zwracanej wartości**: Metody eksportu UMD różnią się; zwracana wartość może być obiektem biblioteki lub `undefined`. Jeśli wynosi `undefined`, należy uzyskać do niej dostęp przez `window` zgodnie z dokumentacją biblioteki.
- **Zależność od sieci**: Wymaga dostępu do CDN. W środowiskach sieci wewnętrznej można wskazać własną usługę za pomocą **ESM_CDN_BASE_URL**.
- **Wybór między importAsync**: Jeśli biblioteka udostępnia zarówno ESM, jak i UMD, należy priorytetowo traktować `ctx.importAsync()`.

## Powiązane

- [ctx.importAsync()](./import-async.md) – Ładuje moduły ESM, odpowiednie dla Vue, dayjs (ESM) itp.
- [ctx.render()](./render.md) – Renderuje wykresy i inne komponenty w kontenerze.
- [ctx.libs](./libs.md) – Wbudowane React, antd, dayjs itp., nie wymagają asynchronicznego ładowania.