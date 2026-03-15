:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Představení

JS Column se používá pro „vlastní sloupce“ v tabulkách, které vykreslují obsah buněk každého řádku pomocí JavaScriptu. Není vázán na konkrétní pole a je vhodný pro scénáře, jako jsou odvozené sloupce, kombinované zobrazení napříč poli, stavové odznaky, operace s tlačítky, souhrny vzdálených dat atd.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Kontextové API za běhu

Při vykreslování každé buňky JS Column lze využít následující kontextové schopnosti:

- `ctx.element`: DOM kontejner aktuální buňky (ElementProxy), podporuje `innerHTML`, `querySelector`, `addEventListener` atd.;
- `ctx.record`: Objekt záznamu aktuálního řádku (pouze pro čtení);
- `ctx.recordIndex`: Index řádku v rámci aktuální stránky (začíná od 0, může být ovlivněn stránkováním);
- `ctx.collection`: Metadata **kolekce** vázané na tabulku (pouze pro čtení);
- `ctx.requireAsync(url)`: Asynchronně načte knihovnu AMD/UMD podle URL;
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM podle URL;
- `ctx.openView(options)`: Otevře nakonfigurované zobrazení (modální okno/šuplík/stránku);
- `ctx.i18n.t()` / `ctx.t()`: Internacionalizace;
- `ctx.onRefReady(ctx.ref, cb)`: Vykreslí po připravení kontejneru;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Vestavěné knihovny React / ReactDOM / Ant Design / Ant Design ikony / dayjs / lodash / math.js / formula.js a další běžné knihovny pro vykreslování JSX, zpracování času, manipulaci s daty a matematické výpočty. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykreslí React element/HTML/DOM do výchozího kontejneru `ctx.element` (aktuální buňka); vícenásobné vykreslení znovu použije Root a přepíše stávající obsah kontejneru.

## Editor a úryvky kódu

Editor skriptů pro JS Column podporuje zvýrazňování syntaxe, nápovědy k chybám a vestavěné úryvky kódu (Snippets).

- `Snippets`: Otevře seznam vestavěných úryvků kódu, které lze vyhledávat a jedním kliknutím vložit na aktuální pozici kurzoru.
- `Run`: Přímo spustí aktuální kód, protokol spuštění se vypíše do spodního panelu `Logs`, podporuje `console.log/info/warn/error` a zvýraznění chyb.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Můžete také použít AI zaměstnance k vygenerování kódu:

- [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/features/built-in-employee)

## Časté použití

### 1) Základní vykreslování (čtení záznamu aktuálního řádku)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Použití JSX pro vykreslování React komponent

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

### 3) Otevření modálního okna/šuplíku z buňky (zobrazení/úprava)

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
  }}>Zobrazit</a>
);
```

### 4) Načítání knihoven třetích stran (AMD/UMD nebo ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## 注意事项 (Poznámky)

- Pro načítání externích knihoven doporučujeme používat důvěryhodné CDN a mít připravené ošetření pro případ selhání (např. `if (!lib) return;`).
- Doporučujeme upřednostňovat selektory `class` nebo `[name=...]` a vyhýbat se používání pevných `id`, aby se předešlo duplicitním `id` ve více blocích/oknech.
- Čištění událostí: Řádky tabulky se mohou dynamicky měnit se stránkováním/obnovením, buňky se vykreslují vícekrát. Před navázáním událostí byste je měli vyčistit nebo odstranit duplicity, aby se předešlo opakovanému spouštění.
- Doporučení pro výkon: Vyhněte se opakovanému načítání velkých knihoven v každé buňce; knihovnu byste měli uložit do mezipaměti na vyšší úrovni (např. pomocí globální proměnné nebo proměnné na úrovni tabulky) a poté ji znovu použít.