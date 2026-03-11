:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/exit-all).
:::

# ctx.exitAll()

Avslutar det aktuella händelseflödet och alla efterföljande händelseflöden som utlöses i samma händelseutskick. Det används vanligtvis när alla händelseflöden under den aktuella händelsen behöver avbrytas omedelbart på grund av ett globalt fel eller misslyckad behörighetskontroll.

## Användningsområden

`ctx.exitAll()` används vanligtvis i sammanhang där JS kan köras och där det är nödvändigt att **samtidigt avbryta det aktuella händelseflödet och efterföljande händelseflöden som utlöses av den händelsen**:

| Scenario | Beskrivning |
|------|------|
| **Händelseflöde** | Huvudhändelseflödets validering misslyckas (t.ex. otillräckliga behörigheter), vilket kräver att huvudflödet och alla efterföljande flöden under samma händelse som ännu inte har körts avslutas. |
| **Länkningsregler** | När länkningsvalideringen misslyckas måste den aktuella länkningen och efterföljande länkningar som utlöses av samma händelse avslutas. |
| **Åtgärdshändelser** | Validering före åtgärd misslyckas (t.ex. behörighetskontroll före radering), vilket kräver att huvudåtgärden och efterföljande steg förhindras. |

> Skillnad från `ctx.exit()`: `ctx.exit()` avslutar endast det aktuella händelseflödet; `ctx.exitAll()` avslutar det aktuella händelseflödet och alla **ej utförda** efterföljande händelseflöden i samma händelseutskick.

## Typdefinition

```ts
exitAll(): never;
```

Anrop av `ctx.exitAll()` kastar ett internt `FlowExitAllException`, som fångas upp av händelseflödesmotorn för att stoppa den aktuella händelseflödesinstansen och efterföljande händelseflöden under samma händelse. När det väl har anropats kommer resterande satser i den aktuella JS-koden inte att köras.

## Jämförelse med ctx.exit()

| Metod | Omfattning |
|------|----------|
| `ctx.exit()` | Avslutar endast det aktuella händelseflödet; efterföljande händelseflöden påverkas inte. |
| `ctx.exitAll()` | Avslutar det aktuella händelseflödet och avbryter efterföljande händelseflöden som körs **sekventiellt** under samma händelse. |

## Körningslägen

- **Sekventiell körning (sequential)**: Händelseflöden under samma händelse körs i ordning. Om något händelseflöde anropar `ctx.exitAll()` kommer efterföljande händelseflöden inte längre att köras.
- **Parallell körning (parallel)**: Händelseflöden under samma händelse körs parallellt. Att anropa `ctx.exitAll()` i ett händelseflöde kommer inte att avbryta andra samtidiga händelseflöden (eftersom de är oberoende).

## Exempel

### Avsluta alla händelseflöden när behörighetskontrollen misslyckas

```ts
// Avbryt huvudflödet och efterföljande händelseflöden vid otillräcklig behörighet
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Ingen behörighet för åtgärden' });
  ctx.exitAll();
}
```

### Avsluta när den globala förvalideringen misslyckas

```ts
// Exempel: Om associerad data hittas som inte kan raderas före radering, förhindra huvudflödet och efterföljande åtgärder
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Kan inte radera: associerad data finns');
  ctx.exitAll();
}
```

### Valet mellan ctx.exit() och ctx.exitAll()

```ts
// Endast det aktuella händelseflödet behöver avslutas → Använd ctx.exit()
if (!params.valid) {
  ctx.message.error('Ogiltiga parametrar');
  ctx.exit();  // Efterföljande händelseflöden påverkas inte
}

// Behöver avsluta alla efterföljande händelseflöden under den aktuella händelsen → Använd ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Otillräcklig behörighet' });
  ctx.exitAll();  // Både huvudflödet och efterföljande händelseflöden under samma händelse avslutas
}
```

### Meddelande före avslut

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Vänligen korrigera felen i formuläret först');
  ctx.exitAll();
}
```

## Observera

- Efter att `ctx.exitAll()` har anropats kommer efterföljande kod i den aktuella JS-filen inte att köras. Vi rekommenderar att ni förklarar orsaken för användaren via `ctx.message`, `ctx.notification` eller en modal innan anropet.
- Affärskod behöver vanligtvis inte fånga `FlowExitAllException`; låt händelseflödesmotorn hantera det.
- Om ni endast behöver stoppa det aktuella händelseflödet utan att påverka efterföljande, använd `ctx.exit()`.
- I parallellt läge avslutar `ctx.exitAll()` endast det aktuella händelseflödet och avbryter inte andra samtidiga händelseflöden.

## Relaterat

- [ctx.exit()](./exit.md): Avslutar endast det aktuella händelseflödet
- [ctx.message](./message.md): Meddelandeprompter
- [ctx.modal](./modal.md): Bekräftelsemodal