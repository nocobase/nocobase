:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Introduktion

JS Column används för "anpassade kolumner" i tabeller och renderar innehållet i varje rads cell via JavaScript. Den är inte bunden till ett specifikt fält och passar för scenarier som härledda kolumner, kombinerade visningar över fält, statusbrickor, knappåtgärder, aggregering av fjärrdata etc.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Körtidskontext-API

När varje cell i JS Column renderas kan följande kontextfunktioner användas:

- `ctx.element`: Den aktuella cellens DOM-behållare (ElementProxy), stöder `innerHTML`, `querySelector`, `addEventListener` etc.;
- `ctx.record`: Den aktuella radens postobjekt (skrivskyddat);
- `ctx.recordIndex`: Radindex inom den aktuella sidan (börjar från 0, kan påverkas av paginering);
- `ctx.collection`: Metainformation för den **samling** som är bunden till tabellen (skrivskyddad);
- `ctx.requireAsync(url)`: Laddar asynkront AMD/UMD-bibliotek via URL;
- `ctx.importAsync(url)`: Importerar dynamiskt ESM-moduler via URL;
- `ctx.openView(options)`: Öppnar en konfigurerad vy (modal/låda/sida);
- `ctx.i18n.t()` / `ctx.t()`: Internationalisering;
- `ctx.onRefReady(ctx.ref, cb)`: Renderar efter att behållaren är redo;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Inbyggda React / ReactDOM / Ant Design / Ant Design-ikoner / dayjs / lodash / math.js / formula.js och andra universella bibliotek för JSX-rendering, tidshantering, datamanipulering och matematiska beräkningar. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls fortfarande för kompatibilitet.)
- `ctx.render(vnode)`: Renderar React-element/HTML/DOM till standardbehållaren `ctx.element` (den aktuella cellen). Flera renderingar återanvänder Root och skriver över behållarens befintliga innehåll.

## Redigerare och kodsnuttar

Skriptredigeraren för JS Column stöder syntaxmarkering, felmeddelanden och inbyggda kodsnuttar (Snippets).

- `Snippets`: Öppnar listan över inbyggda kodsnuttar, sök och infoga vid den aktuella markörpositionen med ett klick.
- `Run`: Kör den aktuella koden direkt, körningsloggen matas ut i `Logs`-panelen längst ner, stöder `console.log/info/warn/error` och felmarkering med positionering.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Kan kombineras med AI-medarbetare för att generera kod:

- [AI-medarbetare · Nathan: Frontend-ingenjör](/ai-employees/features/built-in-employee)

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

### 3) Öppna modal/låda i en cell (visa/redigera)

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

## Observera

- Vi rekommenderar att ni använder en betrodd CDN för att ladda externa bibliotek och att ni har en reservlösning för felscenarier (t.ex. `if (!lib) return;`).
- Vi rekommenderar att ni prioriterar `class` eller `[name=...]` som väljare och undviker fasta `id`:n för att förhindra dubbla `id`:n i flera block eller modaler.
- Rensa händelser: Tabellrader kan ändras dynamiskt vid paginering eller uppdatering, och celler renderas flera gånger. Innan ni binder händelser bör ni rensa eller ta bort dubbletter för att undvika upprepade utlösningar.
- Prestandatips: Undvik att ladda stora bibliotek upprepade gånger i varje cell. Ni bör cachelagra biblioteket på en högre nivå (t.ex. via en global variabel eller variabel på tabellnivå) och sedan återanvända det.