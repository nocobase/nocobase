:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Columna JS

## Introducción

La Columna JS se utiliza para las "columnas personalizadas" en las tablas, renderizando el contenido de cada celda de una fila mediante JavaScript. No está vinculada a un campo específico y es ideal para escenarios como columnas derivadas, visualizaciones combinadas de varios campos, insignias de estado, botones de acción y agregación de datos remotos.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## API de Contexto en Tiempo de Ejecución

Al renderizar cada celda, la Columna JS proporciona las siguientes capacidades de API de contexto:

- `ctx.element`: El contenedor DOM de la celda actual (ElementProxy), compatible con `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.record`: El objeto de registro de la fila actual (solo lectura).
- `ctx.recordIndex`: El índice de la fila dentro de la página actual (comienza en 0, puede verse afectado por la paginación).
- `ctx.collection`: Los metadatos de la colección vinculada a la tabla (solo lectura).
- `ctx.requireAsync(url)`: Carga asincrónicamente una librería AMD/UMD por URL.
- `ctx.importAsync(url)`: Importa dinámicamente un módulo ESM por URL.
- `ctx.openView(options)`: Abre una vista configurada (modal/cajón/página).
- `ctx.i18n.t()` / `ctx.t()`: Internacionalización.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza después de que el contenedor esté listo.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Librerías integradas como React, ReactDOM, Ant Design, iconos de Ant Design y dayjs, útiles para la renderización JSX y el manejo de fechas y horas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` se mantienen por compatibilidad.)
- `ctx.render(vnode)`: Renderiza un elemento React/HTML/DOM en el contenedor predeterminado `ctx.element` (la celda actual). Múltiples renderizaciones reutilizarán el Root y sobrescribirán el contenido existente del contenedor.

## Editor y Fragmentos

El editor de scripts de la Columna JS es compatible con el resaltado de sintaxis, las sugerencias de errores y los fragmentos de código (Snippets) integrados.

- `Snippets`: Abre la lista de fragmentos de código integrados, permitiéndole buscar e insertarlos en la posición actual del cursor con un solo clic.
- `Run`: Ejecuta el código actual directamente. El registro de ejecución se muestra en el panel `Logs` inferior, compatible con `console.log/info/warn/error` y resaltado de errores.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

También puede utilizar un Empleado de IA para generar código:

- [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/built-in/ai-coding)

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

### 3) Abrir un Modal/Cajón desde una Celda (Ver/Editar)

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

### 4) Carga de Librerías de Terceros (AMD/UMD o ESM)

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

- Se recomienda utilizar una CDN de confianza para cargar librerías externas y tener un mecanismo de respaldo para escenarios de fallo (por ejemplo, `if (!lib) return;`).
- Se aconseja priorizar el uso de selectores `class` o `[name=...]` en lugar de `id` fijos, para evitar la duplicación de `id` en múltiples bloques o modales.
- Limpieza de Eventos: Las filas de la tabla pueden cambiar dinámicamente con la paginación o la actualización, lo que provoca que las celdas se rendericen varias veces. Debe limpiar o eliminar duplicados de los oyentes de eventos antes de vincularlos para evitar activaciones repetidas.
- Consejo de Rendimiento: Evite cargar librerías grandes repetidamente en cada celda. En su lugar, debería almacenar en caché la librería en un nivel superior (por ejemplo, utilizando una variable global o a nivel de tabla) y reutilizarla.