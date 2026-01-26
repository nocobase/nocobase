:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# JS-kolumn

## Introduktion

JS-kolumnen används för "anpassade kolumner" i tabeller och renderar innehållet i varje rads cell med JavaScript. Den är inte bunden till ett specifikt fält och passar för scenarier som härledda kolumner, kombinerade visningar över flera fält, statusbrickor, åtgärdsknappar och aggregering av fjärrdata.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Körtidskontext-API

När varje cell renderas tillhandahåller JS-kolumnen följande kontext-API:er:

-   `ctx.element`: DOM-behållaren för den aktuella cellen (ElementProxy), med stöd för `innerHTML`, `querySelector`, `addEventListener` med mera.
-   `ctx.record`: Det aktuella radobjektet (skrivskyddat).
-   `ctx.recordIndex`: Radindex inom den aktuella sidan (börjar från 0, kan påverkas av paginering).
-   `ctx.collection`: Metainformationen för den **samling** som är bunden till tabellen (skrivskyddad).
-   `ctx.requireAsync(url)`: Laddar asynkront ett AMD/UMD-bibliotek via URL.
-   `ctx.importAsync(url)`: Importerar dynamiskt en ESM-modul via URL.
-   `ctx.openView(options)`: Öppnar en konfigurerad vy (modal/låda/sida).
-   `ctx.i18n.t()` / `ctx.t()`: Internationalisering.
-   `ctx.onRefReady(ctx.ref, cb)`: Renderar när behållaren är redo.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Inbyggda bibliotek som React, ReactDOM, Ant Design, Ant Design-ikoner och dayjs för JSX-rendering och tidsbehandling. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls för kompatibilitet.)
-   `ctx.render(vnode)`: Renderar ett React-element/HTML/DOM till standardbehållaren `ctx.element` (den aktuella cellen). Flera renderingar återanvänder Root och skriver över befintligt innehåll i behållaren.

## Redigerare och kodsnuttar

Skriptredigeraren för JS-kolumnen stöder syntaxmarkering, felmeddelanden och inbyggda kodsnuttar (Snippets).

-   `Snippets`: Öppnar listan över inbyggda kodsnuttar, så att ni kan söka och infoga dem vid den aktuella markörpositionen med ett klick.
-   `Run`: Kör den aktuella koden direkt. Körningsloggen visas i `Logs`-panelen längst ner, med stöd för `console.log/info/warn/error` och felmarkering.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Ni kan också använda en AI-medarbetare för att generera kod:

-   [AI-medarbetare · Nathan: Frontendutvecklare](/ai-employees/built-in/ai-coding)

## Vanliga användningsområden

### 1) Grundläggande rendering (läsa den aktuella radposten)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Använda JSX för att rendera React-komponenter

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

### 3) Öppna en modal/låda från en cell (visa/redigera)

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
  }}>Visa</a>
);
```

### 4) Ladda tredjepartsbibliotek (AMD/UMD eller ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Att tänka på

-   Vi rekommenderar att ni använder en betrodd CDN för att ladda externa bibliotek och att ni har en reservlösning för felscenarier (t.ex. `if (!lib) return;`).
-   Vi rekommenderar att ni använder `class`- eller `[name=...]`-väljare istället för fasta `id`:n för att förhindra dubbla `id`:n över flera block eller modaler.
-   Rensa upp händelser: Tabellrader kan ändras dynamiskt vid paginering eller uppdatering, vilket gör att celler renderas om flera gånger. Ni bör rensa upp eller ta bort dubbletter av händelselyssnare innan ni binder dem för att undvika upprepade utlösningar.
-   Prestandatips: Undvik att ladda stora bibliotek upprepade gånger i varje cell. Cachea istället biblioteket på en högre nivå (t.ex. med en global eller tabellnivåvariabel) och återanvänd det.