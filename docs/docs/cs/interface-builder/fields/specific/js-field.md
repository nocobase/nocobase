:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# JS Pole

## Úvod

JS Pole slouží k vlastnímu vykreslování obsahu na pozici pole pomocí JavaScriptu. Běžně se používá v blocích detailů, pro položky jen pro čtení ve formulářích nebo jako „Jiné vlastní položky“ ve sloupcích tabulek. Je vhodné pro personalizované zobrazení, kombinování odvozených informací, vykreslování stavových odznaků, bohatého textu nebo grafů.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typy

- Jen pro čtení: Slouží pro zobrazení, které nelze upravovat, a pro vykreslení výstupu čte `ctx.value`.
- Editovatelné: Slouží pro vlastní interakce s vstupem. Poskytuje `ctx.getValue()`/`ctx.setValue(v)` a událost kontejneru `js-field:value-change` pro usnadnění obousměrné synchronizace s hodnotami formuláře.

## Případy použití

- Jen pro čtení
  - Blok detailů: Zobrazuje obsah jen pro čtení, jako jsou výsledky výpočtů, stavové odznaky, fragmenty bohatého textu, grafy atd.
  - Blok tabulky: Používá se jako „Jiné vlastní sloupce > JS Field“ pro zobrazení jen pro čtení (pokud potřebujete sloupec, který není vázán na pole, použijte prosím JS Column).

- Editovatelné
  - Blok formuláře (CreateForm/EditForm): Slouží pro vlastní vstupní ovládací prvky nebo složené vstupy, které jsou validovány a odesílány s formulářem.
  - Vhodné pro scénáře jako: vstupní komponenty z externích knihoven, editory bohatého textu/kódu, složité dynamické komponenty atd.

## API běhového kontextu

Kód JS Pole za běhu může přímo využívat následující možnosti kontextu:

- `ctx.element`: Kontejner DOM pole (ElementProxy), podporující `innerHTML`, `querySelector`, `addEventListener` atd.
- `ctx.value`: Aktuální hodnota pole (jen pro čtení).
- `ctx.record`: Aktuální objekt záznamu (jen pro čtení).
- `ctx.collection`: Metadata kolekce, do které pole patří (jen pro čtení).
- `ctx.requireAsync(url)`: Asynchronně načte knihovnu AMD/UMD pomocí URL.
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM pomocí URL.
- `ctx.openView(options)`: Otevře nakonfigurované zobrazení (vyskakovací okno/zásuvka/stránka).
- `ctx.i18n.t()` / `ctx.t()`: Internationalizace.
- `ctx.onRefReady(ctx.ref, cb)`: Vykreslí po připravenosti kontejneru.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Vestavěné knihovny React, ReactDOM, Ant Design, ikony Ant Design a dayjs pro vykreslování JSX a utility pro práci s datem a časem. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykreslí React element, HTML řetězec nebo DOM uzel do výchozího kontejneru `ctx.element`. Opakované vykreslování znovu použije Root a přepíše stávající obsah kontejneru.

Specifické pro editovatelný typ (JSEditableField):

- `ctx.getValue()`: Získá aktuální hodnotu formuláře (upřednostňuje stav formuláře, poté se vrátí k props pole).
- `ctx.setValue(v)`: Nastaví hodnotu formuláře a props pole, udržuje obousměrnou synchronizaci.
- Událost kontejneru `js-field:value-change`: Spustí se, když se změní externí hodnota, což usnadňuje skriptu aktualizaci zobrazení vstupu.

## Editor a úryvky kódu

Editor skriptů JS Pole podporuje zvýrazňování syntaxe, nápovědy k chybám a vestavěné úryvky kódu (Snippets).

- `Snippets`: Otevře seznam vestavěných úryvků kódu, které lze vyhledávat a vložit na aktuální pozici kurzoru jedním kliknutím.
- `Run`: Přímo spustí aktuální kód. Protokol spuštění je vyveden do panelu `Logs` dole, podporuje `console.log/info/warn/error` a zvýrazňování chyb pro snadnou lokalizaci.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Kód můžete také generovat s pomocí AI zaměstnance:

- [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/built-in/ai-coding)

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
// Vykreslete jednoduchý vstup pomocí JSX a synchronizujte hodnotu formuláře
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

// Synchronizujte vstup, když se změní externí hodnota (volitelné)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Poznámky

- Pro načítání externích knihoven se doporučuje používat důvěryhodné CDN a mít připravený záložní plán pro případ selhání (např. `if (!lib) return;`).
- Pro selektory se doporučuje upřednostňovat `class` nebo `[name=...]` a vyhnout se používání pevných `id`, aby se zabránilo duplicitním `id` ve více blocích nebo vyskakovacích oknech.
- Vyčištění událostí: Pole se může kvůli změnám dat nebo přepínání zobrazení vykreslit vícekrát. Před navázáním události byste ji měli vyčistit nebo odstranit duplicity, abyste zabránili opakovanému spouštění. Můžete „nejprve odebrat, poté přidat“.