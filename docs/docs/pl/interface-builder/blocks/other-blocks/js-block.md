:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# JS Block

## Wprowadzenie

JS Block to wysoce elastyczny „niestandardowy blok renderujący”, który umożliwia bezpośrednie pisanie skryptów JavaScript do generowania interfejsów, wiązania zdarzeń, wywoływania API danych lub integrowania bibliotek zewnętrznych. Jest idealny do spersonalizowanych wizualizacji, tymczasowych eksperymentów i lekkich rozszerzeń, których trudno osiągnąć za pomocą wbudowanych bloków.

## API kontekstu wykonawczego

Kontekst wykonawczy bloku JS Block zawiera wstrzyknięte często używane funkcje, z których można korzystać bezpośrednio:

- `ctx.element`: Kontener DOM bloku (bezpiecznie opakowany jako ElementProxy), obsługujący `innerHTML`, `querySelector`, `addEventListener` itp.
- `ctx.requireAsync(url)`: Asynchronicznie ładuje bibliotekę AMD/UMD za pomocą adresu URL.
- `ctx.importAsync(url)`: Dynamicznie importuje moduł ESM za pomocą adresu URL.
- `ctx.openView`: Otwiera skonfigurowany widok (okno wyskakujące/panel boczny/strona).
- `ctx.useResource(...)` + `ctx.resource`: Umożliwia dostęp do danych jako zasobu.
- `ctx.i18n.t()` / `ctx.t()`: Wbudowana funkcja internacjonalizacji.
- `ctx.onRefReady(ctx.ref, cb)`: Renderuje po przygotowaniu kontenera, aby uniknąć problemów z synchronizacją.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Wbudowane biblioteki ogólnego przeznaczenia, takie jak React, ReactDOM, Ant Design, ikony Ant Design i dayjs, do renderowania JSX i obsługi daty/czasu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` są zachowane dla kompatybilności.)
- `ctx.render(vnode)`: Renderuje element React, ciąg HTML lub węzeł DOM do domyślnego kontenera `ctx.element`. Wielokrotne wywołania ponownie wykorzystają ten sam React Root i nadpiszą istniejącą zawartość kontenera.

## Dodawanie bloku

Blok JS Block można dodać do strony lub okna wyskakującego.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Edytor i fragmenty kodu

Edytor skryptów JS Block obsługuje podświetlanie składni, podpowiedzi błędów oraz wbudowane fragmenty kodu (Snippets), co pozwala na szybkie wstawianie typowych przykładów, takich jak: renderowanie wykresów, wiązanie zdarzeń przycisków, ładowanie bibliotek zewnętrznych, renderowanie komponentów React/Vue, osie czasu, karty informacyjne itp.

- `Snippets`: Otwiera listę wbudowanych fragmentów kodu. Można wyszukiwać i jednym kliknięciem wstawić wybrany fragment w bieżącej pozycji kursora w edytorze kodu.
- `Run`: Bezpośrednio uruchamia kod w bieżącym edytorze i wyświetla logi wykonania w panelu `Logs` na dole. Obsługuje wyświetlanie `console.log/info/warn/error`, a błędy są podświetlane i można je zlokalizować w konkretnym wierszu i kolumnie.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Ponadto, w prawym górnym rogu edytora można bezpośrednio wywołać pracownika AI „Inżyniera Frontendowego · Nathana”, który pomoże Panu/Pani napisać lub zmodyfikować skrypty w oparciu o bieżący kontekst. Następnie, jednym kliknięciem „Apply to editor” można zastosować zmiany w edytorze i uruchomić kod, aby zobaczyć efekt. Szczegóły znajdą Państwo w:

- [Pracownik AI · Nathan: Inżynier Frontendowy](/ai-employees/built-in/ai-coding)

## Środowisko wykonawcze i bezpieczeństwo

- **Kontener**: System zapewnia bezpieczny kontener DOM `ctx.element` (ElementProxy) dla skryptu, który wpływa tylko na bieżący blok i nie zakłóca innych obszarów strony.
- **Piaskownica**: Skrypt działa w kontrolowanym środowisku. `window`/`document`/`navigator` używają bezpiecznych obiektów proxy, umożliwiając korzystanie z typowych API przy jednoczesnym ograniczaniu ryzykownych zachowań.
- **Ponowne renderowanie**: Blok automatycznie renderuje się ponownie, gdy zostanie ukryty, a następnie ponownie wyświetlony (aby uniknąć ponownego wykonania skryptu podczas początkowego montowania).

## Typowe zastosowania (uproszczone przykłady)

### 1) Renderowanie React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Szablon żądania API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Ładowanie i renderowanie ECharts

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Otwieranie widoku (panel boczny)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Odczyt zasobu i renderowanie JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Uwagi

- Zaleca się używanie zaufanych sieci CDN do ładowania bibliotek zewnętrznych.
- **Wskazówki dotyczące użycia selektorów**: Preferuj używanie selektorów `class` lub atrybutów `[name=...]`. Unikaj używania stałych `id`, aby zapobiec konfliktom stylów lub zdarzeń wynikającym z powtarzających się `id` w wielu blokach lub oknach wyskakujących.
- **Czyszczenie zdarzeń**: Blok może być wielokrotnie renderowany, dlatego przed wiązaniem zdarzeń należy je wyczyścić lub usunąć duplikaty, aby uniknąć wielokrotnego wyzwalania. Można zastosować podejście „usuń, a następnie dodaj”, jednorazowy nasłuchiwacz lub flagę zapobiegającą duplikatom.

## Powiązane dokumenty

- [Zmienne i kontekst](/interface-builder/variables)
- [Zasady powiązań](/interface-builder/linkage-rule)
- [Widoki i okna wyskakujące](/interface-builder/actions/types/view)