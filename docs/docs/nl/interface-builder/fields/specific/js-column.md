:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# JS Column

## Introductie

De JS Column wordt gebruikt voor 'aangepaste kolommen' in tabellen, waarbij de inhoud van elke cel in een rij wordt gerenderd met JavaScript. Het is niet gekoppeld aan een specifiek veld en is geschikt voor scenario's zoals afgeleide kolommen, gecombineerde weergaven van meerdere velden, statusbadges, actieknoppen en het aggregeren van externe gegevens.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## Runtime Context API

Bij het renderen van elke cel biedt de JS Column de volgende context API's:

- `ctx.element`: De DOM-container van de huidige cel (ElementProxy), die `innerHTML`, `querySelector`, `addEventListener` en meer ondersteunt.
- `ctx.record`: Het recordobject van de huidige rij (alleen-lezen).
- `ctx.recordIndex`: De rij-index binnen de huidige pagina (begint bij 0, kan beïnvloed worden door paginering).
- `ctx.collection`: De metadata van de **collectie** die aan de tabel is gekoppeld (alleen-lezen).
- `ctx.requireAsync(url)`: Laadt asynchroon een AMD/UMD-bibliotheek via URL.
- `ctx.importAsync(url)`: Importeert dynamisch een ESM-module via URL.
- `ctx.openView(options)`: Opent een geconfigureerde weergave (modaal venster/lade/pagina).
- `ctx.i18n.t()` / `ctx.t()`: Internationalisatie.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert nadat de container gereed is.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Ingebouwde bibliotheken zoals React, ReactDOM, Ant Design, Ant Design-pictogrammen en dayjs voor JSX-rendering en datum-/tijdhulpprogramma's. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` blijven behouden voor compatibiliteit.)
- `ctx.render(vnode)`: Rendert een React-element/HTML/DOM naar de standaardcontainer `ctx.element` (de huidige cel). Meerdere renders zullen de Root hergebruiken en de bestaande inhoud van de container overschrijven.

## Editor en Snippets

De scripteditor voor JS Column ondersteunt syntaxismarkering, foutmeldingen en ingebouwde codefragmenten (snippets).

- `Snippets`: Opent de lijst met ingebouwde codefragmenten, waarmee u deze kunt zoeken en met één klik op de huidige cursorpositie kunt invoegen.
- `Run`: Voert de huidige code direct uit. Het uitvoeringslogboek wordt weergegeven in het `Logs`-paneel onderaan, met ondersteuning voor `console.log/info/warn/error` en foutmarkering.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

U kunt ook een AI-medewerker gebruiken om code te genereren:

- [AI-medewerker · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Veelvoorkomend Gebruik

### 1) Basis Rendering (Lezen van het huidige rijrecord)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) JSX gebruiken om React-componenten te renderen

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

### 3) Een modaal venster/lade openen vanuit een cel (Bekijken/Bewerken)

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
  }}>Bekijken</a>
);
```

### 4) Externe bibliotheken laden (AMD/UMD of ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Aandachtspunten

- Het wordt aanbevolen om een betrouwbare CDN te gebruiken voor het laden van externe bibliotheken en om een fallback te voorzien voor foutscenario's (bijv. `if (!lib) return;`).
- Het is raadzaam om `class`- of `[name=...]`-selectors te gebruiken in plaats van vaste `id`'s, om dubbele `id`'s in meerdere blokken of modale vensters te voorkomen.
- Opschonen van gebeurtenissen: Tabelrijen kunnen dynamisch veranderen door paginering of verversen, waardoor cellen meerdere keren opnieuw worden gerenderd. U dient gebeurtenislisteners op te schonen of te ontdubbelen voordat u ze bindt, om herhaalde triggers te voorkomen.
- Prestatietip: Vermijd het herhaaldelijk laden van grote bibliotheken in elke cel. Cache de bibliotheek in plaats daarvan op een hoger niveau (bijv. via een globale of tabelvariabele) en hergebruik deze.