:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/fields/specific/js-column).
:::

# JS Column

## Introducción

JS Column se utiliza para "columnas personalizadas" en tablas, renderizando el contenido de las celdas de cada fila a través de JavaScript. No se vincula a campos específicos, es adecuado para escenarios como columnas derivadas, visualización combinada de campos cruzados, insignias de estado, operaciones de botones, resumen de datos remotos, etc.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API de Contexto en Tiempo de Ejecución

Cada celda de JS Column puede utilizar las siguientes capacidades de contexto al renderizarse:

- `ctx.element`: El contenedor DOM de la celda actual (ElementProxy), admite `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.record`: El objeto de registro de la fila actual (solo lectura);
- `ctx.recordIndex`: El índice de la fila dentro de la página actual (comienza desde 0, puede verse afectado por la paginación);
- `ctx.collection`: Metainformación de la colección vinculada a la tabla (solo lectura);
- `ctx.requireAsync(url)`: Carga de forma asíncrona librerías AMD/UMD por URL;
- `ctx.importAsync(url)`: Importa dinámicamente módulos ESM por URL;
- `ctx.openView(options)`: Abre una vista configurada (ventana emergente/cajón/página);
- `ctx.i18n.t()` / `ctx.t()`: Internacionalización;
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza después de que el contenedor esté listo;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Librerías comunes integradas como React / ReactDOM / Ant Design / Iconos de Ant Design / dayjs / lodash / math.js / formula.js, utilizadas para renderizado JSX, procesamiento de tiempo, manipulación de datos y operaciones matemáticas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` se conservan por compatibilidad).
- `ctx.render(vnode)`: Renderiza elementos React/HTML/DOM en el contenedor predeterminado `ctx.element` (la celda actual). Múltiples renderizaciones reutilizarán el Root y sobrescribirán el contenido existente del contenedor.

## Editor y Fragmentos

El editor de scripts de JS Column admite resaltado de sintaxis, sugerencias de errores y fragmentos de código (Snippets) integrados.

- `Snippets`: Abre la lista de fragmentos de código integrados, puede buscar e insertar en la posición actual del cursor con un solo clic.
- `Run`: Ejecuta el código actual directamente, los registros de ejecución se muestran en el panel `Logs` inferior, admite `console.log/info/warn/error` y localización de errores con resaltado.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

Puede combinarse con empleados de IA para generar código:

- [Empleado de IA · Nathan: Ingeniero frontend](/ai-employees/features/built-in-employee)

## Usos Comunes

### 1) Renderizado Básico (Lectura del registro de la fila actual)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) Uso de JSX para Renderizar Componentes React

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) Abrir ventana emergente/cajón en una celda (Ver/Editar)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>Ver</a>
);
```

### 4) Cargar librerías de terceros (AMD/UMD o ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## Notas

- Se recomienda utilizar un CDN confiable para la carga de librerías externas y preparar un plan de respaldo para escenarios de falla (por ejemplo, `if (!lib) return;`).
- Se recomienda priorizar el uso de selectores `class` o `[name=...]` y evitar el uso de `id` fijos para prevenir la duplicación de `id` en múltiples bloques o ventanas emergentes.
- Limpieza de eventos: Las filas de la tabla pueden cambiar dinámicamente con la paginación o la actualización, y las celdas se renderizarán varias veces. Antes de vincular eventos, debe limpiarlos o eliminar duplicados para evitar activaciones repetidas.
- Sugerencia de rendimiento: Evite cargar repetidamente librerías grandes en cada celda; debe almacenar la librería en caché en una capa superior (como a través de variables globales o variables a nivel de tabla) y luego reutilizarla.