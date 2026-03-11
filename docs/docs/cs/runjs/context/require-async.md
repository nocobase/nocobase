:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/require-async).
:::

# ctx.requireAsync()

Asynchronně načítá skripty **UMD/AMD** nebo skripty připojené ke globálnímu objektu pomocí URL, případně také **CSS**. Je vhodný pro scénáře RunJS, které vyžadují knihovny UMD/AMD, jako jsou ECharts, Chart.js, FullCalendar (verze UMD) nebo pluginy jQuery. Pokud knihovna poskytuje také verzi ESM, dejte přednost [ctx.importAsync()](./import-async.md).

## Typické scénáře

Lze použít v jakémkoli scénáři RunJS, kde je vyžadováno načítání skriptů UMD/AMD/global nebo CSS podle potřeby, jako jsou JSBlock, JSField, JSItem, JSColumn, pracovní postup, JSAction atd. Typické využití: grafy ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), pluginy jQuery atd.

## Definice typu

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parametry

| Parametr | Typ | Popis |
|----------|------|-------------|
| `url` | `string` | Adresa skriptu nebo CSS. Podporuje **zkrácený zápis** `<název-balíčku>@<verze>/<cesta-k-souboru>` (při rozlišení přes ESM CDN se přidá `?raw` pro získání původního souboru UMD) nebo **úplnou URL**. Pokud je předán soubor `.css`, načte a vloží styly. |

## Návratová hodnota

- Načtený objekt knihovny (první hodnota modulu z callbacku UMD/AMD). Mnoho knihoven UMD se připojuje k `window` (např. `window.echarts`), takže návratová hodnota může být `undefined`. V takovém případě přistupujte ke globální proměnné podle dokumentace dané knihovny.
- Při předání `.css` vrací výsledek funkce `loadCSS`.

## Popis formátu URL

- **Zkrácená cesta**: např. `echarts@5/dist/echarts.min.js`. V rámci výchozího ESM CDN (esm.sh) bude požadavek směřovat na `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. Parametr `?raw` slouží k získání původního souboru UMD namísto wrapperu ESM.
- **Úplná URL**: Lze přímo použít jakoukoli adresu CDN, například `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: URL končící na `.css` bude načtena a vložena do stránky.

## Rozdíl oproti ctx.importAsync()

- **ctx.requireAsync()**: Načítá skripty **UMD/AMD/global**. Vhodné pro ECharts, Chart.js, FullCalendar (UMD), pluginy jQuery atd. Knihovny se po načtení často připojují k `window`; návratovou hodnotou může být objekt knihovny nebo `undefined`.
- **ctx.importAsync()**: Načítá **ESM moduly** a vrací jmenný prostor modulu. Pokud knihovna poskytuje ESM, použijte `ctx.importAsync()` pro lepší sémantiku modulů a tree-shaking.

## Příklady

### Základní použití

```javascript
// Zkrácená cesta (rozlišená přes ESM CDN jako ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Úplná URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Načtení CSS a vložení do stránky
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Graf ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('Knihovna ECharts nebyla načtena');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Přehled prodejů') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js Sloupcový graf

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js nebyl načten');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Množství'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Poznámky

- **Formát návratové hodnoty**: Způsoby exportu UMD se liší; návratová hodnota může být objekt knihovny nebo `undefined`. Pokud je `undefined`, přistupujte k ní přes `window` podle dokumentace knihovny.
- **Závislost na síti**: Vyžaduje přístup k CDN. V prostředích s vnitřní sítí můžete pomocí **ESM_CDN_BASE_URL** odkázat na vlastní službu.
- **Výběr mezi importAsync**: Pokud knihovna poskytuje jak ESM, tak UMD, dejte přednost `ctx.importAsync()`.

## Související

- [ctx.importAsync()](./import-async.md) – Načítá moduly ESM, vhodné pro Vue, dayjs (ESM) atd.
- [ctx.render()](./render.md) – Vykresluje grafy a další komponenty do kontejneru.
- [ctx.libs](./libs.md) – Vestavěné knihovny React, antd, dayjs atd., které nevyžadují asynchronní načítání.