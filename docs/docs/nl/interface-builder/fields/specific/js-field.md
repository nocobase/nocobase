:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/fields/specific/js-field) voor nauwkeurige informatie.
:::

# JS Field

## Introductie

JS Field wordt gebruikt om inhoud op een veldpositie aan te passen met JavaScript. Het komt vaak voor in detailblokken, alleen-lezen items in formulieren of als "Andere aangepaste items" in tabelkolommen. Het is geschikt voor gepersonaliseerde weergaven, het combineren van afgeleide informatie, statusbadges, rich text of grafieken.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Typen

- Alleen-lezen type: Gebruikt voor niet-bewerkbare weergave, leest `ctx.value` om de uitvoer te renderen.
- Bewerkbaar type: Gebruikt voor aangepaste invoerinteracties, biedt `ctx.getValue()`/`ctx.setValue(v)` en een containerevenement `js-field:value-change`, om tweerichtingssynchronisatie met formulierwaarden te vergemakkelijken.

## Gebruiksscenario's

- Alleen-lezen type
  - Detailblok: Toont berekeningsresultaten, statusbadges, rich text-fragmenten, grafieken en andere alleen-lezen inhoud;
  - Tabelblok: Gebruikt als "Andere aangepaste kolom > JS Field" voor alleen-lezen weergave (gebruik JS Column als u een kolom nodig heeft die niet aan een veld is gebonden);

- Bewerkbaar type
  - Formulierblok (CreateForm/EditForm): Gebruikt voor aangepaste invoerregelaars of samengestelde invoer, die worden gevalideerd en ingediend met het formulier;
  - Geschikte scenario's: invoercomponenten van externe bibliotheken, rich text-/code-editors, complexe dynamische componenten, enz.;

## Runtime Context API

De runtimecode van de JS Field kan direct de volgende contextmogelijkheden gebruiken:

- `ctx.element`: De DOM-container van het veld (ElementProxy), ondersteunt `innerHTML`, `querySelector`, `addEventListener`, enz.;
- `ctx.value`: De huidige veldwaarde (alleen-lezen);
- `ctx.record`: Het huidige recordobject (alleen-lezen);
- `ctx.collection`: Meta-informatie van de collectie waartoe het veld behoort (alleen-lezen);
- `ctx.requireAsync(url)`: Laadt asynchroon een AMD/UMD-bibliotheek via URL;
- `ctx.importAsync(url)`: Importeert dynamisch een ESM-module via URL;
- `ctx.openView(options)`: Opent een geconfigureerde weergave (pop-up/lade/pagina);
- `ctx.i18n.t()` / `ctx.t()`: Internationalisatie;
- `ctx.onRefReady(ctx.ref, cb)`: Rendert nadat de container gereed is;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Ingebouwde React / ReactDOM / Ant Design / Ant Design-pictogrammen / dayjs / lodash / math.js / formula.js en andere algemene bibliotheken voor JSX-rendering, tijdsverwerking, gegevensbewerking en wiskundige berekeningen. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` blijven behouden voor compatibiliteit.)
- `ctx.render(vnode)`: Rendert een React-element, HTML-string of DOM-knooppunt in de standaardcontainer `ctx.element`; herhaaldelijk renderen hergebruikt de Root en overschrijft de bestaande inhoud van de container.

Specifiek voor het bewerkbare type (JSEditableField):

- `ctx.getValue()`: Haalt de huidige formulierwaarde op (geeft prioriteit aan de formulierstatus, valt dan terug op veldprops).
- `ctx.setValue(v)`: Stelt de formulierwaarde en veldprops in, waarbij tweerichtingssynchronisatie behouden blijft.
- Containerevenement `js-field:value-change`: Geactiveerd wanneer een externe waarde verandert, wat het bijwerken van de invoerweergave via script vergemakkelijkt.

## Editor en Snippets

De scripteditor van de JS Field ondersteunt syntaxismarkering, foutmeldingen en ingebouwde codefragmenten (Snippets).

- `Snippets`: Opent de lijst met ingebouwde codefragmenten, die u kunt doorzoeken en met één klik op de huidige cursorpositie kunt invoegen.
- `Run`: Voert de huidige code direct uit, de uitvoeringslogboeken worden onderaan in het `Logs`-paneel weergegeven, ondersteunt `console.log/info/warn/error` en foutmarkering voor lokalisatie.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Kan worden gecombineerd met AI-medewerkers om code te genereren:

- [AI-medewerker · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Veelvoorkomend gebruik

### 1) Basisrendering (veldwaarde lezen)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) JSX gebruiken om React-componenten te renderen

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

### 4) Klikken om pop-up/lade te openen (openView)

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

## 注意事项

- Het wordt aanbevolen om een betrouwbare CDN te gebruiken voor het laden van externe bibliotheken en om een fallback te voorzien voor scenario's waarin het laden mislukt (bijv. `if (!lib) return;`).
- Het wordt aanbevolen om bij voorkeur `class` of `[name=...]` te gebruiken voor selectors en vaste `id`'s te vermijden om dubbele `id`'s in meerdere blokken/pop-ups te voorkomen.
- Gebeurtenisopschoning: Een veld kan meerdere keren opnieuw worden gerenderd door gegevenswijzigingen of weergavewisselingen. Voordat u een gebeurtenis bindt, moet u deze opschonen of dedupliceren om herhaalde triggers te voorkomen. U kunt "eerst verwijderen, dan toevoegen".