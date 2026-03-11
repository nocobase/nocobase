:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/exit).
:::

# ctx.exit()

Avbryter körningen av det aktuella händelseflödet; efterföljande steg kommer inte att köras. Det används vanligtvis när affärsvillkor inte uppfylls, användaren avbryter eller ett oåterkalleligt fel uppstår.

## Användningsområden

`ctx.exit()` används vanligtvis i följande sammanhang där JS kan köras:

| Scenario | Beskrivning |
|------|------|
| **Händelseflöde** | I händelseflöden som triggas av formulärinsändningar, knapptryckningar etc., avbryts efterföljande steg när villkor inte uppfylls. |
| **Länkningsregler** | I fältlänkningar, filterlänkningar etc., avbryts det aktuella händelseflödet när validering misslyckas eller körningen behöver hoppas över. |
| **Åtgärdshändelser** | I anpassade åtgärder (t.ex. bekräftelse av radering, validering före sparande), avslutas flödet när användaren avbryter eller valideringen misslyckas. |

> Skillnad från `ctx.exitAll()`: `ctx.exit()` avbryter endast det aktuella händelseflödet; andra händelseflöden under samma händelse påverkas inte. `ctx.exitAll()` avbryter det aktuella händelseflödet samt alla efterföljande händelseflöden under samma händelse som ännu inte har körts.

## Typdefinition

```ts
exit(): never;
```

Anrop av `ctx.exit()` kastar ett internt `FlowExitException`, som fångas upp av händelseflödesmotorn för att stoppa körningen av det aktuella händelseflödet. När det väl har anropats kommer resterande satser i den aktuella JS-koden inte att köras.

## Jämförelse med ctx.exitAll()

| Metod | Verkningsområde |
|------|----------|
| `ctx.exit()` | Avbryter endast det aktuella händelseflödet; efterföljande händelseflöden påverkas inte. |
| `ctx.exitAll()` | Avbryter det aktuella händelseflödet och avbryter efterföljande händelseflöden under samma händelse som är inställda på att **köras sekventiellt**. |

## Exempel

### Avsluta vid användaravbrott

```ts
// I ett bekräftelsefönster, avbryt händelseflödet om användaren klickar på avbryt
if (!confirmed) {
  ctx.message.info('Åtgärden avbröts');
  ctx.exit();
}
```

### Avsluta vid misslyckad parametervalidering

```ts
// Meddela och avbryt när valideringen misslyckas
if (!params.value || params.value.length < 3) {
  ctx.message.error('Ogiltiga parametrar, längden måste vara minst 3');
  ctx.exit();
}
```

### Avsluta när affärsvillkor inte uppfylls

```ts
// Avbryt om villkoren inte uppfylls; efterföljande steg kommer inte att köras
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Endast utkast kan skickas in' });
  ctx.exit();
}
```

### Val mellan ctx.exit() och ctx.exitAll()

```ts
// Endast det aktuella händelseflödet behöver avslutas → Använd ctx.exit()
if (!params.valid) {
  ctx.message.error('Ogiltiga parametrar');
  ctx.exit();  // Andra händelseflöden påverkas inte
}

// Behöver avbryta alla efterföljande händelseflöden under den aktuella händelsen → Använd ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Otillräckliga behörigheter' });
  ctx.exitAll();  // Både det aktuella händelseflödet och efterföljande händelseflöden under samma händelse avbryts
}
```

### Avsluta baserat på användarens val efter bekräftelse i modal

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Bekräfta radering',
  content: 'Denna åtgärd kan inte ångras. Vill ni fortsätta?',
});
if (!ok) {
  ctx.message.info('Avbruten');
  ctx.exit();
}
```

## Observera

- Efter att `ctx.exit()` har anropats kommer efterföljande kod i den aktuella JS-filen inte att köras; det rekommenderas att ni förklarar orsaken för användaren via `ctx.message`, `ctx.notification` eller ett modalfönster innan anropet.
- Det finns vanligtvis inget behov av att fånga `FlowExitException` i affärskod; låt händelseflödesmotorn hantera det.
- Om ni behöver avbryta alla efterföljande händelseflöden under den aktuella händelsen, använd `ctx.exitAll()`.

## Relaterat

- [ctx.exitAll()](./exit-all.md): Avbryter det aktuella händelseflödet och efterföljande händelseflöden under samma händelse.
- [ctx.message](./message.md): Meddelanden.
- [ctx.modal](./modal.md): Bekräftelsefönster.