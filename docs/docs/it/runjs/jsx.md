:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/jsx).
:::

# JSX

RunJS supporta la sintassi JSX, consentendoLe di scrivere codice in modo simile ai componenti React. Il JSX viene compilato automaticamente prima dell'esecuzione.

## Note sulla compilazione

- Utilizza [sucrase](https://github.com/alangpierce/sucrase) per trasformare il JSX.
- Il JSX viene compilato in `ctx.libs.React.createElement` e `ctx.libs.React.Fragment`.
- **Non è necessario importare React**: può scrivere direttamente in JSX; dopo la compilazione, verrà utilizzato automaticamente `ctx.libs.React`.
- Quando si carica un React esterno tramite `ctx.importAsync('react@x.x.x')`, il JSX passerà all'utilizzo del metodo `createElement` di quella specifica istanza.

## Utilizzo di React e dei componenti integrati

RunJS include React e le comuni librerie UI integrate. Può accedervi direttamente tramite `ctx.libs` senza utilizzare `import`:

- **ctx.libs.React** — Core di React
- **ctx.libs.ReactDOM** — ReactDOM (può essere utilizzato con `createRoot` se necessario)
- **ctx.libs.antd** — Componenti Ant Design
- **ctx.libs.antdIcons** — Icone Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Clicca</Button>);
```

Quando scrive direttamente in JSX, non è necessario destrutturare React. È necessario destrutturarlo da `ctx.libs` solo quando si utilizzano gli **Hook** (come `useState`, `useEffect`) o i **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Conteggio: {count}</div>;
};

ctx.render(<Counter />);
```

**Nota**: Il React integrato e il React esterno importato tramite `ctx.importAsync()` **non possono essere mescolati**. Se utilizza una libreria UI esterna, anche React deve essere importato dalla stessa fonte esterna.

## Utilizzo di React e componenti esterni

Quando si carica una versione specifica di React e delle librerie UI tramite `ctx.importAsync()`, il JSX utilizzerà quell'istanza di React:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Clicca</Button>);
```

Se antd dipende da react/react-dom, può specificare la stessa versione tramite `deps` per evitare istanze multiple:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Pulsante</Button>);
```

**Nota**: Quando si utilizza un React esterno, anche le librerie UI come antd devono essere importate tramite `ctx.importAsync()`. Non le mescoli con `ctx.libs.antd`.

## Punti chiave della sintassi JSX

- **Componenti e props**: `<Button type="primary">Testo</Button>`
- **Fragment**: `<>...</>` o `<React.Fragment>...</React.Fragment>` (richiede la destrutturazione di `const { React } = ctx.libs` quando si usa Fragment)
- **Espressioni**: Utilizzi `{espressione}` in JSX per inserire variabili o operazioni, come `{ctx.user.name}` o `{count + 1}`. Non utilizzi la sintassi template `{{ }}`.
- **Rendering condizionale**: `{flag && <span>Contenuto</span>}` o `{flag ? <A /> : <B />}`
- **Rendering di liste**: Utilizzi `array.map()` per restituire un elenco di elementi e si assicuri che ogni elemento abbia una `key` stabile.

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