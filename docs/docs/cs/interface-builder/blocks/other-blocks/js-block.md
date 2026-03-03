:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block

## Představení

JS Block je vysoce flexibilní „blok pro vlastní vykreslování“, který podporuje přímé psaní JavaScriptových skriptů pro generování rozhraní, vázání událostí, volání datových rozhraní nebo integraci knihoven třetích stran. Je vhodný pro personalizovanou vizualizaci, dočasné experimenty a scénáře lehkých rozšíření, které jsou obtížně pokryty vestavěnými bloky.

## API kontextu běhového prostředí

Kontext běhového prostředí JS Bloku má injektovány běžné funkce, které lze přímo používat:

- `ctx.element`: DOM kontejner bloku (bezpečně zapouzdřený jako ElementProxy), podporuje `innerHTML`, `querySelector`, `addEventListener` atd.;
- `ctx.requireAsync(url)`: Asynchronně načítá knihovnu AMD/UMD podle URL;
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM podle URL;
- `ctx.openView`: Otevírá nakonfigurované zobrazení (vyskakovací okno/zásuvka/stránka);
- `ctx.useResource(...)` + `ctx.resource`: Přistupuje k datům jako k zdroji;
- `ctx.i18n.t()` / `ctx.t()`: Vestavěná funkce internacionalizace;
- `ctx.onRefReady(ctx.ref, cb)`: Vykresluje až po připravenosti kontejneru, aby se předešlo problémům s časováním;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Vestavěné obecné knihovny React / ReactDOM / Ant Design / Ant Design ikony / dayjs / lodash / math.js / formula.js atd. pro vykreslování JSX, zpracování času, manipulaci s daty a matematické výpočty. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou stále zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykresluje React element, HTML řetězec nebo DOM uzel do výchozího kontejneru `ctx.element`; vícenásobná volání znovu použijí stejný React Root a přepíší stávající obsah kontejneru.

## Přidání bloku

- JS Block můžete přidat na stránku nebo do vyskakovacího okna.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor a fragmenty kódu

Editor skriptů JS Bloku podporuje zvýraznění syntaxe, nápovědy k chybám a vestavěné fragmenty kódu (Snippets), které umožňují rychle vkládat běžné příklady, jako jsou: vykreslování grafů, vázání událostí tlačítek, načítání externích knihoven, vykreslování komponent React/Vue, časové osy, informační karty atd.

- `Snippets`: Otevře seznam vestavěných fragmentů kódu, kde můžete vyhledávat a jedním kliknutím vložit vybraný fragment na aktuální pozici kurzoru v editoru.
- `Run`: Přímo spustí kód v aktuálním editoru a vypíše logy běhu do panelu `Logs` dole. Podporuje zobrazení `console.log/info/warn/error`, chyby jsou zvýrazněny a lze se navigovat na konkrétní řádek a sloupec.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Navíc můžete v pravém horním rohu editoru přímo vyvolat AI zaměstnance „Frontend Engineer · Nathan“, aby vám na základě aktuálního kontextu pomohl napsat nebo upravit skript. Poté můžete jedním kliknutím „Apply to editor“ aplikovat změny do editoru a spustit kód pro zobrazení výsledku. Podrobnosti viz:

- [AI zaměstnanec · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Běhové prostředí a zabezpečení

- Kontejner: Systém poskytuje skriptu bezpečný DOM kontejner `ctx.element` (ElementProxy), který ovlivňuje pouze aktuální blok a nezasahuje do jiných oblastí stránky.
- Sandbox: Skript běží v kontrolovaném prostředí, `window`/`document`/`navigator` používají bezpečné proxy objekty, běžná API jsou dostupná, rizikové chování je omezeno.
- Opětovné vykreslení: Blok se automaticky znovu vykreslí, pokud je skryt a poté znovu zobrazen (aby se zabránilo opakovanému spuštění při prvním připojení).

## Časté použití (zjednodušené příklady)

### 1) Vykreslení React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Šablona API požadavku

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Načtení ECharts a vykreslení

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Otevření zobrazení (zásuvka)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Načtení zdroje a vykreslení JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Upozornění

- Pro načítání externích knihoven se doporučuje používat důvěryhodné CDN.
- Doporučení pro použití selektorů: Upřednostňujte použití selektorů `class` nebo atributů `[name=...]`; vyhněte se používání pevných `id`, aby se předešlo konfliktům stylů nebo událostí v důsledku duplicitních `id` ve více blocích nebo vyskakovacích oknech.
- Čištění událostí: Blok se může vykreslit vícekrát, před vázáním událostí by měly být vyčištěny nebo deduplikovány, aby se zabránilo opakovanému spouštění. Lze použít přístup „nejprve remove, poté add“, jednorázové posluchače nebo příznaky proti opakování.

## Související dokumenty

- [Proměnné a kontext](/interface-builder/variables)
- [Pravidla propojení](/interface-builder/linkage-rule)
- [Zobrazení a vyskakovací okna](/interface-builder/actions/types/view)