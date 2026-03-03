:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` es el espacio de nombres unificado para las librerías integradas en RunJS, que contiene librerías de uso común como React, Ant Design, dayjs y lodash. **No se requiere `import` ni carga asíncrona**; se pueden utilizar directamente a través de `ctx.libs.xxx`.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Utilice React + Ant Design para renderizar la interfaz de usuario, dayjs para el manejo de fechas y lodash para el procesamiento de datos. |
| **Fórmula / Cálculo** | Utilice formula o math para fórmulas similares a Excel y operaciones de expresiones matemáticas. |
| **Flujo de trabajo / Reglas de vinculación** | Invoque librerías de utilidades como lodash, dayjs y formula en escenarios de lógica pura. |

## Resumen de librerías integradas

| Propiedad | Descripción | Documentación |
|------|------|------|
| `ctx.libs.React` | Núcleo de React, utilizado para JSX y Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API de cliente de ReactDOM (incluyendo `createRoot`), se usa con React para el renderizado | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Librería de componentes de Ant Design (Button, Card, Table, Form, Input, Modal, etc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Librería de iconos de Ant Design (ej. PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Librería de utilidades para fecha y hora | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Librería de utilidades (get, set, debounce, etc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Librería de funciones de fórmulas similares a Excel (SUM, AVERAGE, IF, etc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Librería de expresiones matemáticas y cálculos | [Math.js](https://mathjs.org/docs/) |

## Alias de nivel superior

Para mantener la compatibilidad con el código heredado, algunas librerías también están expuestas en el nivel superior: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` y `ctx.dayjs`. **Se recomienda utilizar de forma consistente `ctx.libs.xxx`** para facilitar el mantenimiento y la búsqueda en la documentación.

## Carga perezosa (Lazy Loading)

`lodash`, `formula` y `math` utilizan **carga perezosa**: se activa una importación dinámica solo cuando se accede a `ctx.libs.lodash` por primera vez, y a partir de ahí se reutiliza la caché. `React`, `antd`, `dayjs` y `antdIcons` están preconfigurados por el contexto y están disponibles de inmediato.

## Ejemplos

### Renderizado con React y Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Título">
    <Button type="primary">Hacer clic</Button>
  </Card>
);
```

### Uso de Hooks

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

### Uso de iconos

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Usuario</Button>);
```

### Procesamiento de fechas con dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Funciones de utilidad con lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Cálculos con formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Expresiones matemáticas con math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Notas

- **Mezcla con ctx.importAsync**: Si se carga un React externo a través de `ctx.importAsync('react@19')`, JSX utilizará esa instancia. En este caso, **no** lo mezcle con `ctx.libs.antd`. Ant Design debe cargarse para que coincida con esa versión de React (ej. `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Múltiples instancias de React**: Si ocurre el error "Invalid hook call" o el despachador de hooks es nulo, generalmente se debe a la existencia de múltiples instancias de React. Antes de leer `ctx.libs.React` o llamar a Hooks, ejecute primero `await ctx.importAsync('react@version')` para asegurarse de que se comparta la misma instancia de React con la página.

## Relacionado

- [ctx.importAsync()](./import-async.md) - Carga de módulos ESM externos bajo demanda (ej. versiones específicas de React, Vue)
- [ctx.render()](./render.md) - Renderizar contenido en un contenedor