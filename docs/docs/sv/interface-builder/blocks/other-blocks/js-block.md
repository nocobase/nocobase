:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/blocks/other-blocks/js-block).
:::

# JS Block 区块

## Introduktion

JS Block är ett mycket flexibelt "anpassat renderingsblock" som stöder direkt skrivande av JavaScript-skript för att generera gränssnitt, binda händelser, anropa datagränssnitt eller integrera tredjepartsbibliotek. Det är lämpligt för personlig visualisering, tillfälliga experiment och lätta utökningar som är svåra att täcka med inbyggda block.

## API för körtidskontext

JS Blockets körtidskontext har injicerats med vanliga funktioner som kan användas direkt:

- `ctx.element`: Blockets DOM-behållare (säkerhetsinkapslad, ElementProxy), stöder `innerHTML`, `querySelector`, `addEventListener` etc.;
- `ctx.requireAsync(url)`: Laddar asynkront AMD/UMD-bibliotek via URL;
- `ctx.importAsync(url)`: Importerar dynamiskt ESM-moduler via URL;
- `ctx.openView`: Öppnar konfigurerade vyer (popup/låda/sida);
- `ctx.useResource(...)` + `ctx.resource`: Åtkomst till data som en resurs;
- `ctx.i18n.t()` / `ctx.t()`: Inbyggd internationaliseringsfunktion;
- `ctx.onRefReady(ctx.ref, cb)`: Renderar efter att behållaren är redo för att undvika tidsproblem;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Inbyggda React / ReactDOM / Ant Design / Ant Design-ikoner / dayjs / lodash / math.js / formula.js och andra generella bibliotek för JSX-rendering, tidshantering, datamanipulering och matematiska beräkningar. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls fortfarande för kompatibilitet.)
- `ctx.render(vnode)`: Renderar React-element, HTML-strängar eller DOM-noder till standardbehållaren `ctx.element`; flera anrop återanvänder samma React Root och skriver över behållarens befintliga innehåll.

## Lägga till区块

- Ni kan lägga till JS Block på en sida eller i en popup.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Redigerare och kodsnuttar

JS Blockets skriptredigerare stöder syntaxmarkering, felmeddelanden och inbyggda kodsnuttar (Snippets), vilket gör att ni snabbt kan infoga vanliga exempel, såsom: rendering av diagram, bindning av knapphändelser, laddning av externa bibliotek, rendering av React/Vue-komponenter, tidslinjer, informationskort etc.

- `Snippets`: Öppnar listan över inbyggda kodsnuttar, där ni kan söka och med ett klick infoga vald snutt vid markörens aktuella position i kodredigeraren.
- `Run`: Kör koden i den aktuella redigeraren direkt och matar ut körloggar till `Logs`-panelen längst ner. Stöder visning av `console.log/info/warn/error`, och fel markeras och kan lokaliseras till specifik rad och kolumn.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Dessutom kan ni i redigerarens övre högra hörn direkt kalla på AI-medarbetaren "Frontend-ingenjör · Nathan", och låta honom hjälpa er att skriva eller ändra skript baserat på den aktuella kontexten. Använd "Apply to editor" för att applicera till redigeraren och kör sedan för att se effekten. Se:

- [AI-medarbetare · Nathan: Frontend-ingenjör](/ai-employees/features/built-in-employee)

## Körtidsmiljö och säkerhet

- Behållare: Systemet tillhandahåller en säker DOM-behållare `ctx.element` (ElementProxy) för skriptet, vilket endast påverkar det aktuella blocket och inte stör andra delar av sidan.
- Sandlåda: Skriptet körs i en kontrollerad miljö, där `window`/`document`/`navigator` använder säkra proxyobjekt; vanliga API:er är tillgängliga medan riskfyllda beteenden begränsas.
- Omrendering: Blocket återrenderas automatiskt när det visas igen efter att ha varit dolt (för att undvika upprepad körning vid första montering).

## Vanliga användningsområden (精简示例)

### 1) Rendera React (JSX)

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

### 2) API-förfrågningsmall

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Ladda ECharts och rendera

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

### 4) Öppna vy (låda)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Resursläsning och rendering av JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## 注意事项

- Det rekommenderas att använda betrodda CDN:er för laddning av externa bibliotek.
- Råd för användning av väljare: Prioritera användning av `class` eller `[name=...]`-attributväljare; undvik att använda fasta `id` för att förhindra att dubbla `id` i flera block/popuper leder till stil- eller händelsekonflikter.
- Rensning av händelser: Blocket kan återrenderas flera gånger. Innan händelser binds bör de rensas eller dedupliceras för att undvika upprepad utlösning. Ni kan använda metoden "ta bort först, lägg sedan till", engångslyssnare eller markörer för att förhindra dubbletter.

## Relaterade dokument

- [Variabler och kontext](/interface-builder/variables)
- [Kopplingsregler](/interface-builder/linkage-rule)
- [Vyer och popuper](/interface-builder/actions/types/view)