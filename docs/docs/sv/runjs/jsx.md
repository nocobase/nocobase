:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/jsx).
:::

# JSX

RunJS stöder JSX-syntax, vilket gör att ni kan skriva kod på samma sätt som React-komponenter. JSX kompileras automatiskt före körning.

## Kompileringsanvisningar

- Använder [sucrase](https://github.com/alangpierce/sucrase) för att transformera JSX.
- JSX kompileras till `ctx.libs.React.createElement` och `ctx.libs.React.Fragment`.
- **Inget behov av att importera React**: Ni kan skriva JSX direkt; det kommer automatiskt att använda `ctx.libs.React` efter kompilering.
- När extern React laddas via `ctx.importAsync('react@x.x.x')`, kommer JSX att byta till att använda `createElement`-metoden från den specifika instansen.

## Använda inbyggd React och komponenter

RunJS har inbyggt stöd för React och vanliga UI-bibliotek. Ni kan komma åt dem direkt via `ctx.libs` utan att använda `import`:

- **ctx.libs.React** — React-kärnan
- **ctx.libs.ReactDOM** — ReactDOM (kan användas med `createRoot` vid behov)
- **ctx.libs.antd** — Ant Design-komponenter
- **ctx.libs.antdIcons** — Ant Design-ikoner

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klicka</Button>);
```

När ni skriver JSX direkt behöver ni inte destrukturera React. Ni behöver endast destrukturera från `ctx.libs` när ni använder **Hooks** (som `useState`, `useEffect`) eller **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Antal: {count}</div>;
};

ctx.render(<Counter />);
```

**Observera**: Inbyggd React och extern React som importerats via `ctx.importAsync()` **kan inte blandas**. Om ni använder ett externt UI-bibliotek måste även React importeras från samma externa källa.

## Använda extern React och komponenter

När ni laddar en specifik version av React och UI-bibliotek via `ctx.importAsync()`, kommer JSX att använda den React-instansen:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Klicka</Button>);
```

Om antd är beroende av react/react-dom kan ni ange samma version via `deps` för att undvika flera instanser:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Knapp</Button>);
```

**Observera**: Vid användning av extern React måste även UI-bibliotek som antd importeras via `ctx.importAsync()`. Blanda dem inte med `ctx.libs.antd`.

## Viktiga punkter för JSX-syntax

- **Komponenter och props**: `<Button type="primary">Text</Button>`
- **Fragment**: `<>...</>` eller `<React.Fragment>...</React.Fragment>` (kräver destrukturering av `const { React } = ctx.libs` vid användning av Fragment)
- **Uttryck**: Använd `{uttryck}` i JSX för att infoga variabler eller beräkningar, till exempel `{ctx.user.name}` eller `{count + 1}`. Använd inte `{{ }}` mall-syntax.
- **Villkorlig rendering**: `{flag && <span>Innehåll</span>}` eller `{flag ? <A /> : <B />}`
- **Listrendering**: Använd `array.map()` för att returnera en lista med element, och se till att varje element har en stabil `key`.

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