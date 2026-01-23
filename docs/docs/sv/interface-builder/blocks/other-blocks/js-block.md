:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# JS Block

## Introduktion

JS Block är ett mycket flexibelt "anpassat renderingsblock" som låter dig skriva JavaScript-skript direkt för att generera gränssnitt, binda händelser, anropa data-API:er eller integrera tredjepartsbibliotek. Det är idealiskt för personliga visualiseringar, tillfälliga experiment och lätta utökningar som är svåra att uppnå med inbyggda block.

## API för körtidskontext

JS Blockets körtidskontext har vanliga funktioner injicerade och kan användas direkt:

- `ctx.element`: Blockets DOM-behållare (säkert inkapslad som ElementProxy), med stöd för `innerHTML`, `querySelector`, `addEventListener` med mera;
- `ctx.requireAsync(url)`: Laddar asynkront ett AMD/UMD-bibliotek via URL;
- `ctx.importAsync(url)`: Importerar dynamiskt en ESM-modul via URL;
- `ctx.openView`: Öppnar en konfigurerad vy (popup/låda/sida);
- `ctx.useResource(...)` + `ctx.resource`: Åtkomst till data som en resurs;
- `ctx.i18n.t()` / `ctx.t()`: Inbyggd internationaliseringsfunktion;
- `ctx.onRefReady(ctx.ref, cb)`: Renderar när behållaren är redo för att undvika tidsproblem;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Inbyggda generella bibliotek som React, ReactDOM, Ant Design, Ant Design-ikoner och dayjs, för JSX-rendering och tidshantering. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls för kompatibilitet.)
- `ctx.render(vnode)`: Renderar ett React-element, HTML-sträng eller DOM-nod till standardbehållaren `ctx.element`. Flera anrop återanvänder samma React Root och skriver över behållarens befintliga innehåll.

## Lägga till ett block

Ni kan lägga till ett JS Block på en sida eller i en popup.

![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Redigerare och kodsnuttar

JS Blockets skriptredigerare stöder syntaxmarkering, felmeddelanden och inbyggda kodsnuttar (Snippets), vilket gör att ni snabbt kan infoga vanliga exempel, som rendering av diagram, bindning av knapphändelser, laddning av externa bibliotek, rendering av React/Vue-komponenter, tidslinjer, informationskort med mera.

- `Snippets`: Öppnar listan över inbyggda kodsnuttar. Ni kan söka och infoga en vald snutt i kodredigeraren vid den aktuella markörpositionen med ett klick.
- `Run`: Kör koden direkt i den aktuella redigeraren och matar ut körloggarna till `Logs`-panelen längst ner. Den stöder visning av `console.log/info/warn/error`, och fel kommer att markeras med länkar till den specifika raden och kolumnen.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Dessutom kan ni direkt kalla på AI-medarbetaren "Frontend Engineer · Nathan" från redigerarens övre högra hörn. Han kan hjälpa er att skriva eller modifiera skript baserat på den aktuella kontexten. Ni kan sedan "Apply to editor" med ett klick och köra koden för att se effekten. För mer information, se:

- [AI-medarbetare · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Körtidsmiljö och säkerhet

- **Behållare**: Systemet tillhandahåller en säker DOM-behållare `ctx.element` (ElementProxy) för skriptet, som endast påverkar det aktuella blocket och inte stör andra delar av sidan.
- **Sandlåda**: Skriptet körs i en kontrollerad miljö. `window`/\`document\`/\`navigator\` använder säkra proxyobjekt, vilket tillåter vanliga API:er samtidigt som riskfyllda beteenden begränsas.
- **Omrendering**: Blocket återrenderas automatiskt när det döljs och sedan visas igen (för att undvika att det initiala monteringsskriptet körs flera gånger).

## Vanliga användningsområden (förenklade exempel)

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

### 4) Öppna en vy (låda)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Läs en resurs och rendera JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Att tänka på

- Det rekommenderas att använda betrodda CDN:er för att ladda externa bibliotek.
- **Råd för användning av väljare**: Prioritera att använda `class` eller `[name=...]\`-attributväljare. Undvik att använda fasta `id`:n för att förhindra konflikter från dubbla `id`:n när flera block eller popuper används, vilket kan leda till stil- eller händelsekonflikter.
- **Rensning av händelser**: Eftersom blocket kan återrenderas flera gånger bör händelselyssnare rensas eller dedupliceras innan de binds för att undvika upprepade utlösningar. Ni kan använda en "ta bort sedan lägg till"-metod, en engångslyssnare eller en flagga för att förhindra dubbletter.

## Relaterade dokument

- [Variabler och kontext](/interface-builder/variables)
- [Kopplingsregler](/interface-builder/linkage-rule)
- [Vyer och popuper](/interface-builder/actions/types/view)