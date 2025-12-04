:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# JS Block

## Úvod

JS Block je vysoce flexibilní „blok pro vlastní vykreslování“, který Vám umožňuje přímo psát JavaScript skripty pro generování rozhraní, vázání událostí, volání datových API nebo integraci knihoven třetích stran. Je vhodný pro personalizované vizualizace, dočasné experimenty a lehká rozšíření, které je obtížné pokrýt vestavěnými bloky.

## API kontextu běhového prostředí

Kontext běhového prostředí JS Bloku má injektovány běžné funkce, které můžete přímo používat:

- `ctx.element`: DOM kontejner bloku (bezpečně zapouzdřený jako ElementProxy), podporující `innerHTML`, `querySelector`, `addEventListener` atd.
- `ctx.requireAsync(url)`: Asynchronně načítá knihovnu AMD/UMD pomocí URL.
- `ctx.importAsync(url)`: Dynamicky importuje modul ESM pomocí URL.
- `ctx.openView`: Otevírá nakonfigurované zobrazení (vyskakovací okno/zásuvka/stránka).
- `ctx.useResource(...)` + `ctx.resource`: Přistupuje k datům jako k zdroji.
- `ctx.i18n.t()` / `ctx.t()`: Vestavěná funkce internacionalizace.
- `ctx.onRefReady(ctx.ref, cb)`: Vykresluje po připravenosti kontejneru, aby se předešlo problémům s časováním.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Vestavěné obecné knihovny jako React, ReactDOM, Ant Design, ikony Ant Design a dayjs pro vykreslování JSX a práci s časem. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` jsou stále zachovány pro kompatibilitu.)
- `ctx.render(vnode)`: Vykresluje React element, HTML řetězec nebo DOM uzel do výchozího kontejneru `ctx.element`. Vícenásobné volání znovu použije stejný React Root a přepíše stávající obsah kontejneru.

## Přidání bloku

JS Block můžete přidat na stránku nebo do vyskakovacího okna.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor a fragmenty kódu

Editor skriptů JS Bloku podporuje zvýraznění syntaxe, nápovědy k chybám a vestavěné fragmenty kódu (Snippets), které Vám umožňují rychle vkládat běžné příklady, jako je vykreslování grafů, vázání událostí tlačítek, načítání externích knihoven, vykreslování komponent React/Vue, časové osy, informační karty atd.

- `Snippets`: Otevře seznam vestavěných fragmentů kódu. Můžete vyhledávat a jedním kliknutím vložit vybraný fragment do aktuální pozice kurzoru v editoru kódu.
- `Run`: Přímo spustí kód v aktuálním editoru a výstupy běhových logů do panelu `Logs` dole. Podporuje zobrazení `console.log/info/warn/error` a chyby budou zvýrazněny s možností navigace na konkrétní řádek a sloupec.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Navíc můžete přímo z pravého horního rohu editoru vyvolat AI asistenta „Frontend Engineer · Nathan“, který Vám pomůže napsat nebo upravit skripty na základě aktuálního kontextu. Poté můžete jedním kliknutím „Apply to editor“ (Použít do editoru) aplikovat změny a spustit kód, abyste viděli výsledek. Podrobnosti naleznete zde:

- [AI asistent · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Běhové prostředí a zabezpečení

- **Kontejner**: Systém poskytuje skriptu bezpečný DOM kontejner `ctx.element` (ElementProxy), který ovlivňuje pouze aktuální blok a nezasahuje do jiných oblastí stránky.
- **Sandbox**: Skript běží v kontrolovaném prostředí. `window`/`document`/`navigator` používají bezpečné proxy objekty, což umožňuje běžné API, zatímco rizikové chování je omezeno.
- **Opětovné vykreslení**: Blok se automaticky znovu vykreslí, když je skryt a poté znovu zobrazen (aby se zabránilo opakovanému spuštění počátečního skriptu při prvním připojení).

## Běžné použití (zjednodušené příklady)

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

### 3) Načtení a vykreslení ECharts

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

### 4) Otevření zobrazení (zásuvky)

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

## Důležité poznámky

- Pro načítání externích knihoven se doporučuje používat důvěryhodné CDN.
- **Doporučení pro použití selektorů**: Upřednostňujte použití selektorů `class` nebo atributů `[name=...]`. Vyhněte se používání pevných `id`, abyste předešli konfliktům stylů nebo událostí způsobeným duplicitními `id` v několika blocích nebo vyskakovacích oknech.
- **Čištění událostí**: Jelikož se blok může vykreslit vícekrát, měly by být posluchače událostí před navázáním vyčištěny nebo deduplikovány, aby se zabránilo opakovanému spouštění. Můžete použít přístup „nejprve odebrat, poté přidat“, jednorázové posluchače nebo příznaky pro zabránění duplikátům.

## Související dokumenty

- [Proměnné a kontext](/interface-builder/variables)
- [Pravidla propojení](/interface-builder/linkage-rule)
- [Zobrazení a vyskakovací okna](/interface-builder/actions/types/view)