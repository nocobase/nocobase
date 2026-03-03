:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/jsx).
:::

# JSX

RunJS obsługuje składnię JSX, co pozwala na pisanie kodu podobnego do komponentów React. JSX jest automatycznie kompilowany przed wykonaniem.

## Uwagi dotyczące kompilacji

- Wykorzystuje [sucrase](https://github.com/alangpierce/sucrase) do transformacji JSX.
- JSX jest kompilowany do `ctx.libs.React.createElement` oraz `ctx.libs.React.Fragment`.
- **Brak konieczności importowania React**: Można pisać JSX bezpośrednio; po kompilacji automatycznie zostanie użyty `ctx.libs.React`.
- Podczas ładowania zewnętrznego Reacta poprzez `ctx.importAsync('react@x.x.x')`, JSX przełączy się na używanie metody `createElement` z tej konkretnej instancji.

## Korzystanie z wbudowanego Reacta i komponentów

RunJS posiada wbudowany React oraz popularne biblioteki UI. Można uzyskać do nich dostęp bezpośrednio przez `ctx.libs` bez użycia `import`:

- **ctx.libs.React** — rdzeń React
- **ctx.libs.ReactDOM** — ReactDOM (może być używany z `createRoot`, jeśli jest to wymagane)
- **ctx.libs.antd** — komponenty Ant Design
- **ctx.libs.antdIcons** — ikony Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Kliknij</Button>);
```

Pisząc bezpośrednio w JSX, nie muszą Państwo destrukturyzować Reacta. Jest to wymagane jedynie w przypadku korzystania z **Hooków** (takich jak `useState`, `useEffect`) lub **Fragmentów** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Licznik: {count}</div>;
};

ctx.render(<Counter />);
```

**Uwaga**: Wbudowany React oraz zewnętrzny React zaimportowany przez `ctx.importAsync()` **nie mogą być mieszane**. Jeśli używają Państwo zewnętrznej biblioteki UI, React również musi zostać zaimportowany z tego samego zewnętrznego źródła.

## Korzystanie z zewnętrznego Reacta i komponentów

Podczas ładowania określonej wersji Reacta i bibliotek UI za pomocą `ctx.importAsync()`, JSX będzie korzystać z tej instancji Reacta:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Kliknij</Button>);
```

Jeśli antd zależy od react/react-dom, można określić tę samą wersję poprzez `deps`, aby uniknąć wielu instancji:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Przycisk</Button>);
```

**Uwaga**: Korzystając z zewnętrznego Reacta, biblioteki UI takie jak antd również muszą zostać zaimportowane przez `ctx.importAsync()`. Nie należy ich mieszać z `ctx.libs.antd`.

## Kluczowe punkty składni JSX

- **Komponenty i właściwości (props)**: `<Button type="primary">Tekst</Button>`
- **Fragmenty**: `<>...</>` lub `<React.Fragment>...</React.Fragment>` (wymaga destrukturyzacji `const { React } = ctx.libs` podczas używania Fragmentu)
- **Wyrażenia**: W JSX należy używać `{wyrażenie}` do wstawiania zmiennych lub operacji, np. `{ctx.user.name}` lub `{count + 1}`. Nie należy używać składni szablonów `{{ }}`.
- **Renderowanie warunkowe**: `{flag && <span>Treść</span>}` lub `{flag ? <A /> : <B />}`
- **Renderowanie list**: Należy używać `array.map()` do zwracania listy elementów i upewnić się, że każdy element posiada stabilny klucz `key`.

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