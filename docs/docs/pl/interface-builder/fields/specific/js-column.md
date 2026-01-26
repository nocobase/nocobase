:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Kolumna JS

## Wprowadzenie

Kolumna JS służy do tworzenia „niestandardowych kolumn” w tabelach, renderując zawartość każdej komórki w wierszu za pomocą JavaScript. Nie jest ona powiązana z konkretnym polem, dzięki czemu idealnie nadaje się do kolumn pochodnych, łączonych wyświetleń z wielu pól, wskaźników statusu, przycisków akcji czy agregacji danych zdalnych.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API kontekstu środowiska uruchomieniowego

Podczas renderowania każdej komórki, Kolumna JS udostępnia następujące możliwości kontekstowe:

- `ctx.element`: Kontener DOM bieżącej komórki (ElementProxy), obsługujący `innerHTML`, `querySelector`, `addEventListener` itp.;
- `ctx.record`: Obiekt rekordu bieżącego wiersza (tylko do odczytu);
- `ctx.recordIndex`: Indeks wiersza na bieżącej stronie (zaczyna się od 0, może być zależny od stronicowania);
- `ctx.collection`: Metadane kolekcji powiązanej z tabelą (tylko do odczytu);
- `ctx.requireAsync(url)`: Asynchronicznie ładuje bibliotekę AMD/UMD pod wskazanym adresem URL;
- `ctx.importAsync(url)`: Dynamicznie importuje moduł ESM pod wskazanym adresem URL;
- `ctx.openView(options)`: Otwiera skonfigurowany widok (modal/szuflada/strona);
- `ctx.i18n.t()` / `ctx.t()`: Internacjonalizacja;
- `ctx.onRefReady(ctx.ref, cb)`: Renderuje po przygotowaniu kontenera;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Wbudowane biblioteki ogólnego przeznaczenia, takie jak React, ReactDOM, Ant Design, ikony Ant Design i dayjs, służące do renderowania JSX i obsługi czasu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` są zachowane dla kompatybilności.)
- `ctx.render(vnode)`: Renderuje element React/HTML/DOM do domyślnego kontenera `ctx.element` (bieżącej komórki). Wielokrotne renderowanie spowoduje ponowne użycie Root i nadpisanie istniejącej zawartości kontenera.

## Edytor i fragmenty kodu

Edytor skryptów Kolumny JS obsługuje podświetlanie składni, podpowiedzi błędów oraz wbudowane fragmenty kodu (Snippets).

- `Snippets`: Otwiera listę wbudowanych fragmentów kodu, umożliwiając wyszukiwanie i wstawianie ich w bieżącej pozycji kursora jednym kliknięciem.
- `Run`: Bezpośrednio uruchamia bieżący kod. Dziennik wykonania jest wyświetlany w panelu `Logs` na dole, z obsługą `console.log/info/warn/error` oraz podświetlaniem błędów.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Mogą Państwo również skorzystać z pracownika AI do generowania kodu:

- [Pracownik AI · Nathan: Inżynier Frontend](/ai-employees/built-in/ai-coding)

## Typowe zastosowania

### 1) Podstawowe renderowanie (odczyt rekordu bieżącego wiersza)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Używanie JSX do renderowania komponentów React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Otwieranie modalu/szuflady z komórki (podgląd/edycja)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Zobacz</a>
);
```

### 4) Ładowanie bibliotek zewnętrznych (AMD/UMD lub ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Uwagi

- Zaleca się używanie zaufanych sieci CDN do ładowania bibliotek zewnętrznych oraz zapewnienie mechanizmów awaryjnych na wypadek niepowodzenia (np. `if (!lib) return;`).
- Zaleca się preferowanie selektorów `class` lub `[name=...]` zamiast stałych `id`, aby zapobiec duplikowaniu `id` w wielu blokach lub modalach.
- Czyszczenie zdarzeń: Wiersze tabeli mogą dynamicznie zmieniać się wraz ze stronicowaniem/odświeżaniem, co powoduje wielokrotne renderowanie komórek. Przed przypisaniem zdarzeń należy je wyczyścić lub usunąć duplikaty, aby uniknąć wielokrotnego wyzwalania.
- Wskazówka dotycząca wydajności: Należy unikać wielokrotnego ładowania dużych bibliotek w każdej komórce. Zamiast tego, biblioteki powinny być buforowane na wyższym poziomie (np. za pomocą zmiennych globalnych lub zmiennych na poziomie tabeli) i ponownie wykorzystywane.