:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` to ujednolicona przestrzeń nazw dla wbudowanych bibliotek w RunJS, zawierająca powszechnie używane biblioteki, takie jak React, Ant Design, dayjs i lodash. **Nie jest wymagany `import` ani ładowanie asynchroniczne**; można z nich korzystać bezpośrednio poprzez `ctx.libs.xxx`.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Użycie React + Ant Design do renderowania interfejsu użytkownika, dayjs do obsługi dat oraz lodash do przetwarzania danych. |
| **Formuły / Obliczenia** | Użycie formula lub math do formuł typu Excel i operacji na wyrażeniach matematycznych. |
| **Przepływ pracy / Reguły powiązań** | Wywoływanie bibliotek narzędziowych, takich jak lodash, dayjs i formula w scenariuszach czysto logicznych. |

## Przegląd wbudowanych bibliotek

| Właściwość | Opis | Dokumentacja |
|------|------|------|
| `ctx.libs.React` | Rdzeń React, używany do JSX i Hooków | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | Klient API ReactDOM (w tym `createRoot`), używany z React do renderowania | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Biblioteka komponentów Ant Design (Button, Card, Table, Form, Input, Modal itp.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Biblioteka ikon Ant Design (np. PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Biblioteka narzędziowa do dat i czasu | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Biblioteka narzędziowa (get, set, debounce itp.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Biblioteka funkcji formuł typu Excel (SUM, AVERAGE, IF itp.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Biblioteka wyrażeń matematycznych i obliczeń | [Math.js](https://mathjs.org/docs/) |

## Aliasy najwyższego poziomu

Ze względu na kompatybilność ze starszym kodem, niektóre biblioteki są również dostępne bezpośrednio w obiekcie kontekstu: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` i `ctx.dayjs`. **Zaleca się jednak konsekwentne używanie `ctx.libs.xxx`** w celu łatwiejszego utrzymania kodu i przeszukiwania dokumentacji.

## Leniwe ładowanie (Lazy Loading)

Biblioteki `lodash`, `formula` i `math` wykorzystują **leniwe ładowanie**: dynamiczny import jest wyzwalany dopiero przy pierwszym odwołaniu do `ctx.libs.lodash`, a następnie wynik jest pobierany z pamięci podręcznej. `React`, `antd`, `dayjs` i `antdIcons` są wstępnie skonfigurowane w kontekście i dostępne natychmiast.

## Przykłady

### Renderowanie z React i Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Tytuł">
    <Button type="primary">Kliknij</Button>
  </Card>
);
```

### Użycie Hooków

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

### Użycie ikon

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Użytkownik</Button>);
```

### Przetwarzanie dat za pomocą dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Funkcje narzędziowe lodash

```ts
const user = { profile: { name: 'Alicja' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Nieznany');
```

### Obliczenia formuł

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Wyrażenia matematyczne z math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Uwagi

- **Mieszanie z ctx.importAsync**: Jeśli zewnętrzna wersja React zostanie załadowana przez `ctx.importAsync('react@19')`, JSX będzie używać tej instancji. W takim przypadku **nie należy** mieszać jej z `ctx.libs.antd`. Ant Design musi zostać załadowany w wersji pasującej do tej konkretnej wersji React (np. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Wiele instancji React**: Jeśli wystąpi błąd „Invalid hook call” lub dyspenser hooków (hook dispatcher) ma wartość null, jest to zazwyczaj spowodowane obecnością wielu instancji React. Przed odczytem `ctx.libs.React` lub wywołaniem Hooków należy najpierw wykonać `await ctx.importAsync('react@wersja')`, aby upewnić się, że używana jest ta sama instancja React, co na stronie.

## Powiązane

- [ctx.importAsync()](./import-async.md) - Ładowanie zewnętrznych modułów ESM na żądanie (np. konkretnych wersji React, Vue)
- [ctx.render()](./render.md) - Renderowanie zawartości do kontenera