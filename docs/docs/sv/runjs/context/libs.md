:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` är det enhetliga namnrymden för inbyggda bibliotek i RunJS, och innehåller vanliga bibliotek som React, Ant Design, dayjs och lodash. **Ingen `import` eller asynkron laddning krävs**; de kan användas direkt via `ctx.libs.xxx`.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Använd React + Ant Design för att rendera UI, dayjs för datumhantering och lodash för databehandling. |
| **Formel / Beräkning** | Använd formula eller math för Excel-liknande formler och matematiska uttryck. |
| **Arbetsflöde / Länkningsregler** | Anropa verktygsbibliotek som lodash, dayjs och formula i rena logikscenarier. |

## Översikt över inbyggda bibliotek

| Egenskap | Beskrivning | Dokumentation |
|------|------|------|
| `ctx.libs.React` | React-kärnan, används för JSX och Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM-klient-API (inklusive `createRoot`), används med React för rendering | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design-komponentbibliotek (Button, Card, Table, Form, Input, Modal, etc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design-ikonbibliotek (t.ex. PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Verktygsbibliotek för datum och tid | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Verktygsbibliotek (get, set, debounce, etc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel-liknande formelbibliotek (SUM, AVERAGE, IF, etc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Bibliotek för matematiska uttryck och beräkningar | [Math.js](https://mathjs.org/docs/) |

## Alias på toppnivå

För kompatibilitet med äldre kod exponeras vissa bibliotek även på toppnivå: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` och `ctx.dayjs`. **Det rekommenderas att ni konsekvent använder `ctx.libs.xxx`** för enklare underhåll och dokumentsökning.

## Lazy Loading

`lodash`, `formula` och `math` använder **lazy loading**: en dynamisk import utlöses först när `ctx.libs.lodash` anropas för första gången, och därefter återanvänds cachen. `React`, `antd`, `dayjs` och `antdIcons` är förkonfigurerade av kontexten och är tillgängliga omedelbart.

## Exempel

### Rendering med React och Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Rubrik">
    <Button type="primary">Klicka</Button>
  </Card>
);
```

### Använda Hooks

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

### Använda ikoner

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Användare</Button>);
```

### Datumhantering med dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Verktygsfunktioner med lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Formelberäkningar

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Matematiska uttryck med math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Observera

- **Blandning med ctx.importAsync**: Om en extern React laddas via `ctx.importAsync('react@19')` kommer JSX att använda den instansen. I detta fall ska ni **inte** blanda den med `ctx.libs.antd`. Ant Design måste laddas för att matcha den React-versionen (t.ex. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Flera React-instanser**: Om "Invalid hook call" uppstår eller om hook-dispatchern är null, beror det vanligtvis på flera React-instanser. Innan ni läser `ctx.libs.React` eller anropar Hooks, kör först `await ctx.importAsync('react@version')` för att säkerställa att samma React-instans delas med sidan.

## Relaterat

- [ctx.importAsync()](./import-async.md) - Ladda externa ESM-moduler vid behov (t.ex. specifika versioner av React, Vue)
- [ctx.render()](./render.md) - Rendera innehåll till en behållare