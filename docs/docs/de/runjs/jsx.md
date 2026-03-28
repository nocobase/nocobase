:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/jsx).
:::

# JSX

RunJS unterstützt die JSX-Syntax, sodass Sie Code wie React-Komponenten schreiben können. JSX wird vor der Ausführung automatisch kompiliert.

## Kompilierungshinweise

- Verwendet [sucrase](https://github.com/alangpierce/sucrase) zur Transformation von JSX.
- JSX wird in `ctx.libs.React.createElement` und `ctx.libs.React.Fragment` kompiliert.
- **Kein Import von React erforderlich**: Sie können JSX direkt schreiben; nach der Kompilierung wird automatisch `ctx.libs.React` verwendet.
- Wenn externes React über `ctx.importAsync('react@x.x.x')` geladen wird, verwendet JSX die `createElement`-Methode dieser spezifischen Instanz.

## Verwendung von integriertem React und Komponenten

RunJS enthält React und gängige UI-Bibliotheken bereits integriert. Sie können direkt über `ctx.libs` darauf zugreifen, ohne `import` zu verwenden:

- **ctx.libs.React** — React-Kern
- **ctx.libs.ReactDOM** — ReactDOM (kann bei Bedarf mit `createRoot` verwendet werden)
- **ctx.libs.antd** — Ant Design-Komponenten
- **ctx.libs.antdIcons** — Ant Design-Icons

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klicken</Button>);
```

Wenn Sie JSX direkt schreiben, müssen Sie React nicht destrukturieren. Eine Destrukturierung aus `ctx.libs` ist nur erforderlich, wenn Sie **Hooks** (wie `useState`, `useEffect`) oder **Fragments** (`<>...</>`) verwenden:

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Zähler: {count}</div>;
};

ctx.render(<Counter />);
```

**Hinweis**: Integriertes React und externes React, das über `ctx.importAsync()` importiert wurde, **dürfen nicht gemischt werden**. Wenn Sie eine externe UI-Bibliothek verwenden, muss React ebenfalls aus derselben externen Quelle importiert werden.

## Verwendung von externem React und Komponenten

Beim Laden einer bestimmten Version von React und UI-Bibliotheken über `ctx.importAsync()` verwendet JSX diese React-Instanz:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Klicken</Button>);
```

Falls antd von react/react-dom abhängt, können Sie über `deps` dieselbe Version angeben, um mehrere Instanzen zu vermeiden:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Hinweis**: Bei der Verwendung von externem React müssen auch UI-Bibliotheken wie antd über `ctx.importAsync()` importiert werden. Mischen Sie diese nicht mit `ctx.libs.antd`.

## JSX-Syntax-Kernpunkte

- **Komponenten und Props**: `<Button type="primary">Text</Button>`
- **Fragment**: `<>...</>` oder `<React.Fragment>...</React.Fragment>` (erfordert die Destrukturierung von `const { React } = ctx.libs` bei Verwendung von Fragment)
- **Ausdrücke**: Verwenden Sie `{Ausdruck}` in JSX, um Variablen oder Operationen einzufügen, wie `{ctx.user.name}` oder `{count + 1}`. Verwenden Sie keine `{{ }}` Template-Syntax.
- **Bedingtes Rendering**: `{flag && <span>Inhalt</span>}` oder `{flag ? <A /> : <B />}`
- **Listen-Rendering**: Verwenden Sie `array.map()`, um eine Liste von Elementen zurückzugeben, und stellen Sie sicher, dass jedes Element einen stabilen `key` besitzt.

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