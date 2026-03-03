:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` je sjednocený jmenný prostor pro vestavěné knihovny v RunJS, který obsahuje běžně používané knihovny jako React, Ant Design, dayjs a lodash. **Není vyžadován žádný `import` ani asynchronní načítání**; lze je použít přímo přes `ctx.libs.xxx`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Použití React + Ant Design pro vykreslování UI, dayjs pro práci s daty a lodash pro zpracování dat. |
| **Vzorce / Výpočty** | Použití formula nebo math pro vzorce podobné Excelu a operace s matematickými výrazy. |
| **Pracovní postup / Pravidla propojení** | Volání pomocných knihoven jako lodash, dayjs a formula v čistě logických scénářích. |

## Přehled vestavěných knihoven

| Vlastnost | Popis | Dokumentace |
|------|------|------|
| `ctx.libs.React` | Jádro Reactu, používané pro JSX a Hooky | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | Klientské API ReactDOM (včetně `createRoot`), používané s Reactem pro vykreslování | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Knihovna komponent Ant Design (Button, Card, Table, Form, Input, Modal atd.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Knihovna ikon Ant Design (např. PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Knihovna pro práci s datem a časem | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Pomocná knihovna (get, set, debounce atd.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Knihovna funkcí pro vzorce podobné Excelu (SUM, AVERAGE, IF atd.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Knihovna pro matematické výrazy a výpočty | [Math.js](https://mathjs.org/docs/) |

## Aliasy nejvyšší úrovně

Z důvodu kompatibility se starším kódem jsou některé knihovny dostupné také přímo v `ctx`: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` a `ctx.dayjs`. **Doporučujeme konzistentně používat `ctx.libs.xxx`** pro snazší údržbu a vyhledávání v dokumentaci.

## Líné načítání (Lazy Loading)

`lodash`, `formula` a `math` využívají **líné načítání**: dynamický import se spustí až při prvním přístupu k `ctx.libs.lodash` a poté se používá mezipaměť. `React`, `antd`, `dayjs` a `antdIcons` jsou přednastaveny kontextem a jsou k dispozici okamžitě.

## Příklady

### Vykreslování pomocí React a Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Titulek">
    <Button type="primary">Kliknout</Button>
  </Card>
);
```

### Použití Hooků

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

### Použití ikon

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Uživatel</Button>);
```

### Zpracování data pomocí dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Pomocné funkce s lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Výpočty pomocí vzorců

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Matematické výrazy s math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Poznámky

- **Míchání s ctx.importAsync**: Pokud je externí React načten přes `ctx.importAsync('react@19')`, JSX bude používat tuto instanci. V takovém případě jej **nekombinujte** s `ctx.libs.antd`. Ant Design musí být načten ve verzi odpovídající dané verzi Reactu (např. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Více instancí Reactu**: Pokud dojde k chybě „Invalid hook call“ nebo je hook dispatcher null, je to obvykle způsobeno více instancemi Reactu. Před čtením `ctx.libs.React` nebo voláním Hooků nejprve proveďte `await ctx.importAsync('react@verze')`, abyste zajistili sdílení stejné instance Reactu se stránkou.

## Související

- [ctx.importAsync()](./import-async.md) - Načítání externích ESM modulů podle potřeby (např. konkrétní verze React, Vue)
- [ctx.render()](./render.md) - Vykreslení obsahu do kontejneru