:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Introduktion

JS Field används för att anpassa rendering av innehåll på en fältposition med JavaScript, vilket är vanligt förekommande i detaljblock, skrivskyddade objekt i formulär eller som ”Andra anpassade objekt” i tabellkolumner. Det är lämpligt för personlig visning, kombination av härledd information, statusbrickor, rik text eller diagram.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typer

- Skrivskyddad typ: Används för icke-redigerbar visning, läser `ctx.value` för att rendera utdata.
- Redigerbar typ: Används för anpassade inmatningsinteraktioner, tillhandahåller `ctx.getValue()`/`ctx.setValue(v)` och behållarhändelsen `js-field:value-change`, vilket underlättar tvåvägssynkronisering med formulärvärden.

## Användningsområden

- Skrivskyddad typ
  - Detaljblock: Visa skrivskyddat innehåll som beräkningsresultat, statusbrickor, rik text-utdrag, diagram, etc.;
  - Tabellblock: Används som ”Andra anpassade kolumner > JS Field” för skrivskyddad visning (om ni behöver en kolumn som inte är bunden till ett fält, använd JS Column);

- Redigerbar typ
  - Formulärblock (CreateForm/EditForm): Används för anpassade inmatningskontroller eller sammansatta inmatningar, som valideras och skickas med formuläret;
  - Lämpliga scenarier: inmatningskomponenter från externa bibliotek, rik text-/kodredigerare, komplexa dynamiska komponenter, etc.;

## Körtidskontext API

JS Field-körtidskoden kan direkt använda följande kontextfunktioner:

- `ctx.element`: Fältets DOM-behållare (ElementProxy), stöder `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.value`: Aktuellt fältvärde (skrivskyddat);
- `ctx.record`: Aktuellt postobjekt (skrivskyddat);
- `ctx.collection`: Metainformation för den samling som fältet tillhör (skrivskyddat);
- `ctx.requireAsync(url)`: Laddar asynkront ett AMD/UMD-bibliotek via URL;
- `ctx.importAsync(url)`: Importerar dynamiskt en ESM-modul via URL;
- `ctx.openView(options)`: Öppnar en konfigurerad vy (popup/låda/sida);
- `ctx.i18n.t()` / `ctx.t()`: Internationalisering;
- `ctx.onRefReady(ctx.ref, cb)`: Rendera efter att behållaren är redo;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Inbyggda React / ReactDOM / Ant Design / Ant Design-ikoner / dayjs / lodash / math.js / formula.js och andra universella bibliotek för JSX-rendering, tidsbehandling, datamanipulering och matematiska beräkningar. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` behålls fortfarande för kompatibilitet.)
- `ctx.render(vnode)`: Rendrar ett React-element, en HTML-sträng eller en DOM-nod till standardbehållaren `ctx.element`; upprepad rendering kommer att återanvända Root och skriva över behållarens befintliga innehåll.

Specifikt för redigerbar typ (JSEditableField):

- `ctx.getValue()`: Hämtar aktuellt formulärvärde (prioriterar formulärstatus, faller sedan tillbaka på fältets props).
- `ctx.setValue(v)`: Ställer in formulärvärdet och fältets props, bibehåller tvåvägssynkronisering.
- Behållarhändelse `js-field:value-change`: Utlöses när ett externt värde ändras, vilket gör det enkelt för skriptet att uppdatera inmatningsvisningen.

## Redigerare och kodsnuttar

JS Field-skriptredigeraren stöder syntaxmarkering, felmeddelanden och inbyggda kodsnuttar (Snippets).

- `Snippets`: Öppnar en lista över inbyggda kodsnuttar, som kan sökas och infogas vid den aktuella markörpositionen med ett klick.
- `Run`: Kör den aktuella koden direkt. Körningsloggen visas i `Logs`-panelen längst ner, med stöd för `console.log/info/warn/error` och felmarkering för enkel lokalisering.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Kan kombineras med AI-medarbetare för att generera kod:

- [AI-medarbetare · Nathan: Frontend-ingenjör](/ai-employees/features/built-in-employee)

## Vanliga användningsområden

### 1) Grundläggande rendering (läsa fältvärde)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Använda JSX för att rendera React-komponenter

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

### 4) Klicka för att öppna popup/låda (openView)

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

## Observera

- Det rekommenderas att använda en betrodd CDN för att ladda externa bibliotek och att ha en reservlösning för misslyckade scenarier (t.ex. `if (!lib) return;`).
- Det rekommenderas att prioritera användningen av `class` eller `[name=...]` för väljare och att undvika att använda fasta `id`:n för att förhindra dubbla `id`:n i flera block eller popup-fönster.
- Händelsestädning: Fältet kan renderas om flera gånger på grund av dataändringar eller vyväxlingar. Innan en händelse binds bör ni rensa eller deduplicera den för att undvika upprepade utlösningar. Ni kan ”först ta bort, sedan lägga till”.