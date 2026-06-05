:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Campo JS

## Introducción

El Campo JS se utiliza para renderizar contenido personalizado con JavaScript en la posición de un campo. Es comúnmente empleado en bloques de detalles, elementos de solo lectura en formularios o como "Otros elementos personalizados" en columnas de tablas. Es ideal para mostrar información personalizada, combinar datos derivados, renderizar insignias de estado, texto enriquecido o gráficos.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipos

- De solo lectura: Se utiliza para mostrar contenido no editable, leyendo `ctx.value` para renderizar la salida.
- Editable: Se emplea para interacciones de entrada personalizadas. Proporciona `ctx.getValue()`/`ctx.setValue(v)` y un evento de contenedor `js-field:value-change` para facilitar la sincronización bidireccional con los valores del formulario.

## Casos de Uso

- De solo lectura
  - Bloque de detalles: Para mostrar contenido de solo lectura como resultados de cálculos, insignias de estado, fragmentos de texto enriquecido, gráficos, etc.
  - Bloque de tabla: Se utiliza como "Otras columnas personalizadas > Campo JS" para mostrar contenido de solo lectura (si necesita una columna no vinculada a un campo, por favor, use Columna JS).

- Editable
  - Bloque de formulario (CreateForm/EditForm): Para controles de entrada personalizados o entradas compuestas, que se validan y envían junto con el formulario.
  - Ideal para escenarios como: componentes de entrada de librerías externas, editores de texto enriquecido/código, componentes dinámicos complejos, etc.

## API de Contexto en Tiempo de Ejecución

El código en tiempo de ejecución del Campo JS puede utilizar directamente las siguientes capacidades de contexto:

- `ctx.element`: El contenedor DOM del campo (ElementProxy), compatible con `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.value`: El valor actual del campo (solo lectura).
- `ctx.record`: El objeto de registro actual (solo lectura).
- `ctx.collection`: Metadatos de la colección a la que pertenece el campo (solo lectura).
- `ctx.requireAsync(url)`: Carga asíncronamente una librería AMD/UMD por URL.
- `ctx.importAsync(url)`: Importa dinámicamente un módulo ESM por URL.
- `ctx.openView(options)`: Abre una vista configurada (ventana emergente/cajón lateral/página).
- `ctx.i18n.t()` / `ctx.t()`: Internacionalización.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza después de que el contenedor esté listo.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Librerías integradas como React, ReactDOM, Ant Design, iconos de Ant Design y dayjs, utilizadas para la renderización JSX y utilidades de fecha y hora. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` se mantienen por compatibilidad.)
- `ctx.render(vnode)`: Renderiza un elemento React, una cadena HTML o un nodo DOM en el contenedor predeterminado `ctx.element`. La renderización repetida reutilizará el Root y sobrescribirá el contenido existente del contenedor.

Específico para el tipo Editable (JSEditableField):

- `ctx.getValue()`: Obtiene el valor actual del formulario (prioriza el estado del formulario, luego recurre a las propiedades del campo).
- `ctx.setValue(v)`: Establece el valor del formulario y las propiedades del campo, manteniendo la sincronización bidireccional.
- Evento del contenedor `js-field:value-change`: Se activa cuando un valor externo cambia, facilitando que el script actualice la visualización de la entrada.

## Editor y Fragmentos de Código

El editor de scripts del Campo JS es compatible con el resaltado de sintaxis, sugerencias de errores y fragmentos de código (Snippets) integrados.

- `Snippets`: Abre una lista de fragmentos de código predefinidos, que se pueden buscar e insertar en la posición actual del cursor con un solo clic.
- `Run`: Ejecuta directamente el código actual. El registro de ejecución se muestra en el panel `Logs` inferior, compatible con `console.log/info/warn/error` y resaltado de errores para una fácil localización.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

También puede generar código con el Empleado de IA:

- [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/built-in/ai-coding)

## Usos Comunes

### 1) Renderizado Básico (Lectura del Valor del Campo)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Uso de JSX para Renderizar un Componente React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Carga de Librerías de Terceros (AMD/UMD o ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Clic para Abrir una Ventana Emergente/Cajón Lateral (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Ver Detalles</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) Entrada Editable (JSEditableFieldModel)

```js
// Renderiza una entrada simple usando JSX y sincroniza el valor del formulario
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// Sincroniza la entrada cuando el valor externo cambia (opcional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Notas

- Se recomienda utilizar un CDN de confianza para cargar librerías externas y prever un mecanismo de respaldo para escenarios de fallo (por ejemplo, `if (!lib) return;`).
- Para los selectores, se aconseja priorizar el uso de `class` o `[name=...]`, y evitar el uso de `id` fijos para prevenir duplicidades en múltiples bloques o ventanas emergentes.
- Limpieza de eventos: Un campo puede renderizarse varias veces debido a cambios en los datos o a la conmutación de vistas. Antes de vincular un evento, debe limpiarlo o eliminar duplicados para evitar activaciones repetidas. Puede "primero eliminar y luego añadir".