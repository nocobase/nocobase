:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Wprowadzenie

JS Field służy do niestandardowego renderowania treści w miejscu pola za pomocą JavaScript. Jest powszechnie stosowany w blokach szczegółów, elementach formularzy tylko do odczytu lub jako „Inne niestandardowe elementy” w kolumnach tabeli. Nadaje się do spersonalizowanej prezentacji, łączenia informacji pochodnych, odznak statusu, tekstu sformatowanego lub wykresów.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typy

- Typ tylko do odczytu: Służy do nieedytowalnego wyświetlania, odczytuje `ctx.value` do renderowania danych wyjściowych.
- Typ edytowalny: Służy do niestandardowych interakcji wejściowych, udostępnia `ctx.getValue()`/`ctx.setValue(v)` oraz zdarzenie kontenera `js-field:value-change`, ułatwiając dwukierunkową synchronizację z wartościami formularza.

## Scenariusze użycia

- Typ tylko do odczytu
  - Blok szczegółów: Wyświetlanie wyników obliczeń, odznak statusu, fragmentów tekstu sformatowanego, wykresów i innych treści tylko do odczytu;
  - Blok tabeli: Używany jako „Inna niestandardowa kolumna > JS Field” do wyświetlania tylko do odczytu (jeśli potrzebują Państwo kolumny niepowiązanej z polem, proszę użyć JS Column);

- Typ edytowalny
  - Blok formularza (CreateForm/EditForm): Używany do niestandardowych kontrolek wejściowych lub złożonych danych wejściowych, walidowanych i przesyłanych wraz z formularzem;
  - Odpowiednie scenariusze: komponenty wejściowe z zewnętrznych bibliotek, edytory tekstu sformatowanego/kodu, złożone komponenty dynamiczne itp.;

## API kontekstu środowiska uruchomieniowego

Kod środowiska uruchomieniowego JS Field może bezpośrednio korzystać z następujących możliwości kontekstu:

- `ctx.element`: Kontener DOM pola (ElementProxy), obsługuje `innerHTML`, `querySelector`, `addEventListener` itp.;
- `ctx.value`: Bieżąca wartość pola (tylko do odczytu);
- `ctx.record`: Bieżący obiekt rekordu (tylko do odczytu);
- `ctx.collection`: Metadane kolekcji, do której należy pole (tylko do odczytu);
- `ctx.requireAsync(url)`: Asynchroniczne ładowanie bibliotek AMD/UMD za pomocą adresu URL;
- `ctx.importAsync(url)`: Dynamiczne importowanie modułów ESM za pomocą adresu URL;
- `ctx.openView(options)`: Otwieranie skonfigurowanego widoku (okno podręczne/szuflada/strona);
- `ctx.i18n.t()` / `ctx.t()`: Internacjonalizacja;
- `ctx.onRefReady(ctx.ref, cb)`: Renderowanie po przygotowaniu kontenera;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Wbudowane biblioteki React / ReactDOM / Ant Design / Ikony Ant Design / dayjs / lodash / math.js / formula.js i inne uniwersalne biblioteki, używane do renderowania JSX, obsługi czasu, operacji na danych i obliczeń matematycznych. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` są nadal zachowane dla kompatybilności.)
- `ctx.render(vnode)`: Renderuje element React, ciąg HTML lub węzeł DOM do domyślnego kontenera `ctx.element`; powtarzające się renderowanie spowoduje ponowne użycie Roota i nadpisanie istniejącej zawartości kontenera.

Specyficzne dla typu edytowalnego (JSEditableField):

- `ctx.getValue()`: Pobiera bieżącą wartość formularza (priorytetowo traktuje stan formularza, a następnie właściwości pola).
- `ctx.setValue(v)`: Ustawia wartość formularza i właściwości pola, zachowując dwukierunkową synchronizację.
- Zdarzenie kontenera `js-field:value-change`: Wyzwalane, gdy zmienia się wartość zewnętrzna, ułatwiając skryptowi aktualizację wyświetlania danych wejściowych.

## Edytor i fragmenty kodu

Edytor skryptów JS Field obsługuje podświetlanie składni, podpowiedzi błędów i wbudowane fragmenty kodu (Snippets).

- `Snippets`: Otwiera listę wbudowanych fragmentów kodu, które można wyszukiwać i wstawiać w bieżącej pozycji kursora jednym kliknięciem.
- `Run`: Bezpośrednio uruchamia bieżący kod, dzienniki uruchamiania są wyprowadzane do panelu `Logs` na dole, obsługuje `console.log/info/warn/error` oraz lokalizację błędów poprzez podświetlanie.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Można połączyć z Pracownikiem AI w celu generowania kodu:

- [Pracownik AI · Nathan: Inżynier Frontend](/ai-employees/features/built-in-employee)

## Częste zastosowania

### 1) Podstawowe renderowanie (odczyt wartości pola)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Użycie JSX do renderowania komponentu React

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

- Do ładowania bibliotek zewnętrznych zaleca się korzystanie z zaufanych sieci CDN i przygotowanie mechanizmów awaryjnych (np. `if (!lib) return;`).
- W przypadku selektorów zaleca się priorytetowe traktowanie `class` lub `[name=...]` i unikanie stałych `id`, aby zapobiec powielaniu `id` w wielu blokach lub oknach podręcznych.
- Czyszczenie zdarzeń: Pole może być wielokrotnie renderowane z powodu zmian danych lub przełączania widoków. Przed powiązaniem zdarzeń należy je wyczyścić lub usunąć duplikaty, aby uniknąć wielokrotnego wyzwalania. Można zastosować zasadę „najpierw remove, potem add”.