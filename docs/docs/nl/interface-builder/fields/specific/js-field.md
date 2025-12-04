:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# JS Field

## Introductie

De JS Field wordt gebruikt om inhoud op een veldpositie aan te passen en te renderen met JavaScript. U vindt deze vaak in detailblokken, als alleen-lezen items in formulieren, of als "Andere aangepaste items" in tabelkolommen. Het is ideaal voor gepersonaliseerde weergaven, het combineren van afgeleide informatie, het weergeven van statusbadges, rich text of grafieken.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typen

- Alleen-lezen: Wordt gebruikt voor niet-bewerkbare weergave en leest `ctx.value` om de uitvoer te renderen.
- Bewerkbaar: Wordt gebruikt voor aangepaste invoerinteracties. Het biedt `ctx.getValue()`/`ctx.setValue(v)` en een containerevenement `js-field:value-change` om tweerichtingssynchronisatie met formulierwaarden te vergemakkelijken.

## Gebruiksscenario's

- Alleen-lezen
  - Detailblok: Toont alleen-lezen inhoud zoals berekeningsresultaten, statusbadges, rich text-fragmenten, grafieken, enz.
  - Tabelblok: Wordt gebruikt als "Andere aangepaste kolom > JS Field" voor alleen-lezen weergave (als u een kolom nodig heeft die niet aan een veld is gebonden, gebruik dan JS Column).

- Bewerkbaar
  - Formulierblok (CreateForm/EditForm): Wordt gebruikt voor aangepaste invoerbesturingselementen of samengestelde invoer, die worden gevalideerd en ingediend met het formulier.
  - Geschikt voor scenario's zoals: invoercomponenten van externe bibliotheken, rich text-/code-editors, complexe dynamische componenten, enz.

## Runtime Context API

De runtimecode van de JS Field kan direct de volgende contextmogelijkheden gebruiken:

- `ctx.element`: Het DOM-container van het veld (ElementProxy), ondersteunt `innerHTML`, `querySelector`, `addEventListener`, enz.
- `ctx.value`: De huidige veldwaarde (alleen-lezen).
- `ctx.record`: Het huidige recordobject (alleen-lezen).
- `ctx.collection`: Metadata van de collectie waartoe het veld behoort (alleen-lezen).
- `ctx.requireAsync(url)`: Laadt asynchroon een AMD/UMD-bibliotheek via URL.
- `ctx.importAsync(url)`: Importeert dynamisch een ESM-module via URL.
- `ctx.openView(options)`: Opent een geconfigureerde weergave (pop-up/lade/pagina).
- `ctx.i18n.t()` / `ctx.t()`: Internationalisatie.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert nadat de container gereed is.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Ingebouwde React, ReactDOM, Ant Design, Ant Design-pictogrammen en dayjs-bibliotheken voor JSX-rendering en datum-/tijdhulpprogramma's. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` blijven behouden voor compatibiliteit.)
- `ctx.render(vnode)`: Rendert een React-element, HTML-string of DOM-knooppunt in de standaardcontainer `ctx.element`. Herhaaldelijk renderen zal de Root hergebruiken en de bestaande inhoud van de container overschrijven.

Specifiek voor het bewerkbare type (JSEditableField):

- `ctx.getValue()`: Haalt de huidige formulierwaarde op (geeft prioriteit aan de formulierstatus, valt dan terug op veldprops).
- `ctx.setValue(v)`: Stelt de formulierwaarde en veldprops in, en handhaaft tweerichtingssynchronisatie.
- Containerevenement `js-field:value-change`: Wordt geactiveerd wanneer een externe waarde verandert, waardoor het voor het script eenvoudig is om de invoerweergave bij te werken.

## Editor en Snippets

De scripteditor van de JS Field ondersteunt syntaxismarkering, foutmeldingen en ingebouwde codefragmenten (Snippets).

- `Snippets`: Opent een lijst met ingebouwde codefragmenten, die met één klik kunnen worden gezocht en ingevoegd op de huidige cursorpositie.
- `Run`: Voert de huidige code direct uit. Het uitvoeringslogboek wordt onderaan in het `Logs`-paneel weergegeven, met ondersteuning voor `console.log/info/warn/error` en foutmarkering voor eenvoudige lokalisatie.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

U kunt ook code genereren met de AI-medewerker:

- [AI-medewerker · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Veelvoorkomend gebruik

### 1) Basisrendering (veldwaarde lezen)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) JSX gebruiken om een React-component te renderen

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Externe bibliotheken laden (AMD/UMD of ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Klikken om een pop-up/lade te openen (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Bekijk details</a>`;
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

### 5) Bewerkbare invoer (JSEditableFieldModel)

```js
// Render een eenvoudige invoer met JSX en synchroniseer de formulierwaarde
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

// Synchroniseer de invoer wanneer de externe waarde verandert (optioneel)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Opmerkingen

- Het wordt aanbevolen om een vertrouwde CDN te gebruiken voor het laden van externe bibliotheken en om een fallback te hebben voor faalscenario's (bijv. `if (!lib) return;`).
- Het wordt aanbevolen om `class` of `[name=...]` te gebruiken voor selectors en vaste `id`'s te vermijden om dubbele `id`'s in meerdere blokken of pop-ups te voorkomen.
- Gebeurtenisopschoning: Een veld kan meerdere keren opnieuw worden gerenderd als gevolg van gegevenswijzigingen of weergavewisselingen. Voordat u een gebeurtenis bindt, moet u deze opschonen of dedupliceren om herhaalde triggers te voorkomen. U kunt "eerst verwijderen en dan toevoegen".