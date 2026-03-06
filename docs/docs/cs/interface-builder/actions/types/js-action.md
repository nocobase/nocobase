:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/actions/types/js-action).
:::

# JS Action

## Představení

JS Action slouží k provádění JavaScriptu při kliknutí na tlačítko pro přizpůsobení libovolného obchodního chování. Lze jej použít v panelech nástrojů formulářů, panelech nástrojů tabulek (úroveň kolekce), řádcích tabulek (úroveň záznamu) a na dalších místech k provádění operací, jako jsou validace, upozornění, volání rozhraní, otevírání vyskakovacích oken/zásuvek, obnovování dat atd.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API běhového kontextu (často používané)

- `ctx.api.request(options)`: iniciuje HTTP požadavek;
- `ctx.openView(viewUid, options)`: otevře nakonfigurované zobrazení (zásuvku/dialog/stránku);
- `ctx.message` / `ctx.notification`: globální upozornění a oznámení;
- `ctx.t()` / `ctx.i18n.t()`: internacionalizace;
- `ctx.resource`: datový zdroj kontextu na úrovni kolekce (např. panel nástrojů tabulky, obsahuje `getSelectedRows()`, `refresh()` atd.);
- `ctx.record`: aktuální záznam řádku v kontextu na úrovni záznamu (např. tlačítko v řádku tabulky);
- `ctx.form`: instance AntD Form v kontextu na úrovni formuláře (např. tlačítko v panelu nástrojů formuláře);
- `ctx.collection`: metadata aktuální kolekce;
- Editor kódu podporuje fragmenty `Snippets` a předběžné spuštění `Run` (viz níže).


- `ctx.requireAsync(url)`: asynchronně načte knihovnu AMD/UMD podle URL;
- `ctx.importAsync(url)`: dynamicky importuje modul ESM podle URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: vestavěné univerzální knihovny jako React / ReactDOM / Ant Design / Ant Design ikony / dayjs / lodash / math.js / formula.js atd., používané pro JSX vykreslování, zpracování času, manipulaci s daty a matematické výpočty.

> Skutečně dostupné proměnné se budou lišit v závislosti na umístění tlačítka, výše uvedené je přehled běžných možností.

## Editor a fragmenty

- `Snippets`: Otevře seznam vestavěných fragmentů kódu, které lze vyhledat a jedním kliknutím vložit na aktuální pozici kurzoru.
- `Run`: Přímo spustí aktuální kód a vypíše protokoly o spuštění do spodního panelu `Logs`; podporuje `console.log/info/warn/error` a zvýraznění chyb pro jejich lokalizaci.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Lze kombinovat s AI zaměstnanci pro generování/úpravu skriptů: [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/features/built-in-employee)

## Běžné použití (zjednodušené příklady)

### 1) Rozhraní požadavků a upozornění

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Tlačítko kolekce: Validace výběru a zpracování

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Provádění obchodní logiky…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Tlačítko záznamu: Čtení aktuálního záznamu řádku

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Otevření zobrazení (zásuvka/dialog)

```js
const popupUid = ctx.model.uid + '-open'; // Navázáno na aktuální tlačítko pro stabilitu
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Obnovení dat po odeslání

```js
// Obecné obnovení: Upřednostňuje zdroje tabulek/seznamů, poté zdroj bloku obsahujícího formulář
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Poznámky

- Idempotence chování: Vyhněte se vícenásobnému odeslání způsobenému opakovaným kliknutím; do logiky můžete přidat přepínač stavu nebo tlačítko zakázat.
- Zpracování chyb: Přidejte try/catch pro volání rozhraní a poskytněte uživateli upozornění.
- Propojení zobrazení: Při otevírání vyskakovacích oken/zásuvek pomocí `ctx.openView` doporučujeme explicitně předávat parametry a v případě potřeby po úspěšném odeslání aktivně obnovit nadřazený zdroj.

## Související dokumenty

- [Proměnné a kontext](/interface-builder/variables)
- [Pravidla propojení](/interface-builder/linkage-rule)
- [Zobrazení a vyskakovací okna](/interface-builder/actions/types/view)