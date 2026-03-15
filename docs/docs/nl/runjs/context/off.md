:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/off) voor nauwkeurige informatie.
:::

# ctx.off()

Verwijdert event listeners die zijn geregistreerd via `ctx.on(eventName, handler)`. Het wordt vaak gebruikt in combinatie met [ctx.on](./on.md) om op het juiste moment af te melden, waardoor geheugenlekken of dubbele triggers worden voorkomen.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **React useEffect opschoning** | Wordt aangeroepen binnen de cleanup-functie van `useEffect` om listeners te verwijderen wanneer de component wordt gedemonteerd (unmount). |
| **JSField / JSEditableField** | Afmelden van `js-field:value-change` tijdens tweerichtings-databinding voor velden. |
| **Resource-gerelateerd** | Afmelden van listeners zoals `refresh` of `saved` die zijn geregistreerd via `ctx.resource.on`. |

## Type-definitie

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Voorbeelden

### Gecombineerd gebruik in React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Afmelden voor resource-events

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Op het juiste moment
ctx.resource?.off('refresh', handler);
```

## Belangrijke opmerkingen

1. **Consistente handler-referentie**: De `handler` die aan `ctx.off` wordt doorgegeven, moet dezelfde referentie zijn als de referentie die in `ctx.on` is gebruikt; anders kan deze niet correct worden verwijderd.
2. **Tijdige opschoning**: Roep `ctx.off` aan voordat de component wordt gedemonteerd of de context wordt vernietigd om geheugenlekken te voorkomen.

## Gerelateerde documentatie

- [ctx.on](./on.md) - Abonneren op events
- [ctx.resource](./resource.md) - Resource-instantie en de bijbehorende `on`/`off`-methoden