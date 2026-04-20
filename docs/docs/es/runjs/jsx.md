:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/jsx).
:::

# JSX

RunJS admite la sintaxis JSX, lo que le permite escribir código de forma similar a los componentes de React. JSX se compila automáticamente antes de la ejecución.

## Notas de compilación

- Utiliza [sucrase](https://github.com/alangpierce/sucrase) para transformar JSX.
- JSX se compila en `ctx.libs.React.createElement` y `ctx.libs.React.Fragment`.
- **No es necesario importar React**: puede escribir JSX directamente; se utilizará automáticamente `ctx.libs.React` después de la compilación.
- Al cargar un React externo mediante `ctx.importAsync('react@x.x.x')`, JSX cambiará para utilizar el método `createElement` de esa instancia específica.

## Uso de React y componentes integrados

RunJS incluye React y librerías de UI comunes de forma integrada. Puede acceder a ellas directamente a través de `ctx.libs` sin necesidad de usar `import`:

- **ctx.libs.React** — Núcleo de React
- **ctx.libs.ReactDOM** — ReactDOM (puede usarse con `createRoot` si es necesario)
- **ctx.libs.antd** — Componentes de Ant Design
- **ctx.libs.antdIcons** — Iconos de Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Hacer clic</Button>);
```

Al escribir JSX directamente, no es necesario desestructurar React. Solo necesita desestructurarlo desde `ctx.libs` cuando utilice **Hooks** (como `useState`, `useEffect`) o **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Contador: {count}</div>;
};

ctx.render(<Counter />);
```

**Nota**: El React integrado y el React externo importado a través de `ctx.importAsync()` **no se pueden mezclar**. Si utiliza una librería de UI externa, React también debe importarse desde la misma fuente externa.

## Uso de React y componentes externos

Al cargar una versión específica de React y librerías de UI mediante `ctx.importAsync()`, JSX utilizará esa instancia de React:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Hacer clic</Button>);
```

Si antd depende de react/react-dom, puede especificar la misma versión a través de `deps` para evitar múltiples instancias:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Botón</Button>);
```

**Nota**: Al usar un React externo, las librerías de UI como antd también deben importarse mediante `ctx.importAsync()`. No las mezcle con `ctx.libs.antd`.

## Puntos clave de la sintaxis JSX

- **Componentes y props**: `<Button type="primary">Texto</Button>`
- **Fragment**: `<>...</>` o `<React.Fragment>...</React.Fragment>` (requiere desestructurar `const { React } = ctx.libs` al usar Fragment)
- **Expresiones**: Use `{expresión}` en JSX para insertar variables u operaciones, como `{ctx.user.name}` o `{count + 1}`. No utilice la sintaxis de plantilla `{{ }}`.
- **Renderizado condicional**: `{flag && <span>Contenido</span>}` o `{flag ? <A /> : <B />}`
- **Renderizado de listas**: Use `array.map()` para devolver una lista de elementos y asegúrese de que cada elemento tenga una `key` estable.

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