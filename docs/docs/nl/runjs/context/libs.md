:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/libs) voor nauwkeurige informatie.
:::

# ctx.libs

`ctx.libs` is de uniforme namespace voor ingebouwde bibliotheken in RunJS, met veelgebruikte bibliotheken zoals React, Ant Design, dayjs en lodash. **Er is geen `import` of asynchrone loding vereist**; ze kunnen rechtstreeks worden gebruikt via `ctx.libs.xxx`.

## Toepassingen

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Gebruik React + Ant Design om de UI te renderen, dayjs voor datumverwerking en lodash voor gegevensverwerking. |
| **Formule / Berekening** | Gebruik formula of math voor Excel-achtige formules en wiskundige bewerkingen. |
| **Workflow / Koppelingsregels** | Roep hulpprogramma-bibliotheken zoals lodash, dayjs en formula aan in scenario's met pure logica. |

## Overzicht van ingebouwde bibliotheken

| Eigenschap | Beschrijving | Documentatie |
|------|------|------|
| `ctx.libs.React` | React-kern, gebruikt voor JSX en Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM client-API (inclusief `createRoot`), gebruikt met React voor rendering | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design componentenbibliotheek (Button, Card, Table, Form, Input, Modal, etc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design iconenbibliotheek (bijv. PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Hulpprogramma-bibliotheek voor datum en tijd | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Hulpprogramma-bibliotheek (get, set, debounce, etc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel-achtige formule-functiebliotheek (SUM, AVERAGE, IF, etc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Bibliotheek voor wiskundige expressies en berekeningen | [Math.js](https://mathjs.org/docs/) |

## Aliassen op het hoogste niveau

Voor compatibiliteit met oudere code zijn sommige bibliotheken ook beschikbaar op het hoogste niveau: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` en `ctx.dayjs`. **Het wordt aanbevolen om consequent `ctx.libs.xxx` te gebruiken** voor eenvoudiger onderhoud en het doorzoeken van documentatie.

## Lazy Loading

`lodash`, `formula` en `math` maken gebruik van **lazy loading**: een dynamische import wordt pas geactiveerd wanneer `ctx.libs.lodash` voor de eerste keer wordt aangeroepen, waarna de cache wordt hergebruikt. `React`, `antd`, `dayjs` en `antdIcons` zijn vooraf geconfigureerd door de context en zijn onmiddellijk beschikbaar.

## Voorbeelden

### Renderen met React en Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Titel">
    <Button type="primary">Klik hier</Button>
  </Card>
);
```

### Hooks gebruiken

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

### Iconen gebruiken

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Gebruiker</Button>);
```

### Datumverwerking met dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Hulpprogramma-functies met lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Onbekend');
```

### Formuleberekeningen

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Wiskundige expressies met math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Aandachtspunten

- **Combineren met ctx.importAsync**: Als een externe React wordt geladen via `ctx.importAsync('react@19')`, zal JSX die instantie gebruiken. In dit geval moet u dit **niet** combineren met `ctx.libs.antd`. Ant Design moet worden geladen in overeenstemming met die React-versie (bijv. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Meerdere React-instanties**: Als de foutmelding "Invalid hook call" optreedt of als de hook dispatcher null is, wordt dit meestal veroorzaakt door meerdere React-instanties. Voordat u `ctx.libs.React` aanroept of Hooks gebruikt, voert u eerst `await ctx.importAsync('react@versie')` uit om ervoor te zorgen dat dezelfde React-instantie wordt gedeeld met de pagina.

## Gerelateerd

- [ctx.importAsync()](./import-async.md) - Laad externe ESM-modules op aanvraag (bijv. specifieke versies van React, Vue)
- [ctx.render()](./render.md) - Render inhoud naar een container