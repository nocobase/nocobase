:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# JS Akce

## Úvod

JS Akce slouží k vykonání JavaScriptu při kliknutí na tlačítko, což Vám umožňuje přizpůsobit si libovolné obchodní chování. Můžete ji použít v panelech nástrojů formulářů, panelech nástrojů tabulek (na úrovni **kolekce**), řádcích tabulek (na úrovni záznamu) a na dalších místech. Umožňuje provádět operace jako validace, zobrazování upozornění, volání API, otevírání vyskakovacích oken/zásuvek nebo obnovování dat.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API běhového kontextu (často používané)

- `ctx.api.request(options)`: Odesílá HTTP požadavek.
- `ctx.openView(viewUid, options)`: Otevře nakonfigurované zobrazení (zásuvku/dialog/stránku).
- `ctx.message` / `ctx.notification`: Globální zprávy a oznámení.
- `ctx.t()` / `ctx.i18n.t()`: Internacionalizace.
- `ctx.resource`: Datový zdroj pro kontext na úrovni **kolekce** (např. panel nástrojů tabulky), včetně metod jako `getSelectedRows()` a `refresh()`.
- `ctx.record`: Aktuální záznam řádku pro kontext na úrovni záznamu (např. tlačítko v řádku tabulky).
- `ctx.form`: Instance AntD Form pro kontext na úrovni formuláře (např. tlačítko v panelu nástrojů formuláře).
- `ctx.collection`: Metainformace aktuální **kolekce**.
- Editor kódu podporuje fragmenty `Snippets` a předběžné spuštění `Run` (viz níže).

- `ctx.requireAsync(url)`: Asynchronně načítá knihovnu AMD/UMD z URL.
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM z URL.

> Skutečně dostupné proměnné se mohou lišit v závislosti na umístění tlačítka. Výše uvedený seznam je přehledem běžných možností.

## Editor a fragmenty

- `Snippets`: Otevře seznam vestavěných fragmentů kódu, které můžete vyhledávat a vložit jedním kliknutím na aktuální pozici kurzoru.
- `Run`: Přímo spustí aktuální kód a výstupní protokoly běhu zobrazí v panelu `Logs` dole. Podporuje `console.log/info/warn/error` a zvýraznění chyb pro snadnou lokalizaci.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Skripty můžete generovat/upravovat ve spolupráci s AI zaměstnanci: [AI zaměstnanec · Nathan: Frontend inženýr](/ai-employees/built-in/ai-coding)

## Běžné použití (zjednodušené příklady)

### 1) API požadavek a oznámení

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
// TODO: Implementujte obchodní logiku…
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

- **Idempotentní akce**: Abyste zabránili vícenásobnému odeslání způsobenému opakovaným kliknutím, můžete do své logiky přidat přepínač stavu nebo tlačítko zakázat.
- **Zpracování chyb**: Pro volání API přidejte bloky `try/catch` a poskytněte uživatelsky přívětivou zpětnou vazbu.
- **Interakce zobrazení**: Při otevírání vyskakovacího okna/zásuvky pomocí `ctx.openView` se doporučuje explicitně předávat parametry a v případě potřeby aktivně obnovit nadřazený zdroj po úspěšném odeslání.

## Související dokumenty

- [Proměnné a kontext](/interface-builder/variables)
- [Pravidla propojení](/interface-builder/linkage-rule)
- [Zobrazení a vyskakovací okna](/interface-builder/actions/types/view)