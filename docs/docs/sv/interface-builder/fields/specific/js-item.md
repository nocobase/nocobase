:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Introduktion

JS Item används för "anpassade objekt" i formulär (ej fältbundna). Ni kan använda JavaScript/JSX för att rendera valfritt innehåll (tips, statistik, förhandsvisning, knappar etc.) och interagera med formulär- och postkontext, vilket lämpar sig för scenarier som realtidsförhandsvisning, instruktioner, små interaktiva komponenter etc.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Körtidskontext-API (vanliga)

- `ctx.element`: DOM-behållare (ElementProxy) för det aktuella objektet, stöder `innerHTML`, `querySelector`, `addEventListener` etc.;
- `ctx.form`: AntD Form-instans, kan använda `getFieldValue / getFieldsValue / setFieldsValue / validateFields` etc.;
- `ctx.blockModel`: Modell för det formulärblock den tillhör, kan lyssna på `formValuesChange` för att implementera länkning;
- `ctx.record` / `ctx.collection`: Aktuell post och samlingsmetadata (tillgängligt i vissa scenarier);
- `ctx.requireAsync(url)`: Ladda AMD/UMD-bibliotek asynkront via URL;
- `ctx.importAsync(url)`: Importera ESM-moduler dynamiskt via URL;
- `ctx.openView(viewUid, options)`: Öppna en konfigurerad vy (låda/dialog/sida);
- `ctx.message` / `ctx.notification`: Globala tips och aviseringar;
- `ctx.t()` / `ctx.i18n.t()`: Internationalisering;
- `ctx.onRefReady(ctx.ref, cb)`: Rendera efter att behållaren är redo;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Inbyggda bibliotek som React / ReactDOM / Ant Design / Ant Design-ikoner / dayjs / lodash / math.js / formula.js för JSX-rendering, tidshantering, datamanipulering och matematiska beräkningar. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls för kompatibilitet.)
- `ctx.render(vnode)`: Renderar React-element/HTML/DOM till standardbehållaren `ctx.element`; upprepade renderingar återanvänder Root och skriver över behållarens befintliga innehåll.

## Redigerare och kodsnuttar

- `Snippets`: Öppnar en lista med inbyggda kodsnuttar som kan sökas och infogas vid markören med ett klick.
- `Run`: Kör den aktuella koden direkt och visar körningsloggar i `Logs`-panelen längst ner; stöder `console.log/info/warn/error` och felmarkering.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Kan kombineras med AI-medarbetare för att generera/modifiera skript: [AI-medarbetare · Nathan: Frontend-ingenjör](/ai-employees/features/built-in-employee)

## Vanlig användning (förenklade exempel)

### 1) Realtidsförhandsvisning (läsa formulärvärden)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Öppna vy (låda)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Ladda externa bibliotek och rendera

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## 注意事项 (Observera)

- För laddning av externa bibliotek rekommenderas användning av betrodda CDN, och felhantering bör förberedas (t.ex. `if (!lib) return;`).
- För selektorer rekommenderas i första hand `class` eller `[name=...]`. Undvik fasta `id` för att förhindra dubbletter i flera block eller popup-fönster.
- Rensa händelser: Frekventa ändringar i formulärvärden triggar flera renderingar. Innan händelser binds bör de rensas eller dedupliceras (t.ex. `remove` före `add`, använda `{ once: true }` eller markera med `dataset`).

## Relaterad dokumentation

- [Variabler och kontext](/interface-builder/variables)
- [Länkningsregler](/interface-builder/linkage-rule)
- [Vyer och popup-fönster](/interface-builder/actions/types/view)