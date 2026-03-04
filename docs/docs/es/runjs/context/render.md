:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/render).
:::

# ctx.render()

Renderiza elementos de React, cadenas HTML o nodos DOM en un contenedor especificado. Si no se proporciona un `container`, por defecto se renderiza en `ctx.element` y hereda automáticamente el contexto de la aplicación, como ConfigProvider y los temas.

## Casos de uso

| Escenario | Descripción |
|------|------|
| **JSBlock** | Renderizar contenido personalizado de bloques (gráficos, listas, tarjetas, etc.) |
| **JSField / JSItem / JSColumn** | Renderizar visualizaciones personalizadas para campos editables o columnas de tablas |
| **Bloque de detalles** | Personalizar el formato de visualización de los campos en las páginas de detalles |

> Nota: `ctx.render()` requiere un contenedor de renderizado. Si no se pasa un `container` y `ctx.element` no existe (por ejemplo, en escenarios de lógica pura sin interfaz de usuario), se lanzará un error.

## Definición de tipos

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Contenido a renderizar |
| `container` | `Element` \| `DocumentFragment` (Opcional) | Contenedor de destino para el renderizado, por defecto es `ctx.element` |

**Valor de retorno**:

- Al renderizar un **elemento de React**: Devuelve `ReactDOMClient.Root`, lo que facilita llamar a `root.render()` para actualizaciones posteriores.
- Al renderizar una **cadena HTML** o un **nodo DOM**: Devuelve `null`.

## Descripción del tipo vnode

| Tipo | Comportamiento |
|------|------|
| `React.ReactElement` (JSX) | Se renderiza utilizando `createRoot` de React, proporcionando todas las capacidades de React y heredando automáticamente el contexto de la aplicación. |
| `string` | Establece el `innerHTML` del contenedor después de la limpieza con DOMPurify; cualquier raíz de React existente se desmontará primero. |
| `Node` (Element, Text, etc.) | Se añade mediante `appendChild` después de vaciar el contenedor; cualquier raíz de React existente se desmontará primero. |
| `DocumentFragment` | Añade los nodos hijos del fragmento al contenedor; cualquier raíz de React existente se desmontará primero. |

## Ejemplos

### Renderizado de elementos de React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Título')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clic realizado'))}>
      {ctx.t('Botón')}
    </Button>
  </Card>
);
```

### Renderizado de cadenas HTML

```ts
ctx.render('<h1>Hola Mundo</h1>');

// Combinación con ctx.t para internacionalización
ctx.render('<div style="padding:16px">' + ctx.t('Contenido') + '</div>');

// Renderizado condicional
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Sin datos') + '</span>');
```

### Renderizado de nodos DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hola Mundo';
ctx.render(div);

// Primero se renderiza un contenedor vacío y luego se entrega a una biblioteca de terceros (como ECharts) para su inicialización
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Especificación de un contenedor personalizado

```ts
// Renderizar en un elemento DOM específico
const customEl = document.getElementById('my-container');
ctx.render(<div>Contenido</div>, customEl);
```

### Las llamadas múltiples reemplazarán el contenido

```ts
// La segunda llamada reemplazará el contenido existente en el contenedor
ctx.render(<div>Primera vez</div>);
ctx.render(<div>Segunda vez</div>);  // Solo se muestra "Segunda vez"
```

## Notas

- **Las llamadas múltiples reemplazarán el contenido**: Cada llamada a `ctx.render()` reemplaza el contenido existente en el contenedor en lugar de añadirlo.
- **Seguridad de las cadenas HTML**: El HTML pasado se limpia mediante DOMPurify para reducir los riesgos de XSS, pero aun así se recomienda evitar la concatenación de entradas de usuario no confiables.
- **No manipule ctx.element directamente**: `ctx.element.innerHTML` está en desuso; en su lugar, debe utilizarse `ctx.render()` de forma consistente.
- **Pase el contenedor cuando no exista uno por defecto**: En escenarios donde `ctx.element` es `undefined` (por ejemplo, dentro de módulos cargados a través de `ctx.importAsync`), se debe proporcionar explícitamente un `container`.

## Relacionado

- [ctx.element](./element.md) - Contenedor de renderizado por defecto, se utiliza cuando no se pasa un contenedor a `ctx.render()`.
- [ctx.libs](./libs.md) - Bibliotecas integradas como React y Ant Design, utilizadas para el renderizado de JSX.
- [ctx.importAsync()](./import-async.md) - Se utiliza en conjunto con `ctx.render()` después de cargar bibliotecas externas de React o componentes bajo demanda.