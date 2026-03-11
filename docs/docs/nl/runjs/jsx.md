:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/jsx) voor nauwkeurige informatie.
:::

# JSX

RunJS ondersteunt JSX-syntaxis, waardoor u code kunt schrijven die vergelijkbaar is met React-componenten. JSX wordt automatisch gecompileerd vóór uitvoering.

## Compilatie-opmerkingen

- Gebruikt [sucrase](https://github.com/alangpierce/sucrase) om JSX te transformeren.
- JSX wordt gecompileerd naar `ctx.libs.React.createElement` en `ctx.libs.React.Fragment`.
- **React importeren is niet nodig**: U kunt direct JSX schrijven; na compilatie wordt automatisch `ctx.libs.React` gebruikt.
- Wanneer u externe React laadt via `ctx.importAsync('react@x.x.x')`, zal JSX overschakelen naar het gebruik van de `createElement`-methode van die specifieke instantie.

## Gebruik van ingebouwde React en componenten

RunJS bevat ingebouwde React en veelgebruikte UI-bibliotheken. U kunt deze direct benaderen via `ctx.libs` zonder `import` te gebruiken:

- **ctx.libs.React** — React-kern
- **ctx.libs.ReactDOM** — ReactDOM (kan indien nodig worden gebruikt met `createRoot`)
- **ctx.libs.antd** — Ant Design-componenten
- **ctx.libs.antdIcons** — Ant Design-iconen

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klik</Button>);
```

Bij het direct schrijven van JSX hoeft u React niet te destructuren. U hoeft alleen te destructuren uit `ctx.libs` wanneer u **Hooks** (zoals `useState`, `useEffect`) of een **Fragment** (`<>...</>`) gebruikt:

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Let op**: Ingebouwde React en externe React die via `ctx.importAsync()` is geïmporteerd, **kunnen niet worden gemengd**. Als u een externe UI-bibliotheek gebruikt, moet React ook vanuit dezelfde externe bron worden geïmporteerd.

## Gebruik van externe React en componenten

Bij het laden van een specifieke versie van React en UI-bibliotheken via `ctx.importAsync()`, zal JSX die React-instantie gebruiken:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Klik</Button>);
```

Als antd afhankelijk is van react/react-dom, kunt u dezelfde versie opgeven via `deps` om meerdere instanties te voorkomen:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Let op**: Bij gebruik van externe React moeten UI-bibliotheken zoals antd ook via `ctx.importAsync()` worden geïmporteerd. Meng deze niet met `ctx.libs.antd`.

## Belangrijke punten JSX-syntaxis

- **Componenten en props**: `<Button type="primary">Tekst</Button>`
- **Fragment**: `<>...</>` of `<React.Fragment>...</React.Fragment>` (vereist destructuring van `const { React } = ctx.libs` bij gebruik van een Fragment)
- **Expressies**: Gebruik `{expressie}` in JSX om variabelen of bewerkingen in te voegen, zoals `{ctx.user.name}` of `{count + 1}`. Gebruik geen `{{ }}` template-syntaxis.
- **Voorwaardelijke weergave**: `{flag && <span>Inhoud</span>}` of `{flag ? <A /> : <B />}`
- **Lijstweergave**: Gebruik `array.map()` om een lijst met elementen te retourneren en zorg ervoor dat elk element een stabiele `key` heeft.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```