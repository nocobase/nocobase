:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/element) voor nauwkeurige informatie.
:::

# ctx.element

Een `ElementProxy`-instantie die naar de sandbox DOM-container verwijst en dient als het standaard renderdoel voor `ctx.render()`. Dit is beschikbaar in scenario's waar een render-container aanwezig is, zoals `JSBlock`, `JSField`, `JSItem` en `JSColumn`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock** | De DOM-container voor het blok, gebruikt om aangepaste blokinhoud te renderen. |
| **JSField / JSItem / FormJSFieldItem** | De render-container voor een veld of formulieritem (meestal een `<span>`). |
| **JSColumn** | De DOM-container voor een tabelcel, gebruikt om aangepaste kolominhoud te renderen. |

> Let op: `ctx.element` is alleen beschikbaar in RunJS-contexten die een render-container hebben. In contexten zonder UI (zoals pure backend-logica) kan dit `undefined` zijn. Het wordt aanbevolen om een controle op nulwaarden uit te voeren voor gebruik.

## Type-definitie

```typescript
element: ElementProxy | undefined;

// ElementProxy is een proxy voor het ruwe HTMLElement en stelt een veilige API beschikbaar
class ElementProxy {
  __el: HTMLElement;  // Het interne ruwe DOM-element (alleen toegankelijk in specifieke scenario's)
  innerHTML: string;  // Geschoond via DOMPurify tijdens lezen/schrijven
  outerHTML: string; // Hetzelfde als hierboven
  appendChild(child: HTMLElement | string): void;
  // Andere HTMLElement-methoden worden doorgegeven (direct gebruik wordt niet aanbevolen)
}
```

## Beveiligingsvereisten

**Aanbevolen: Alle rendering moet worden uitgevoerd via `ctx.render()`.** Vermijd het directe gebruik van de DOM-API's van `ctx.element` (bijv. `innerHTML`, `appendChild`, `querySelector`, enz.).

### Waarom ctx.render() wordt aanbevolen

| Voordeel | Beschrijving |
|------|------|
| **Beveiliging** | Gecentraliseerde beveiligingscontrole om XSS en onjuiste DOM-bewerkingen te voorkomen. |
| **React-ondersteuning** | Volledige ondersteuning voor JSX, React-componenten en levenscycli. |
| **Context-overerving** | Erft automatisch de `ConfigProvider`, thema's, enz. van de applicatie over. |
| **Conflictbehandeling** | Beheert automatisch het maken/verwijderen van de React-root om conflicten tussen meerdere instanties te voorkomen. |

### ❌ Niet aanbevolen: Directe manipulatie van ctx.element

```ts
// ❌ Niet aanbevolen: Direct gebruik van ctx.element API's
ctx.element.innerHTML = '<div>Inhoud</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` is verouderd. Gebruik in plaats daarvan `ctx.render()`.

### ✅ Aanbevolen: Gebruik van ctx.render()

```ts
// ✅ Een React-component renderen
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Welkom')}>
    <Button type="primary">Klik hier</Button>
  </Card>
);

// ✅ Een HTML-string renderen
ctx.render('<div style="padding:16px;">' + ctx.t('Inhoud') + '</div>');

// ✅ Een DOM-node renderen
const div = document.createElement('div');
div.textContent = ctx.t('Hallo');
ctx.render(div);
```

## Uitzondering: Als anker voor een pop-over

Wanneer u een Popover wilt openen met het huidige element als anker, kunt u `ctx.element?.__el` gebruiken om het ruwe DOM-element als `target` te verkrijgen:

```ts
// ctx.viewer.popover vereist een ruw DOM-element als target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Pop-up inhoud</div>,
});
```

> Gebruik `__el` alleen in scenario's zoals "het gebruik van de huidige container als anker"; bewerk de DOM in andere gevallen niet rechtstreeks.

## Relatie met ctx.render

- Als `ctx.render(vnode)` wordt aangeroepen zonder `container`-argument, wordt er standaard gerenderd in de `ctx.element`-container.
- Als zowel `ctx.element` ontbreekt als er geen `container` is opgegeven, wordt er een fout gegenereerd.
- U kunt expliciet een container opgeven: `ctx.render(vnode, customContainer)`.

## Opmerkingen

- `ctx.element` is bedoeld voor intern gebruik door `ctx.render()`. Het rechtstreeks openen of wijzigen van de eigenschappen/methoden wordt niet aanbevolen.
- In contexten zonder render-container is `ctx.element` `undefined`. Zorg ervoor dat de container beschikbaar is of geef handmatig een `container` mee voordat u `ctx.render()` aanroept.
- Hoewel `innerHTML`/`outerHTML` in `ElementProxy` worden geschoond via DOMPurify, wordt het nog steeds aanbevolen om `ctx.render()` te gebruiken voor uniform renderbeheer.

## Gerelateerd

- [ctx.render](./render.md): Inhoud renderen in een container
- [ctx.view](./view.md): Huidige view-controller
- [ctx.modal](./modal.md): Sneltoets-API voor modals