:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/fields/specific/js-field).
:::

# JS Field

## Introducción

JS Field se utiliza para renderizar contenido personalizado con JavaScript en la posición de un campo, comúnmente en bloques de detalles, elementos de solo lectura en formularios o como "Otros elementos personalizados" en columnas de tablas. Es adecuado para realizar presentaciones personalizadas, combinaciones de información derivada, insignias de estado, texto enriquecido o renderizado de gráficos, entre otros.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## Tipos

- Tipo solo lectura: Se utiliza para visualización no editable, lee `ctx.value` para renderizar la salida.
- Tipo editable: Se utiliza para interacciones de entrada personalizadas, proporciona `ctx.getValue()`/`ctx.setValue(v)` y el evento de contenedor `js-field:value-change`, facilitando la sincronización bidireccional con los valores del formulario.

## Escenarios de uso

- Tipo solo lectura
  - Bloque de detalles: Muestra contenido de solo lectura como resultados de cálculos, insignias de estado, fragmentos de texto enriquecido, gráficos, etc.;
  - Bloque de tabla: Se utiliza como "Otras columnas personalizadas > JS Field" para visualización de solo lectura (si necesita una columna que no esté vinculada a un campo, utilice JS Column);

- Tipo editable
  - Bloque de formulario (CreateForm/EditForm): Se utiliza para controles de entrada personalizados o entradas compuestas, junto con la validación y el envío del formulario;
  - Escenarios adecuados: Componentes de entrada de librerías externas, editores de texto enriquecido/código, componentes dinámicos complejos, etc.;

## API de contexto en tiempo de ejecución

El código en tiempo de ejecución de JS Field puede utilizar directamente las siguientes capacidades de contexto:

- `ctx.element`: Contenedor DOM del campo (ElementProxy), admite `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.value`: Valor actual del campo (solo lectura);
- `ctx.record`: Objeto de registro actual (solo lectura);
- `ctx.collection`: Metainformación de la colección a la que pertenece el campo (solo lectura);
- `ctx.requireAsync(url)`: Carga asíncronamente librerías AMD/UMD por URL;
- `ctx.importAsync(url)`: Importa dinámicamente módulos ESM por URL;
- `ctx.openView(options)`: Abre una vista configurada (ventana emergente/cajón/página);
- `ctx.i18n.t()` / `ctx.t()`: Internacionalización;
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza después de que el contenedor esté listo;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Librerías comunes integradas como React / ReactDOM / Ant Design / Iconos de Ant Design / dayjs / lodash / math.js / formula.js, utilizadas para renderizado JSX, procesamiento de tiempo, manipulación de datos y operaciones matemáticas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` aún se conservan por compatibilidad).
- `ctx.render(vnode)`: Renderiza elementos React, cadenas HTML o nodos DOM en el contenedor predeterminado `ctx.element`; las renderizaciones repetidas reutilizarán el Root y sobrescribirán el contenido existente del contenedor.

Específico para el tipo editable (JSEditableField):

- `ctx.getValue()`: Obtiene el valor actual del formulario (prioriza el estado del formulario, luego recurre a las props del campo).
- `ctx.setValue(v)`: Establece el valor del formulario y las props del campo, manteniendo la sincronización bidireccional.
- Evento de contenedor `js-field:value-change`: Se activa cuando cambia el valor externo, facilitando que el script actualice la visualización de la entrada.

## Editor y fragmentos

El editor de scripts de JS Field admite resaltado de sintaxis, sugerencias de errores y fragmentos de código integrados (Snippets).

- `Snippets`: Abre la lista de fragmentos de código integrados, puede buscar e insertar en la posición actual del cursor con un clic.
- `Run`: Ejecuta directamente el código actual, la salida del registro de ejecución se muestra en el panel inferior `Logs`, admite `console.log/info/warn/error` y localización de errores con resaltado.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

Puede combinarse con el empleado de IA para generar código:

- [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/features/built-in-employee)

## Usos comunes

### 1) Renderizado básico (lectura del valor del campo)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) Uso de JSX para renderizar componentes React

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) Carga de librerías de terceros (AMD/UMD o ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) Clic para abrir ventana emergente/cajón (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">Ver detalles</a>`;
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

### 5) Entrada editable (JSEditableFieldModel)

```js
// Renderiza una entrada simple con JSX y sincroniza el valor del formulario
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

// Sincroniza con la entrada cuando cambia el valor externo (opcional)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## Notas

- Se recomienda utilizar un CDN confiable para la carga de librerías externas y preparar un plan de respaldo para escenarios de falla (por ejemplo, `if (!lib) return;`).
- Se sugiere priorizar el uso de `class` o `[name=...]` para los selectores, evite usar `id` fijos para prevenir la duplicidad de `id` en múltiples bloques o ventanas emergentes.
- Limpieza de eventos: El campo puede renderizarse varias veces debido a cambios en los datos o cambios de vista; antes de vincular eventos, debe limpiarlos o eliminar duplicados para evitar activaciones repetidas. Puede "eliminar primero y luego añadir".