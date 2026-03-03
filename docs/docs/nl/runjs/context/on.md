:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/on) voor nauwkeurige informatie.
:::

# ctx.on()

Abonneer u op context-gebeurtenissen (zoals wijzigingen in veldwaarden, eigenschapswijzigingen, het vernieuwen van bronnen, enz.) in RunJS. Gebeurtenissen worden op basis van hun type gekoppeld aan aangepaste DOM-gebeurtenissen op `ctx.element` of de interne event bus van `ctx.resource`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSField / JSEditableField** | Luister naar wijzigingen in veldwaarden van externe bronnen (formulieren, koppelingen, enz.) om de UI synchroon bij te werken en tweerichtingsbinding (two-way binding) te realiseren. |
| **JSBlock / JSItem / JSColumn** | Luister naar aangepaste gebeurtenissen op de container om te reageren op wijzigingen in gegevens of status. |
| **resource-gerelateerd** | Luister naar levenscyclus-gebeurtenissen van bronnen, zoals vernieuwen of opslaan, om logica uit te voeren na gegevensupdates. |

## Type-definitie

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Veelvoorkomende gebeurtenissen

| Gebeurtenisnaam | Beschrijving | Bron van gebeurtenis |
|--------|------|----------|
| `js-field:value-change` | Veldwaarde extern gewijzigd (bijv. formulierkoppeling, update van standaardwaarde) | CustomEvent op `ctx.element`, waarbij `ev.detail` de nieuwe waarde is |
| `resource:refresh` | Brongegevens zijn vernieuwd | `ctx.resource` event bus |
| `resource:saved` | Opslaan van bron voltooid | `ctx.resource` event bus |

> Regels voor het koppelen van gebeurtenissen: Gebeurtenissen met het voorvoegsel `resource:` verlopen via `ctx.resource.on`, terwijl andere meestal via DOM-gebeurtenissen op `ctx.element` verlopen (indien aanwezig).

## Voorbeelden

### Tweerichtingsbinding van velden (React useEffect + opschonen)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Systeemeigen DOM-monitoring (alternatief wanneer ctx.on niet beschikbaar is)

```ts
// Wanneer ctx.on niet beschikbaar is, kunt u ctx.element direct gebruiken
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Tijdens het opschonen: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### UI bijwerken na het vernieuwen van de bron

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Rendering bijwerken op basis van gegevens
});
```

## Samenwerking met ctx.off

- Luisteraars die zijn geregistreerd met `ctx.on` moeten op het juiste moment worden verwijderd via [ctx.off](./off.md) om geheugenlekken of dubbele triggers te voorkomen.
- In React wordt `ctx.off` meestal aangeroepen binnen de opschoonfunctie (cleanup function) van `useEffect`.
- `ctx.off` bestaat mogelijk niet; het wordt aanbevolen om optional chaining te gebruiken: `ctx.off?.('eventName', handler)`.

## Aandachtspunten

1. **Gepaarde annulering**: Elke `ctx.on(eventName, handler)` moet een bijbehorende `ctx.off(eventName, handler)` hebben, en de doorgegeven `handler`-referentie moet identiek zijn.
2. **Levenscyclus**: Verwijder luisteraars voordat de component wordt gedemonteerd of de context wordt vernietigd om geheugenlekken te voorkomen.
3. **Beschikbaarheid van gebeurtenissen**: Verschillende contexttypes ondersteunen verschillende gebeurtenissen. Raadpleeg de specifieke documentatie van de component voor details.

## Gerelateerde documentatie

- [ctx.off](./off.md) - Gebeurtenisluisteraars verwijderen
- [ctx.element](./element.md) - Rendering-container en DOM-gebeurtenissen
- [ctx.resource](./resource.md) - Bron-instantie en de bijbehorende `on`/`off`-methoden
- [ctx.setValue](./set-value.md) - Veldwaarde instellen (triggert `js-field:value-change`)