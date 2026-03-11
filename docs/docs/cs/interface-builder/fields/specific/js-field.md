:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Úvod

JS Field se používá k vlastnímu vykreslování obsahu na pozici pole pomocí JavaScriptu. Často se vyskytuje v blocích detailů, v položkách formulářů jen pro čtení nebo jako „jiné vlastní položky“ ve sloupcích tabulky. Je vhodný pro personalizované zobrazení, kombinování odvozených informací, stavové odznaky, bohatý text nebo vykreslování grafů.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typy

- Jen pro čtení: Používá se pro needitovatelné zobrazení, čte `ctx.value` pro vykreslení výstupu.
- Editovatelné: Používá se pro vlastní interakce se vstupem, poskytuje `ctx.getValue()`/`ctx.setValue(v)` a událost kontejneru `js-field:value-change` pro usnadnění obousměrné synchronizace s hodnotami formuláře.

## Případy použití

- Jen pro čtení
  - Blok detailů: Zobrazení výsledků výpočtů, stavových odznaků, úryvků bohatého textu, grafů a jiného obsahu jen pro čtení;
  - Blok tabulky: Používá se jako „Ostatní vlastní sloupce > JS Field“ pro zobrazení jen pro čtení (pokud potřebujete sloupec, který není vázán na pole, použijte JS Column);

- Editovatelné
  - Blok formuláře (CreateForm/EditForm): Používá se pro vlastní vstupní ovládací prvky nebo složené vstupy, které se validují a odesílají spolu s formulářem;
  - Vhodné scénáře: vstupní komponenty z externích knihoven, editory bohatého textu/kódu, složité dynamické komponenty atd.;

## API běhového kontextu

Kód JS Field za běhu může přímo využívat následující možnosti kontextu:

- `ctx.element`: DOM kontejner pole (ElementProxy), podporující `innerHTML`, `querySelector`, `addEventListener` atd.;
- `ctx.value`: Aktuální hodnota pole (jen pro čtení);
- `ctx.record`: Aktuální objekt záznamu (jen pro čtení);
- `ctx.collection`: Meta informace o kolekci, ke které pole patří (jen pro čtení);
- `ctx.requireAsync(url)`: Asynchronně načte knihovnu AMD/UMD pomocí URL;
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM pomocí URL;
- `ctx.openView(options)`: Otevře nakonfigurované zobrazení (vyskakovací okno/zásuvka/stránka);
- `ctx.i18n.t()` / `ctx.t()`: Internacionalizace;
- `ctx.onRefReady(ctx.ref, cb)`: Vykreslí po připravenosti kontejneru;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Vestavěné React / ReactDOM / Ant Design / Ant Design ikony / dayjs / lodash / math.js / formula.js a další univerzální knihovny pro vykreslování JSX, zpracování času, manipulaci s daty a matematické výpočty. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou stále zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykreslí React element, HTML řetězec nebo DOM uzel do výchozího kontejneru `ctx.element`; opakované vykreslování znovu použije Root a přepíše stávající obsah kontejneru.

Specifické pro editovatelný typ (JSEditableField):

- `ctx.getValue()`: Získá aktuální hodnotu formuláře (upřednostňuje stav formuláře, poté se vrátí k props pole).
- `ctx.setValue(v)`: Nastaví hodnotu formuláře a props pole, udržuje obousměrnou synchronizaci.
- Událost kontejneru `js-field:value-change`: Spustí se při změně externí hodnoty, což usnadňuje skriptu aktualizaci zobrazení vstupu.

## Editor a úryvky

Editor skriptů JS Field podporuje zvýrazňování syntaxe, nápovědy k chybám a vestavěné úryvky kódu (Snippets).

- `Snippets`: Otevře seznam vestavěných úryvků kódu, které lze vyhledávat a vložit na aktuální pozici kurzoru jedním kliknutím.
- `Run`: Přímo spustí aktuální kód, protokol spuštění se vypíše do panelu `Logs` dole, podporuje `console.log/info/warn/error` a zvýrazňování chyb pro snadnou lokalizaci.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Kód můžete také generovat ve spolupráci s AI zaměstnancem:

- [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/features/built-in-employee)

## Běžné použití

### 1) Základní vykreslování (čtení hodnoty pole)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Použití JSX pro vykreslení komponenty React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Načítání knihoven třetích stran (AMD/UMD nebo ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Kliknutím otevřete vyskakovací okno/zásuvku (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Zobrazit detaily</a>`;
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

### 5) Editovatelný vstup (JSEditableFieldModel)

```js
// Vykreslení jednoduchého vstupu pomocí JSX a synchronizace hodnoty formuláře
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

// Synchronizace vstupu při změně externí hodnoty (volitelné)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Poznámky

- Pro načítání externích knihoven doporučujeme používat důvěryhodné CDN a připravit se na scénáře selhání (např. `if (!lib) return;`).
- Pro selektory doporučujeme upřednostňovat `class` nebo `[name=...]` a vyhýbat se používání pevných `id`, aby se zabránilo duplicitním `id` ve více blocích nebo vyskakovacích oknech.
- Vyčištění událostí: Pole může být kvůli změnám dat nebo přepínání zobrazení vykresleno vícekrát. Před navázáním události byste ji měli vyčistit nebo odstranit duplicity, aby se zabránilo opakovanému spouštění. Lze použít „nejprve remove, poté add“.