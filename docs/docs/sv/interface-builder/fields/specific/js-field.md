:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# JS Field

## Introduktion

JS Field används för att anpassa rendering av innehåll på en fältposition med JavaScript. Det används ofta i detaljblock, skrivskyddade objekt i formulär eller som ”Andra anpassade objekt” i tabellkolumner. Det är lämpligt för personliga visningar, kombination av härledd information, rendering av statusbrickor, rik text eller diagram.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typer

- Skrivskyddad: Används för icke-redigerbar visning och läser `ctx.value` för att rendera utdata.
- Redigerbar: Används för anpassade inmatningsinteraktioner. Den tillhandahåller `ctx.getValue()`/`ctx.setValue(v)` och en behållarhändelse `js-field:value-change` för att underlätta tvåvägssynkronisering med formulärvärden.

## Användningsområden

- Skrivskyddad
  - Detaljblock: Visa skrivskyddat innehåll som beräkningsresultat, statusbrickor, rik text-utdrag, diagram, etc.
  - Tabellblock: Används som ”Andra anpassade kolumner > JS Field” för skrivskyddad visning (om du behöver en kolumn som inte är bunden till ett fält, använd JS Column).

- Redigerbar
  - Formulärblock (CreateForm/EditForm): Används för anpassade inmatningskontroller eller sammansatta inmatningar, som valideras och skickas med formuläret.
  - Lämplig för scenarier som: inmatningskomponenter från externa bibliotek, rik text-/kodredigerare, komplexa dynamiska komponenter, etc.

## Körtidskontext API

JS Field-körtidskoden kan direkt använda följande kontextfunktioner:

- `ctx.element`: Fältets DOM-behållare (ElementProxy), som stöder `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.value`: Aktuellt fältvärde (skrivskyddat).
- `ctx.record`: Aktuellt postobjekt (skrivskyddat).
- `ctx.collection`: Metainformation för den samling som fältet tillhör (skrivskyddat).
- `ctx.requireAsync(url)`: Laddar asynkront ett AMD/UMD-bibliotek via URL.
- `ctx.importAsync(url)`: Importerar dynamiskt en ESM-modul via URL.
- `ctx.openView(options)`: Öppnar en konfigurerad vy (popup/låda/sida).
- `ctx.i18n.t()` / `ctx.t()`: Internationalisering.
- `ctx.onRefReady(ctx.ref, cb)`: Rendera efter att behållaren är redo.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Inbyggda React, ReactDOM, Ant Design, Ant Design-ikoner och dayjs-bibliotek för JSX-rendering och tidsbehandling. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls för kompatibilitet.)
- `ctx.render(vnode)`: Rendrar ett React-element, HTML-sträng eller DOM-nod till standardbehållaren `ctx.element`. Upprepad rendering kommer att återanvända Root och skriva över befintligt innehåll i behållaren.

Specifikt för redigerbar typ (JSEditableField):

- `ctx.getValue()`: Hämta aktuellt formulärvärde (prioriterar formulärstatus, faller sedan tillbaka på fältets props).
- `ctx.setValue(v)`: Ställ in formulärvärdet och fältets props, bibehåll tvåvägssynkronisering.
- Behållarhändelse `js-field:value-change`: Utlöses när ett externt värde ändras, vilket gör det enkelt för skriptet att uppdatera inmatningsvisningen.

## Redigerare och kodsnuttar

JS Field-skriptredigeraren stöder syntaxmarkering, felmeddelanden och inbyggda kodsnuttar (Snippets).

- `Snippets`: Öppnar en lista över inbyggda kodsnuttar, som kan sökas och infogas vid den aktuella markörpositionen med ett klick.
- `Run`: Kör den aktuella koden direkt. Körningsloggen visas i `Logs`-panelen längst ner, med stöd för `console.log/info/warn/error` och felmarkering för enkel lokalisering.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Ni kan också generera kod med AI-medarbetaren:

- [AI-medarbetare · Nathan: Frontend-utvecklare](/ai-employees/built-in/ai-coding)

## Vanliga användningsområden

### 1) Grundläggande rendering (läsa fältvärde)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Använda JSX för att rendera en React-komponent

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Ladda tredjepartsbibliotek (AMD/UMD eller ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Klicka för att öppna en popup/låda (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Visa detaljer</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Redigerbar inmatning (JSEditableFieldModel)

```js
// Rendera en enkel inmatning med JSX och synkronisera formulärvärdet
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Synkronisera inmatningen när det externa värdet ändras (valfritt)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Att tänka på

- Det rekommenderas att använda en betrodd CDN för att ladda externa bibliotek och att ha en reservlösning för misslyckade scenarier (t.ex. `if (!lib) return;`).
- Det rekommenderas att prioritera användningen av `class` eller `[name=...]` för väljare och att undvika att använda fasta `id`:n för att förhindra dubbla `id`:n i flera block eller popup-fönster.
- Händelsestädning: Ett fält kan renderas om flera gånger på grund av dataändringar eller vyväxlingar. Innan en händelse binds bör ni rensa eller deduplicera den för att undvika upprepade utlösningar. Ni kan ”först ta bort, sedan lägga till”.