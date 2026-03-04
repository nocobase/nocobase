:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/jsx).
:::

# JSX

RunJS podporuje syntaxi JSX, což vám umožňuje psát kód podobně jako komponenty Reactu. JSX je před spuštěním automaticky zkompilováno.

## Poznámky ke kompilaci

- K transformaci JSX se používá [sucrase](https://github.com/alangpierce/sucrase).
- JSX je kompilováno do `ctx.libs.React.createElement` a `ctx.libs.React.Fragment`.
- **Není třeba importovat React**: JSX můžete psát přímo; po kompilaci se automaticky použije `ctx.libs.React`.
- Při načítání externího Reactu přes `ctx.importAsync('react@x.x.x')` se JSX přepne na použití metody `createElement` z této konkrétní instance.

## Použití vestavěného Reactu a komponent

RunJS obsahuje vestavěný React a běžné UI knihovny. Můžete k nim přistupovat přímo přes `ctx.libs` bez použití `import`:

- **ctx.libs.React** — jádro Reactu
- **ctx.libs.ReactDOM** — ReactDOM (v případě potřeby lze použít s `createRoot`)
- **ctx.libs.antd** — komponenty Ant Design
- **ctx.libs.antdIcons** — ikony Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Kliknout</Button>);
```

Při přímém psaní JSX nemusíte React destrukturovat. Destrukturalizaci z `ctx.libs` potřebujete pouze při použití **Hooků** (jako `useState`, `useEffect`) nebo **Fragmentu** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Počet: {count}</div>;
};

ctx.render(<Counter />);
```

**Poznámka**: Vestavěný React a externí React importovaný přes `ctx.importAsync()` **nelze kombinovat**. Pokud používáte externí UI knihovnu, musí být React importován ze stejného externího zdroje.

## Použití externího Reactu a komponent

Při načítání konkrétní verze Reactu a UI knihoven přes `ctx.importAsync()` bude JSX používat tuto instanci Reactu:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Kliknout</Button>);
```

Pokud antd závisí na react/react-dom, můžete specifikovat stejnou verzi přes `deps`, abyste se vyhnuli více instancím:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Tlačítko</Button>);
```

**Poznámka**: Při použití externího Reactu musí být UI knihovny jako antd také importovány přes `ctx.importAsync()`. Nekombinujte je s `ctx.libs.antd`.

## Klíčové body syntaxe JSX

- **Komponenty a props**: `<Button type="primary">Text</Button>`
- **Fragment**: `<>...</>` nebo `<React.Fragment>...</React.Fragment>` (při použití Fragmentu je nutná destrukturalizace `const { React } = ctx.libs`)
- **Výrazy**: V JSX používejte `{výraz}` pro vkládání proměnných nebo operací, například `{ctx.user.name}` nebo `{count + 1}`. Nepoužívejte šablonovou syntaxi `{{ }}`.
- **Podmíněné vykreslování**: `{flag && <span>Obsah</span>}` nebo `{flag ? <A /> : <B />}`
- **Vykreslování seznamů**: Použijte `array.map()` pro vrácení seznamu prvků a zajistěte, aby každý prvek měl stabilní `key`.

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