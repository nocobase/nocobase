:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# JS Item

## Wprowadzenie

JS Item służy do tworzenia „niestandardowych elementów” (niepowiązanych z polem) w formularzu. Mogą Państwo używać JavaScript/JSX do renderowania dowolnej zawartości (takiej jak wskazówki, statystyki, podglądy, przyciski itp.) oraz do interakcji z formularzem i kontekstem rekordu. Jest to idealne rozwiązanie do scenariuszy takich jak podglądy w czasie rzeczywistym, wskazówki instruktażowe i małe interaktywne komponenty.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Często używane API kontekstu środowiska uruchomieniowego

- `ctx.element`: Kontener DOM (ElementProxy) bieżącego elementu, obsługujący `innerHTML`, `querySelector`, `addEventListener` itp.
- `ctx.form`: Instancja formularza AntD, umożliwiająca operacje takie jak `getFieldValue / getFieldsValue / setFieldsValue / validateFields` itp.
- `ctx.blockModel`: Model bloku formularza, do którego należy, który może nasłuchiwać zmian `formValuesChange` w celu implementacji powiązań.
- `ctx.record` / `ctx.collection`: Bieżący rekord i metadane kolekcji (dostępne w niektórych scenariuszach).
- `ctx.requireAsync(url)`: Asynchroniczne ładowanie biblioteki AMD/UMD za pomocą adresu URL.
- `ctx.importAsync(url)`: Dynamiczne importowanie modułu ESM za pomocą adresu URL.
- `ctx.openView(viewUid, options)`: Otwieranie skonfigurowanego widoku (szuflady/okna dialogowego/strony).
- `ctx.message` / `ctx.notification`: Globalne komunikaty i powiadomienia.
- `ctx.t()` / `ctx.i18n.t()`: Internacjonalizacja.
- `ctx.onRefReady(ctx.ref, cb)`: Renderowanie po gotowości kontenera.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Wbudowane biblioteki React, ReactDOM, Ant Design, ikon Ant Design i dayjs, przeznaczone do renderowania JSX i obsługi daty/czasu. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` są zachowane dla kompatybilności.)
- `ctx.render(vnode)`: Renderuje element React/HTML/DOM do domyślnego kontenera `ctx.element`. Wielokrotne renderowanie spowoduje ponowne użycie Root i nadpisanie istniejącej zawartości kontenera.

## Edytor i fragmenty kodu

- `Snippets`: Otwiera listę wbudowanych fragmentów kodu, umożliwiając wyszukiwanie i wstawianie ich w bieżącej pozycji kursora jednym kliknięciem.
- `Run`: Bezpośrednio wykonuje bieżący kod i wyświetla dzienniki wykonania w panelu `Logs` na dole. Obsługuje `console.log/info/warn/error` oraz podświetlanie błędów.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Można używać z pracownikiem AI do generowania/modyfikowania skryptów: [Pracownik AI · Nathan: Inżynier Frontendowy](/ai-employees/built-in/ai-coding)

## Typowe zastosowania (uproszczone przykłady)

### 1) Podgląd w czasie rzeczywistym (odczyt wartości formularza)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Otwieranie widoku (szuflady)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Ładowanie i renderowanie zewnętrznych bibliotek

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Uwagi

- Zaleca się używanie zaufanych sieci CDN do ładowania zewnętrznych bibliotek oraz zapewnienie mechanizmów awaryjnych w przypadku niepowodzeń (np. `if (!lib) return;`).
- Zaleca się priorytetowe używanie selektorów `class` lub `[name=...]` i unikanie stałych `id`, aby zapobiec duplikowaniu `id` w wielu blokach/oknach pop-up.
- Czyszczenie zdarzeń: Częste zmiany wartości formularza wywołują wielokrotne renderowanie. Przed przypisaniem zdarzenia należy je wyczyścić lub usunąć duplikaty (np. najpierw `remove`, potem `add`, użyć `{ once: true }` lub oznaczyć `dataset` w celu zapobiegania duplikatom).

## Powiązana dokumentacja

- [Zmienne i kontekst](/interface-builder/variables)
- [Reguły powiązań](/interface-builder/linkage-rule)
- [Widoki i okna pop-up](/interface-builder/actions/types/view)