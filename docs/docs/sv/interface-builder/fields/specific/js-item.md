:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# JS Item

## Introduktion

JS Item används för "anpassade objekt" (som inte är kopplade till ett fält) i ett formulär. Ni kan använda JavaScript/JSX för att rendera valfritt innehåll (som tips, statistik, förhandsvisningar, knappar, etc.) och interagera med formuläret och postens kontext. Det passar bra för scenarier som realtidsförhandsvisningar, instruktionsmeddelanden och små interaktiva komponenter.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Körtidskontext-API (vanligt förekommande)

- `ctx.element`: DOM-behållaren (ElementProxy) för det aktuella objektet, med stöd för `innerHTML`, `querySelector`, `addEventListener`, med mera.
- `ctx.form`: AntD Form-instansen, som tillåter operationer som `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, med mera.
- `ctx.blockModel`: Modellen för det formulärblock den tillhör, som kan lyssna på `formValuesChange` för att implementera länkning.
- `ctx.record` / `ctx.collection`: Den aktuella posten och samlingsmetadata (tillgängligt i vissa scenarier).
- `ctx.requireAsync(url)`: Laddar asynkront ett AMD/UMD-bibliotek via URL.
- `ctx.importAsync(url)`: Importerar dynamiskt en ESM-modul via URL.
- `ctx.openView(viewUid, options)`: Öppnar en konfigurerad vy (låda/dialog/sida).
- `ctx.message` / `ctx.notification`: Globala meddelanden och notifikationer.
- `ctx.t()` / `ctx.i18n.t()`: Internationalisering.
- `ctx.onRefReady(ctx.ref, cb)`: Renderar när behållaren är redo.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Inbyggda bibliotek som React, ReactDOM, Ant Design, Ant Design-ikoner och dayjs, för JSX-rendering och datum/tid-hantering. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls för kompatibilitet.)
- `ctx.render(vnode)`: Renderar ett React-element/HTML/DOM till standardbehållaren `ctx.element`. Flera renderingar återanvänder Root och skriver över behållarens befintliga innehåll.

## Redigerare och kodsnuttar

- `Snippets`: Öppnar en lista med inbyggda kodsnuttar, så att ni kan söka och infoga dem vid den aktuella markörpositionen med ett klick.
- `Run`: Kör den aktuella koden direkt och matar ut körningsloggarna till `Logs`-panelen längst ner. Den stöder `console.log/info/warn/error` och felmarkering.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Kan användas med AI-medarbetare för att generera/modifiera skript: [AI-medarbetare · Nathan: Frontendutvecklare](/ai-employees/built-in/ai-coding)

## Vanliga användningsområden (förenklade exempel)

### 1) Förhandsvisning i realtid (läsa formulärvärden)

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

### 2) Öppna en vy (låda)

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

### 3) Ladda och rendera externa bibliotek

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Att tänka på

- Vi rekommenderar att ni använder en betrodd CDN för att ladda externa bibliotek, och att ni har en reservlösning för misslyckade scenarier (t.ex. `if (!lib) return;`).
- Vi rekommenderar att ni prioriterar att använda `class` eller `[name=...]` för väljare och undviker att använda fasta `id`:n för att förhindra dubbla `id`:n i flera block/popup-fönster.
- Händelserengöring: Frekventa ändringar i formulärvärden kommer att trigga flera renderingar. Innan en händelse binds bör den rensas eller dedupliceras (t.ex. `remove` före `add`, använd `{ once: true }`, eller använd ett `dataset`-attribut för att förhindra dubbletter).

## Relaterad dokumentation

- [Variabler och kontext](/interface-builder/variables)
- [Kopplingsregler](/interface-builder/linkage-rule)
- [Vyer och popup-fönster](/interface-builder/actions/types/view)