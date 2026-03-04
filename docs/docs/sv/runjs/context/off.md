:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/off).
:::

# ctx.off()

Tar bort händelselyssnare som registrerats via `ctx.on(eventName, handler)`. Den används ofta tillsammans med [ctx.on](./on.md) för att avsluta prenumerationen vid lämplig tidpunkt, vilket förhindrar minnesläckor eller dubbla triggningar.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **React useEffect-rensning** | Anropas i `useEffect`-rensningsfunktionen för att ta bort lyssnare när komponenten avmonteras. |
| **JSField / JSEditableField** | Avsluta prenumeration på `js-field:value-change` vid tvåvägsdatabindning för fält. |
| **Resursrelaterat** | Avsluta prenumeration på lyssnare som `refresh` eller `saved` som registrerats via `ctx.resource.on`. |

## Typdefinition

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Exempel

### Parvis användning i React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Avsluta prenumeration på resurshändelser

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Vid lämplig tidpunkt
ctx.resource?.off('refresh', handler);
```

## Observera

1. **Konsekvent referens för hanterare**: Den `handler` som skickas till `ctx.off` måste vara samma referens som den som användes i `ctx.on`, annars kan den inte tas bort korrekt.
2. **Rensa i tid**: Anropa `ctx.off` innan komponenten avmonteras eller kontexten (context) förstörs för att undvika minnesläckor.

## Relaterade dokument

- [ctx.on](./on.md) - Prenumerera på händelser
- [ctx.resource](./resource.md) - Resursinstans och dess `on`/`off`-metoder