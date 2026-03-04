:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` è lo spazio dei nomi (namespace) unificato per le librerie integrate in RunJS, che contiene librerie di uso comune come React, Ant Design, dayjs e lodash. **Non è richiesto alcun `import` o caricamento asincrono**; possono essere utilizzate direttamente tramite `ctx.libs.xxx`.

## Scenari d'uso

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Utilizzo di React + Ant Design per il rendering dell'interfaccia utente (UI), dayjs per la gestione delle date e lodash per l'elaborazione dei dati. |
| **Formule / Calcoli** | Utilizzo di formula o math per formule in stile Excel e operazioni con espressioni matematiche. |
| **Flussi di lavoro / Regole di concatenazione** | Chiamata a librerie di utilità come lodash, dayjs e formula in scenari di pura logica. |

## Panoramica delle librerie integrate

| Proprietà | Descrizione | Documentazione |
|------|------|------|
| `ctx.libs.React` | Core di React, utilizzato per JSX e Hook | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API client di ReactDOM (incluso `createRoot`), utilizzato con React per il rendering | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Libreria di componenti Ant Design (Button, Card, Table, Form, Input, Modal, ecc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Libreria di icone Ant Design (es. PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Libreria di utilità per date e orari | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Libreria di utilità (get, set, debounce, ecc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Libreria di funzioni per formule in stile Excel (SUM, AVERAGE, IF, ecc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Libreria per espressioni matematiche e calcoli | [Math.js](https://mathjs.org/docs/) |

## Alias di primo livello

Per compatibilità con il codice legacy, alcune librerie sono esposte anche al livello superiore: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` e `ctx.dayjs`. **Si raccomanda di utilizzare coerentemente `ctx.libs.xxx`** per facilitare la manutenzione e la ricerca nella documentazione.

## Caricamento pigro (Lazy Loading)

`lodash`, `formula` e `math` utilizzano il **caricamento pigro**: un import dinamico viene attivato solo quando si accede a `ctx.libs.lodash` per la prima volta, e la cache viene riutilizzata successivamente. `React`, `antd`, `dayjs` e `antdIcons` sono pre-configurati dal contesto e sono disponibili immediatamente.

## Esempi

### Rendering con React e Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Titolo">
    <Button type="primary">Clicca qui</Button>
  </Card>
);
```

### Utilizzo degli Hook

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### Utilizzo delle icone

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Utente</Button>);
```

### Gestione delle date con dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Funzioni di utilità con lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Sconosciuto');
```

### Calcoli con formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Espressioni matematiche con math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Note

- **Integrazione con ctx.importAsync**: Se viene caricata una versione esterna di React tramite `ctx.importAsync('react@19')`, JSX utilizzerà quell'istanza. In questo caso, **non** la mescoli con `ctx.libs.antd`. Ant Design deve essere caricato in modo che corrisponda a quella versione di React (es. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Istanze multiple di React**: Se si verifica l'errore "Invalid hook call" o se l'hook dispatcher è nullo, solitamente la causa è la presenza di più istanze di React. Prima di leggere `ctx.libs.React` o chiamare gli Hook, esegua `await ctx.importAsync('react@versione')` per assicurarsi che venga condivisa la stessa istanza di React con la pagina.

## Correlati

- [ctx.importAsync()](./import-async.md) - Caricare moduli ESM esterni su richiesta (es. versioni specifiche di React, Vue)
- [ctx.render()](./render.md) - Renderizzare contenuti in un contenitore