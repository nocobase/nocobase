:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# JS Block

## Introductie

Het JS Block is een zeer flexibel 'aangepast weergaveblok' waarmee u direct JavaScript-scripts kunt schrijven om interfaces te genereren, gebeurtenissen te koppelen, gegevens-API's aan te roepen of bibliotheken van derden te integreren. Het is geschikt voor gepersonaliseerde visualisaties, tijdelijke experimenten en lichtgewicht uitbreidingen die moeilijk te realiseren zijn met ingebouwde blokken.

## Runtime Context API

De runtime context van het JS Block is voorzien van veelgebruikte functionaliteiten die u direct kunt gebruiken:

- `ctx.element`: De DOM-container van het blok (veilig ingepakt als ElementProxy), met ondersteuning voor `innerHTML`, `querySelector`, `addEventListener`, enzovoort.
- `ctx.requireAsync(url)`: Laadt asynchroon een AMD/UMD-bibliotheek via een URL.
- `ctx.importAsync(url)`: Importeert dynamisch een ESM-module via een URL.
- `ctx.openView`: Opent een geconfigureerde weergave (pop-up/lade/pagina).
- `ctx.useResource(...)` + `ctx.resource`: Geeft toegang tot gegevens als een resource.
- `ctx.i18n.t()` / `ctx.t()`: Ingebouwde internationaliseringsfunctionaliteit.
- `ctx.onRefReady(ctx.ref, cb)`: Rendert nadat de container gereed is om timingproblemen te voorkomen.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Ingebouwde bibliotheken zoals React, ReactDOM, Ant Design, Ant Design Icons en dayjs voor JSX-rendering en tijdbeheer. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` blijven behouden voor compatibiliteit.)
- `ctx.render(vnode)`: Rendert een React-element, HTML-string of DOM-knooppunt naar de standaardcontainer `ctx.element`. Meerdere aanroepen hergebruiken dezelfde React Root en overschrijven de bestaande inhoud van de container.

## Een blok toevoegen

U kunt een JS Block toevoegen aan een pagina of een pop-up.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor en fragmenten

De scripteditor van het JS Block ondersteunt syntaxiskleuring, foutmeldingen en ingebouwde codefragmenten (Snippets). Hiermee kunt u snel veelvoorkomende voorbeelden invoegen, zoals het renderen van grafieken, het koppelen van knopgebeurtenissen, het laden van externe bibliotheken, het renderen van React/Vue-componenten, tijdlijnen, informatiekaarten, enzovoort.

- `Snippets`: Opent de lijst met ingebouwde codefragmenten. U kunt zoeken en een geselecteerd fragment met één klik invoegen op de huidige cursorpositie in de code-editor.
- `Run`: Voert de code in de huidige editor direct uit en toont de uitvoerlogs in het `Logs`-paneel onderaan. Het ondersteunt het weergeven van `console.log/info/warn/error`, waarbij fouten worden gemarkeerd en u naar de specifieke rij en kolom kunt navigeren.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Bovendien kunt u rechtsboven in de editor direct de AI-medewerker 'Frontend Engineer · Nathan' oproepen. Nathan kan u helpen scripts te schrijven of te wijzigen op basis van de huidige context. U kunt vervolgens met één klik 'Apply to editor' toepassen en de code uitvoeren om het effect te bekijken. Zie voor meer details:

- [AI-medewerker · Nathan: Frontend Engineer](/ai-employees/built-in/ai-coding)

## Runtime-omgeving en beveiliging

- **Container**: Het systeem biedt een veilige DOM-container `ctx.element` (ElementProxy) voor het script, die alleen het huidige blok beïnvloedt en geen andere delen van de pagina verstoort.
- **Sandbox**: Het script draait in een gecontroleerde omgeving. `window`/`document`/`navigator` gebruiken veilige proxy-objecten, waardoor veelvoorkomende API's beschikbaar zijn, terwijl risicovolle handelingen worden beperkt.
- **Opnieuw renderen**: Het blok wordt automatisch opnieuw gerenderd wanneer het wordt verborgen en vervolgens weer getoond (om te voorkomen dat het initiële mount-script opnieuw wordt uitgevoerd).

## Veelvoorkomend gebruik (vereenvoudigde voorbeelden)

### 1) React renderen (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Geklikt!'))}>
      {ctx.t('Klik')}
    </Button>
  </div>
);
```

### 2) API-aanvraagsjabloon

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Aanvraag voltooid'));
console.log(ctx.t('Responsgegevens:'), resp?.data);
```

### 3) ECharts laden en renderen

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Een weergave openen (lade)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Voorbeeldlade'), size: 'large' });
```

### 5) Een resource lezen en JSON renderen

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Aandachtspunten

- Het wordt aanbevolen om vertrouwde CDN's te gebruiken voor het laden van externe bibliotheken.
- **Advies voor selectorgebruik**: Geef prioriteit aan het gebruik van `class`- of `[name=...]`-attribuutselectoren. Vermijd het gebruik van vaste `id`'s om conflicten door dubbele `id`'s in meerdere blokken of pop-ups te voorkomen, wat kan leiden tot problemen met stijlen of gebeurtenissen.
- **Gebeurtenisopschoning**: Aangezien het blok meerdere keren opnieuw kan worden gerenderd, moeten gebeurtenislisteners worden opgeschoond of gedupliceerd voordat ze worden gekoppeld, om herhaalde triggers te voorkomen. U kunt een 'eerst verwijderen, dan toevoegen'-benadering, een eenmalige listener of een vlag gebruiken om duplicatie te voorkomen.

## Gerelateerde documentatie

- [Variabelen en context](/interface-builder/variables)
- [Koppelingsregels](/interface-builder/linkage-rule)
- [Weergaven en pop-ups](/interface-builder/actions/types/view)