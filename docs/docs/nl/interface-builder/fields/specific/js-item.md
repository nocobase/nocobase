:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# JS Item

## Introductie

JS Item gebruikt u voor 'aangepaste items' (niet gekoppeld aan een veld) in een formulier. U kunt JavaScript/JSX gebruiken om willekeurige inhoud weer te geven (zoals tips, statistieken, voorbeelden, knoppen, enz.) en om te communiceren met de formulier- en recordcontext. Het is ideaal voor real-time voorbeelden, instructietips en kleine interactieve componenten.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## Runtime Context API (Veelgebruikt)

- `ctx.element`: De DOM-container (ElementProxy) van het huidige item, met ondersteuning voor `innerHTML`, `querySelector`, `addEventListener`, enz.
- `ctx.form`: De AntD Form-instantie, waarmee u bewerkingen zoals `getFieldValue / getFieldsValue / setFieldsValue / validateFields` kunt uitvoeren.
- `ctx.blockModel`: Het model van het formulierblok waartoe het behoort, dat kan luisteren naar `formValuesChange` om koppelingen te implementeren.
- `ctx.record` / `ctx.collection`: De huidige record- en collectie-metadata (beschikbaar in sommige scenario's).
- `ctx.requireAsync(url)`: Laadt asynchroon een AMD/UMD-bibliotheek via URL.
- `ctx.importAsync(url)`: Importeert dynamisch een ESM-module via URL.
- `ctx.openView(viewUid, options)`: Opent een geconfigureerde weergave (lade/dialoogvenster/pagina).
- `ctx.message` / `ctx.notification`: Globale meldingen en notificaties.
- `ctx.t()` / `ctx.i18n.t()`: Internationalisering.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert nadat de container gereed is.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Ingebouwde bibliotheken zoals React, ReactDOM, Ant Design, Ant Design-iconen en dayjs, voor JSX-rendering en datum-/tijdverwerking. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` blijven behouden voor compatibiliteit.)
- `ctx.render(vnode)`: Rendert een React-element/HTML/DOM naar de standaardcontainer `ctx.element`. Meerdere renders zullen de Root hergebruiken en de bestaande inhoud van de container overschrijven.

## Editor en Snippets

- `Snippets`: Opent een lijst met ingebouwde codefragmenten, waarmee u kunt zoeken en deze met één klik op de huidige cursorpositie kunt invoegen.
- `Run`: Voert de huidige code direct uit en toont de uitvoerlogs in het `Logs`-paneel onderaan. Het ondersteunt `console.log/info/warn/error` en markeert fouten.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Kan worden gebruikt met AI-medewerker om scripts te genereren/wijzigen: [AI-medewerker · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Veelvoorkomend gebruik (vereenvoudigde voorbeelden)

### 1) Real-time voorbeeld (formulierwaarden lezen)

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

### 2) Een weergave openen (lade)

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

### 3) Externe bibliotheken laden en renderen

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Aandachtspunten

- Het wordt aanbevolen om een betrouwbare CDN te gebruiken voor het laden van externe bibliotheken, en om een fallback te voorzien voor scenario's waarin dit mislukt (bijv. `if (!lib) return;`).
- Het wordt aanbevolen om prioriteit te geven aan het gebruik van `class` of `[name=...]` voor selectors en het vermijden van vaste `id`'s, om dubbele `id`'s in meerdere blokken/pop-ups te voorkomen.
- Gebeurtenisopschoning: Frequente wijzigingen in formulierwaarden zullen meerdere renders activeren. Voordat u een gebeurtenis bindt, moet deze worden opgeschoond of gededupliceerd (bijv. eerst `remove` en dan `add`, of `{ once: true }`, of een `dataset`-attribuut gebruiken om duplicatie te voorkomen).

## Gerelateerde documentatie

- [Variabelen en context](/interface-builder/variables)
- [Koppelingsregels](/interface-builder/linkage-rule)
- [Weergaven en pop-ups](/interface-builder/actions/types/view)