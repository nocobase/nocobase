:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pole JS

## Wprowadzenie

Pole JS służy do niestandardowego renderowania treści w miejscu pola za pomocą JavaScript. Jest powszechnie używane w blokach szczegółów, elementach tylko do odczytu w formularzach lub jako „Inne niestandardowe elementy” w kolumnach tabel. Nadaje się do spersonalizowanych wyświetlaczy, łączenia informacji pochodnych, renderowania plakietek statusu, tekstu sformatowanego lub wykresów.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typy

- Tylko do odczytu: Służy do wyświetlania treści, której nie można edytować. Odczytuje `ctx.value` w celu renderowania danych wyjściowych.
- Edytowalny: Służy do niestandardowych interakcji wejściowych. Udostępnia `ctx.getValue()`/`ctx.setValue(v)` oraz zdarzenie kontenera `js-field:value-change`, aby ułatwić dwukierunkową synchronizację z wartościami formularza.

## Scenariusze użycia

- Tylko do odczytu
  - Blok szczegółów: Wyświetlanie treści tylko do odczytu, takich jak wyniki obliczeń, plakietki statusu, fragmenty tekstu sformatowanego, wykresy itp.
  - Blok tabeli: Używany jako „Inna niestandardowa kolumna > Pole JS” do wyświetlania tylko do odczytu (jeśli potrzebują Państwo kolumny niepowiązanej z polem, proszę użyć Kolumny JS).

- Edytowalny
  - Blok formularza (CreateForm/EditForm): Używany do niestandardowych kontrolek wejściowych lub złożonych danych wejściowych, które są walidowane i przesyłane wraz z formularzem.
  - Nadaje się do scenariuszy takich jak: komponenty wejściowe z zewnętrznych bibliotek, edytory tekstu sformatowanego/kodu, złożone komponenty dynamiczne itp.

## API kontekstu środowiska uruchomieniowego

Kod środowiska uruchomieniowego Pola JS może bezpośrednio korzystać z następujących możliwości kontekstu:

- `ctx.element`: Kontener DOM pola (ElementProxy), obsługujący `innerHTML`, `querySelector`, `addEventListener` itp.
- `ctx.value`: Bieżąca wartość pola (tylko do odczytu).
- `ctx.record`: Bieżący obiekt rekordu (tylko do odczytu).
- `ctx.collection`: Metadane kolekcji, do której należy pole (tylko do odczytu).
- `ctx.requireAsync(url)`: Asynchroniczne ładowanie biblioteki AMD/UMD za pomocą adresu URL.
- `ctx.importAsync(url)`: Dynamiczne importowanie modułu ESM za pomocą adresu URL.
- `ctx.openView(options)`: Otwieranie skonfigurowanego widoku (okna podręcznego/szuflady/strony).
- `ctx.i18n.t()` / `ctx.t()`: Internacjonalizacja.
- `ctx.onRefReady(ctx.ref, cb)`: Renderowanie po przygotowaniu kontenera.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Wbudowane biblioteki React, ReactDOM, Ant Design, ikon Ant Design i dayjs do renderowania JSX i narzędzi do obsługi daty/czasu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` są zachowane dla kompatybilności.)
- `ctx.render(vnode)`: Renderuje element React, ciąg HTML lub węzeł DOM do domyślnego kontenera `ctx.element`. Wielokrotne renderowanie spowoduje ponowne użycie Roota i nadpisanie istniejącej zawartości kontenera.

Specyficzne dla typu edytowalnego (JSEditableField):

- `ctx.getValue()`: Pobieranie bieżącej wartości formularza (priorytet ma stan formularza, następnie właściwości pola).
- `ctx.setValue(v)`: Ustawianie wartości formularza i właściwości pola, utrzymując dwukierunkową synchronizację.
- Zdarzenie kontenera `js-field:value-change`: Wywoływane, gdy zmienia się wartość zewnętrzna, co ułatwia skryptowi aktualizację wyświetlania danych wejściowych.

## Edytor i fragmenty kodu

Edytor skryptów Pola JS obsługuje podświetlanie składni, podpowiedzi błędów i wbudowane fragmenty kodu (Snippets).

- `Snippets`: Otwiera listę wbudowanych fragmentów kodu, które można wyszukać i wstawić w bieżącej pozycji kursora jednym kliknięciem.
- `Run`: Bezpośrednio wykonuje bieżący kod. Dziennik wykonania jest wyświetlany w panelu `Logs` na dole, obsługując `console.log/info/warn/error` oraz podświetlanie błędów dla łatwej lokalizacji.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Mogą Państwo również generować kod za pomocą Pracownika AI:

- [Pracownik AI · Nathan: Inżynier Frontend](/ai-employees/built-in/ai-coding)

## Częste zastosowania

### 1) Podstawowe renderowanie (odczytywanie wartości pola)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Używanie JSX do renderowania komponentu React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Ładowanie bibliotek zewnętrznych (AMD/UMD lub ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Kliknięcie, aby otworzyć okno podręczne/szufladę (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Zobacz szczegóły</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Edytowalne dane wejściowe (JSEditableFieldModel)

```js
// Renderowanie prostego pola wejściowego za pomocą JSX i synchronizacja wartości formularza
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Synchronizacja danych wejściowych po zmianie wartości zewnętrznej (opcjonalnie)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Uwagi

- Zaleca się używanie zaufanych sieci CDN do ładowania bibliotek zewnętrznych oraz zapewnienie mechanizmów awaryjnych w przypadku niepowodzeń (np. `if (!lib) return;`).
- Zaleca się używanie selektorów `class` lub `[name=...]` i unikanie stałych `id`, aby zapobiec duplikowaniu `id` w wielu blokach lub oknach podręcznych.
- Czyszczenie zdarzeń: Pole może być wielokrotnie renderowane ponownie z powodu zmian danych lub przełączania widoków. Przed powiązaniem zdarzenia należy je wyczyścić lub usunąć duplikaty, aby uniknąć wielokrotnego wyzwalania. Można zastosować zasadę „najpierw usuń, potem dodaj”.