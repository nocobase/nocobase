:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/element).
:::

# ctx.element

En `ElementProxy`-instans som pekar på sandlådans DOM-container och fungerar som standardmål för rendering för `ctx.render()`. Den är tillgänglig i scenarier där en renderingscontainer finns, såsom `JSBlock`, `JSField`, `JSItem` och `JSColumn`.

## Tillämpliga scenarier

| Scenario | Beskrivning |
|------|------|
| **JSBlock** | DOM-containern för blocket, används för att rendera anpassat blockinnehåll. |
| **JSField / JSItem / FormJSFieldItem** | Renderingscontainern för ett fält eller formulärobjekt (vanligtvis en `<span>`). |
| **JSColumn** | DOM-containern för en tabellcell, används för att rendera anpassat kolumninnehåll. |

> **Observera:** `ctx.element` är endast tillgänglig i RunJS-kontexter som har en renderingscontainer. I kontexter utan UI (som ren backend-logik) kan den vara `undefined`. Det rekommenderas att ni gör en kontroll för null-värden före användning.

## Typdefinition

```typescript
element: ElementProxy | undefined;

// ElementProxy är en proxy för den råa HTMLElementen och exponerar ett säkert API
class ElementProxy {
  __el: HTMLElement;  // Det interna råa DOM-elementet (endast åtkomligt i specifika scenarier)
  innerHTML: string;  // Saneras via DOMPurify vid läsning/skrivning
  outerHTML: string; // Samma som ovan
  appendChild(child: HTMLElement | string): void;
  // Andra HTMLElement-metoder skickas vidare (direkt användning rekommenderas inte)
}
```

## Säkerhetskrav

**Rekommendation: All rendering bör ske via `ctx.render()`.** Undvik att använda DOM-API:er för `ctx.element` direkt (t.ex. `innerHTML`, `appendChild`, `querySelector`, etc.).

### Varför ctx.render() rekommenderas

| Fördel | Beskrivning |
|------|------|
| **Säkerhet** | Centraliserad säkerhetskontroll för att förhindra XSS och felaktiga DOM-operationer. |
| **React-stöd** | Fullt stöd för JSX, React-komponenter och livscykler. |
| **Arv av kontext** | Ärver automatiskt applikationens `ConfigProvider`, teman, etc. |
| **Konflikthantering** | Hanterar automatiskt skapande/avmontering av React-rötter för att undvika konflikter mellan flera instanser. |

### ❌ Rekommenderas inte: Direkt manipulering av ctx.element

```ts
// ❌ Rekommenderas inte: Att använda ctx.element-API:er direkt
ctx.element.innerHTML = '<div>Innehåll</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` är föråldrad. Vänligen använd `ctx.render()` istället.

### ✅ Rekommenderas: Använd ctx.render()

```ts
// ✅ Rendera en React-komponent
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Välkommen')}>
    <Button type="primary">Klicka</Button>
  </Card>
);

// ✅ Rendera en HTML-sträng
ctx.render('<div style="padding:16px;">' + ctx.t('Innehåll') + '</div>');

// ✅ Rendera en DOM-nod
const div = document.createElement('div');
div.textContent = ctx.t('Hej');
ctx.render(div);
```

## Specialfall: Som ankare för popover

När ni behöver öppna en Popover med det aktuella elementet som ankare kan ni använda `ctx.element?.__el` för att få den råa DOM:en som `target`:

```ts
// ctx.viewer.popover kräver en rå DOM som target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Popup-innehåll</div>,
});
```

> Använd `__el` endast i scenarier som ”använda den aktuella containern som ett ankare”; manipulera inte DOM:en direkt i andra fall.

## Förhållande till ctx.render

- Om `ctx.render(vnode)` anropas utan ett `container`-argument, renderas det som standard i `ctx.element`-containern.
- Om både `ctx.element` saknas och ingen `container` anges, kommer ett fel att kastas.
- Ni kan explicit ange en container: `ctx.render(vnode, customContainer)`.

## Observera

- `ctx.element` är avsedd för intern användning av `ctx.render()`. Det rekommenderas inte att ni direkt kommer åt eller ändrar dess egenskaper/metoder.
- I kontexter utan en renderingscontainer kommer `ctx.element` att vara `undefined`. Se till att containern är tillgänglig eller skicka med en `container` manuellt innan ni anropar `ctx.render()`.
- Även om `innerHTML`/`outerHTML` i `ElementProxy` saneras via DOMPurify, rekommenderas det fortfarande att använda `ctx.render()` för enhetlig hantering av rendering.

## Relaterat

- [ctx.render](./render.md): Rendera innehåll i en container
- [ctx.view](./view.md): Aktuell vy-kontroller
- [ctx.modal](./modal.md): Snabb-API för modaler