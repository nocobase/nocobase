:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/render).
:::

# ctx.render()

Renderar React-element, HTML-strängar eller DOM-noder i en angiven behållare. Om `container` inte anges, renderas innehållet som standard i `ctx.element` och ärver automatiskt applikationens kontext, såsom ConfigProvider och teman.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock** | Rendera anpassat innehåll för block (diagram, listor, kort, etc.) |
| **JSField / JSItem / JSColumn** | Rendera anpassade visningar för redigerbara fält eller tabellkolumner |
| **Detaljblock** | Anpassa visningsformatet för fält på detaljsidor |

> Observera: `ctx.render()` kräver en renderingsbehållare. Om `container` inte skickas med och `ctx.element` inte existerar (t.ex. i scenarier med ren logik utan UI), kommer ett fel att kastas.

## Typdefinition

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parameter | Typ | Beskrivning |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Innehåll som ska renderas |
| `container` | `Element` \| `DocumentFragment` (Valfritt) | Målbehållare för rendering, standardvärde är `ctx.element` |

**Returvärde**:

- Vid rendering av **React-element**: Returnerar `ReactDOMClient.Root`, vilket underlättar anrop av `root.render()` för efterföljande uppdateringar.
- Vid rendering av **HTML-strängar** eller **DOM-noder**: Returnerar `null`.

## Beskrivning av vnode-typer

| Typ | Beteende |
|------|------|
| `React.ReactElement` (JSX) | Renderas med Reacts `createRoot`, vilket ger fullständiga React-funktioner och automatiskt arv av applikationens kontext. |
| `string` | Ställer in behållarens `innerHTML` efter sanering med DOMPurify; eventuella befintliga React-rötter avmonteras först. |
| `Node` (Element, Text, etc.) | Rensar behållaren och lägger till via `appendChild`; eventuella befintliga React-rötter avmonteras först. |
| `DocumentFragment` | Lägger till fragmentets undernoder i behållaren; eventuella befintliga React-rötter avmonteras först. |

## Exempel

### Rendera React-element (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Titel')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Klickade'))}>
      {ctx.t('Knapp')}
    </Button>
  </Card>
);
```

### Rendera HTML-strängar

```ts
ctx.render('<h1>Hello World</h1>');

// Kombinera med ctx.t för internationalisering
ctx.render('<div style="padding:16px">' + ctx.t('Innehåll') + '</div>');

// Villkorlig rendering
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Ingen data') + '</span>');
```

### Rendera DOM-noder

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Rendera en tom behållare först, lämna sedan över till ett tredjepartsbibliotek (t.ex. ECharts) för initiering
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Ange en anpassad behållare

```ts
// Rendera till ett specifikt DOM-element
const customEl = document.getElementById('my-container');
ctx.render(<div>Innehåll</div>, customEl);
```

### Flera anrop ersätter innehållet

```ts
// Det andra anropet kommer att ersätta det befintliga innehållet i behållaren
ctx.render(<div>Första</div>);
ctx.render(<div>Andra</div>);  // Endast "Andra" kommer att visas
```

## Observera

- **Flera anrop ersätter innehåll**: Varje anrop till `ctx.render()` ersätter det befintliga innehållet i behållaren istället för att lägga till det.
- **Säkerhet för HTML-strängar**: HTML som skickas med saneras via DOMPurify för att minska XSS-risker, men ni bör fortfarande undvika att sammanfoga opålitlig användarindata.
- **Manipulera inte ctx.element direkt**: `ctx.element.innerHTML` är föråldrat; `ctx.render()` bör användas konsekvent istället.
- **Ange behållare när standard saknas**: I scenarier där `ctx.element` är `undefined` (t.ex. i moduler som laddas via `ctx.importAsync`), måste ni explicit ange en `container`.

## Relaterat

- [ctx.element](./element.md) - Standardbehållare för rendering, används när ingen behållare skickas till `ctx.render()`.
- [ctx.libs](./libs.md) - Inbyggda bibliotek som React och Ant Design, används för JSX-rendering.
- [ctx.importAsync()](./import-async.md) - Används tillsammans med `ctx.render()` efter att externa React-/komponentbibliotek har laddats vid behov.