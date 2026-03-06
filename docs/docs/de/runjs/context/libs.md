:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` ist der einheitliche Namensraum für integrierte Bibliotheken in RunJS, der häufig verwendete Bibliotheken wie React, Ant Design, dayjs und lodash enthält. **Es ist kein `import` oder asynchrones Laden erforderlich**; sie können direkt über `ctx.libs.xxx` verwendet werden.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Verwenden Sie React + Ant Design zum Rendern der Benutzeroberfläche, dayjs für die Datumsverarbeitung und lodash für die Datenverarbeitung. |
| **Formel / Berechnung** | Verwenden Sie formula oder math für Excel-ähnliche Formeln und mathematische Ausdrucksoperationen. |
| **Workflow / Verknüpfungsregeln** | Rufen Sie Hilfsbibliotheken wie lodash, dayjs und formula in rein logischen Szenarien auf. |

## Übersicht der integrierten Bibliotheken

| Eigenschaft | Beschreibung | Dokumentation |
|------|------|------|
| `ctx.libs.React` | React-Kern, verwendet für JSX und Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM-Client-API (einschließlich `createRoot`), wird mit React zum Rendern verwendet | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design Komponentenbibliothek (Button, Card, Table, Form, Input, Modal usw.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design Symbolbibliothek (z. B. PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Bibliothek für Datums- und Zeitwerkzeuge | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Hilfsbibliothek (get, set, debounce usw.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel-ähnliche Formelfunktionsbibliothek (SUM, AVERAGE, IF usw.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Bibliothek für mathematische Ausdrücke und Berechnungen | [Math.js](https://mathjs.org/docs/) |

## Aliase auf oberster Ebene

Zur Kompatibilität mit älterem Code werden einige Bibliotheken auch auf der obersten Ebene bereitgestellt: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` und `ctx.dayjs`. **Es wird empfohlen, konsistent `ctx.libs.xxx` zu verwenden**, um die Wartung und die Suche in der Dokumentation zu erleichtern.

## Lazy Loading (Verzögertes Laden)

`lodash`, `formula` und `math` verwenden **Lazy Loading**: Ein dynamischer Import wird erst ausgelöst, wenn zum ersten Mal auf `ctx.libs.lodash` zugegriffen wird, und danach wird der Cache wiederverwendet. `React`, `antd`, `dayjs` und `antdIcons` sind durch den Kontext vorkonfiguriert und sofort verfügbar.

## Beispiele

### Rendern mit React und Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Titel">
    <Button type="primary">Klicken</Button>
  </Card>
);
```

### Verwendung von Hooks

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

### Verwendung von Symbolen

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Benutzer</Button>);
```

### Datumsverarbeitung mit dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Hilfsfunktionen mit lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unbekannt');
```

### Formelberechnungen

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Mathematische Ausdrücke mit math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// Ergebnis === 14
```

## Hinweise

- **Mischen mit ctx.importAsync**: Wenn ein externes React über `ctx.importAsync('react@19')` geladen wird, verwendet JSX diese Instanz. In diesem Fall dürfen Sie es **nicht** mit `ctx.libs.antd` mischen. Ant Design muss passend zu dieser React-Version geladen werden (z. B. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Mehrere React-Instanzen**: Wenn ein „Invalid hook call“ auftritt oder der Hook-Dispatcher null ist, wird dies normalerweise durch mehrere React-Instanzen verursacht. Bevor Sie `ctx.libs.React` lesen oder Hooks aufrufen, führen Sie zuerst `await ctx.importAsync('react@version')` aus, um sicherzustellen, dass dieselbe React-Instanz mit der Seite geteilt wird.

## Verwandte Themen

- [ctx.importAsync()](./import-async.md) – Laden externer ESM-Module bei Bedarf (z. B. spezifische Versionen von React, Vue)
- [ctx.render()](./render.md) – Inhalt in einen Container rendern