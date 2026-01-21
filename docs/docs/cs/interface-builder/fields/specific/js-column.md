:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# JS Column

## Úvod

JS Column se používá pro „vlastní sloupce“ v tabulkách, které vykreslují obsah buněk každého řádku pomocí JavaScriptu. Není vázán na konkrétní pole a je ideální pro scénáře, jako jsou odvozené sloupce, kombinované zobrazení dat z více polí, stavové odznaky, akční tlačítka nebo agregace vzdálených dat.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Kontextové API za běhu

Při vykreslování každé buňky JS Column můžete využít následující kontextové API:

- `ctx.element`: DOM kontejner aktuální buňky (ElementProxy), který podporuje `innerHTML`, `querySelector`, `addEventListener` atd.
- `ctx.record`: Objekt záznamu aktuálního řádku (pouze pro čtení).
- `ctx.recordIndex`: Index řádku v rámci aktuální stránky (začíná od 0, může být ovlivněn stránkováním).
- `ctx.collection`: Metadata **kolekce** vázané na tabulku (pouze pro čtení).
- `ctx.requireAsync(url)`: Asynchronně načte knihovnu AMD/UMD pomocí URL.
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM pomocí URL.
- `ctx.openView(options)`: Otevře nakonfigurované zobrazení (modální okno/šuplík/stránku).
- `ctx.i18n.t()` / `ctx.t()`: Internationalizace.
- `ctx.onRefReady(ctx.ref, cb)`: Vykreslí po připravení kontejneru.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Vestavěné knihovny React, ReactDOM, Ant Design, ikony Ant Design a dayjs pro vykreslování JSX a práci s časem. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykreslí React element/HTML/DOM do výchozího kontejneru `ctx.element` (aktuální buňka). Vícenásobné vykreslení znovu použije Root a přepíše stávající obsah kontejneru.

## Editor a úryvky kódu

Editor skriptů pro JS Column podporuje zvýrazňování syntaxe, nápovědy k chybám a vestavěné úryvky kódu (Snippets).

- `Snippets`: Otevře seznam vestavěných úryvků kódu, které můžete vyhledávat a jedním kliknutím vložit na aktuální pozici kurzoru.
- `Run`: Spustí aktuální kód přímo. Protokol spuštění se vypíše do spodního panelu `Logs`, který podporuje `console.log/info/warn/error` a zvýrazňování chyb.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Můžete také použít AI zaměstnance k vygenerování kódu:

- [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/built-in/ai-coding)

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

## Důležité poznámky

- Pro načítání externích knihoven doporučujeme používat důvěryhodné CDN a mít připravený záložní plán pro případ selhání (např. `if (!lib) return;`).
- Doporučujeme používat selektory `class` nebo `[name=...]` namísto pevných `id`, abyste předešli duplicitním `id` napříč více bloky nebo modálními okny.
- Čištění událostí: Řádky tabulky se mohou dynamicky měnit se stránkováním nebo obnovením, což způsobuje vícenásobné vykreslování buněk. Před navázáním událostí byste je měli vyčistit nebo odstranit duplicity, abyste předešli opakovanému spouštění.
- Tip pro výkon: Vyhněte se opakovanému načítání velkých knihoven v každé buňce. Místo toho knihovnu uložte do mezipaměti na vyšší úrovni (např. pomocí globální proměnné nebo proměnné na úrovni tabulky) a poté ji znovu použijte.