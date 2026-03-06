:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/on).
:::

# ctx.on()

Prenumerera på kontexthändelser (såsom ändringar av fältvärden, egenskapsändringar, resursuppdateringar etc.) i RunJS. Händelser mappas till anpassade DOM-händelser på `ctx.element` eller till `ctx.resource` interna händelsebuss baserat på deras typ.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSField / JSEditableField** | Lyssna på ändringar av fältvärden från externa källor (formulär, kopplingar etc.) för att synkront uppdatera UI:t och uppnå tvåvägsbindning. |
| **JSBlock / JSItem / JSColumn** | Lyssna på anpassade händelser i behållaren för att reagera på data- eller statusändringar. |
| **resource-relaterat** | Lyssna på livscykelhändelser för resurser, såsom uppdatering eller sparande, för att exekvera logik efter datauppdateringar. |

## Typdefinition

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Vanliga händelser

| Händelsenamn | Beskrivning | Eventkälla |
|--------|------|----------|
| `js-field:value-change` | Fältvärdet har ändrats externt (t.ex. via formulärkoppling eller uppdatering av standardvärde) | CustomEvent på `ctx.element`, där `ev.detail` är det nya värdet |
| `resource:refresh` | Resursdata har uppdaterats | `ctx.resource` händelsebuss |
| `resource:saved` | Resursen har sparats | `ctx.resource` händelsebuss |

> Regler för händelsemappning: Händelser med prefixet `resource:` går via `ctx.resource.on`, medan övriga vanligtvis går via DOM-händelser på `ctx.element` (om den existerar).

## Exempel

### Tvåvägsbindning för fält (React useEffect + rensning)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Inbyggd DOM-lyssning (alternativ när ctx.on inte är tillgänglig)

```ts
// När ctx.on inte tillhandahålls kan ni använda ctx.element direkt
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Vid rensning: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Uppdatera UI efter resursuppdatering

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Uppdatera rendering baserat på data
});
```

## Samverkan med ctx.off

- Lyssnare som registrerats med `ctx.on` bör tas bort vid lämplig tidpunkt via [ctx.off](./off.md) för att undvika minnesläckor eller dubbla utlösningar.
- I React anropas `ctx.off` vanligtvis i cleanup-funktionen för `useEffect`.
- `ctx.off` kanske inte existerar; det rekommenderas att ni använder valfri kedjning (optional chaining): `ctx.off?.('eventName', handler)`.

## Observera

1. **Parvis borttagning**: Varje `ctx.on(eventName, handler)` bör ha en motsvarande `ctx.off(eventName, handler)`, och referensen till `handler` som skickas med måste vara identisk.
2. **Livscykel**: Ta bort lyssnare innan komponenten avmonteras eller kontexten förstörs för att förhindra minnesläckor.
3. **Tillgängliga händelser**: Olika kontexttyper stöder olika händelser. Se dokumentationen för respektive komponent för detaljer.

## Relaterad dokumentation

- [ctx.off](./off.md) - Ta bort händelselyssnare
- [ctx.element](./element.md) - Renderingsbehållare och DOM-händelser
- [ctx.resource](./resource.md) - Resursinstans och dess `on`/`off`-metoder
- [ctx.setValue](./set-value.md) - Ställ in fältvärde (utlöser `js-field:value-change`)