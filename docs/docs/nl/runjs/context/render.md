:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/render) voor nauwkeurige informatie.
:::

# ctx.render()

Rendert React-elementen, HTML-strings of DOM-nodes in een opgegeven container. Als `container` niet wordt opgegeven, wordt standaard gerenderd in `ctx.element` en worden de context van de applicatie (zoals ConfigProvider en thema's) automatisch overgenomen.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock** | Renderen van aangepaste blokinhoud (grafieken, lijsten, kaarten, enz.) |
| **JSField / JSItem / JSColumn** | Renderen van aangepaste weergaven voor bewerkbare velden of tabelkolommen |
| **Details-blok** | De weergavevorm van velden in detailpagina's aanpassen |

> Let op: `ctx.render()` vereist een rendering-container. Als `container` niet wordt meegegeven en `ctx.element` niet bestaat (bijv. in scenario's met pure logica zonder UI), wordt er een foutmelding gegenereerd.

## Type-definitie

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parameter | Type | Beschrijving |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | De te renderen inhoud |
| `container` | `Element` \| `DocumentFragment` (optioneel) | Doelcontainer voor rendering, standaard `ctx.element` |

**Retourwaarde**:

- Bij het renderen van een **React-element**: Retourneert `ReactDOMClient.Root`, wat handig is voor latere updates via `root.render()`.
- Bij het renderen van een **HTML-string** of **DOM-node**: Retourneert `null`.

## Beschrijving vnode-types

| Type | Gedrag |
|------|------|
| `React.ReactElement` (JSX) | Gerenderd met React's `createRoot`, beschikt over volledige React-functionaliteit en neemt automatisch de applicatiecontext over. |
| `string` | Stelt de `innerHTML` van de container in na opschoning door DOMPurify; een eventuele bestaande React-root wordt eerst ontkoppeld. |
| `Node` (Element, Text, enz.) | Voegt toe via `appendChild` na het leegmaken van de container; een eventuele bestaande React-root wordt eerst ontkoppeld. |
| `DocumentFragment` | Voegt subnodes van het fragment toe aan de container; een eventuele bestaande React-root wordt eerst ontkoppeld. |

## Voorbeelden

### React-elementen renderen (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Titel')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Geklikt'))}>
      {ctx.t('Knop')}
    </Button>
  </Card>
);
```

### HTML-strings renderen

```ts
ctx.render('<h1>Hello World</h1>');

// Combineren met ctx.t voor internationalisering
ctx.render('<div style="padding:16px">' + ctx.t('Inhoud') + '</div>');

// Voorwaardelijke rendering
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Geen gegevens') + '</span>');
```

### DOM-nodes renderen

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Eerst een lege container renderen, daarna overdragen aan een externe bibliotheek (zoals ECharts) voor initialisatie
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Een aangepaste container specificeren

```ts
// Renderen naar een specifiek DOM-element
const customEl = document.getElementById('my-container');
ctx.render(<div>Inhoud</div>, customEl);
```

### Meerdere aanroepen vervangen de inhoud

```ts
// De tweede aanroep vervangt de bestaande inhoud in de container
ctx.render(<div>Eerste</div>);
ctx.render(<div>Tweede</div>);  // Alleen "Tweede" wordt weergegeven
```

## Aandachtspunten

- **Meerdere aanroepen vervangen de inhoud**: Elke aanroep van `ctx.render()` vervangt de bestaande inhoud in de container in plaats van deze toe te voegen.
- **Veiligheid van HTML-strings**: Meegegeven HTML wordt opgeschoond via DOMPurify om XSS-risico's te beperken, maar het wordt nog steeds aangeraden om het samenvoegen van niet-vertrouwde gebruikersinvoer te vermijden.
- **Manipuleer ctx.element niet rechtstreeks**: `ctx.element.innerHTML` is verouderd; u dient consequent `ctx.render()` te gebruiken.
- **Container meegeven als er geen standaard bestaat**: In scenario's waarin `ctx.element` `undefined` is (bijv. binnen modules die via `ctx.importAsync` zijn geladen), moet expliciet een `container` worden opgegeven.

## Gerelateerd

- [ctx.element](./element.md) - Standaard rendering-container, gebruikt wanneer er geen container aan `ctx.render()` wordt meegegeven.
- [ctx.libs](./libs.md) - Ingebouwde bibliotheken zoals React en antd, gebruikt voor JSX-rendering.
- [ctx.importAsync()](./import-async.md) - Wordt gebruikt in combinatie met `ctx.render()` na het on-demand laden van externe React/component-bibliotheken.