:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/actions/types/js-action).
:::

# JS Action

## Introducción

JS Action se utiliza para ejecutar JavaScript al hacer clic en un botón para personalizar cualquier comportamiento de negocio. Puede utilizarse en barras de herramientas de formularios, barras de herramientas de tablas (nivel de colección), filas de tablas (nivel de registro), entre otros, para realizar validaciones, avisos, llamadas a la interfaz, abrir ventanas emergentes/cajones, actualizar datos, etc.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API del contexto en tiempo de ejecución (Uso común)

- `ctx.api.request(options)`: Realiza una solicitud HTTP;
- `ctx.openView(viewUid, options)`: Abre una vista configurada (cajón/diálogo/página);
- `ctx.message` / `ctx.notification`: Avisos y notificaciones globales;
- `ctx.t()` / `ctx.i18n.t()`: Internacionalización;
- `ctx.resource`: Recurso de datos del contexto a nivel de colección (como la barra de herramientas de la tabla, incluye `getSelectedRows()`, `refresh()`, etc.);
- `ctx.record`: Registro de la fila actual del contexto a nivel de registro (como botones de fila de tabla);
- `ctx.form`: Instancia de AntD Form del contexto a nivel de formulario (como botones de barra de herramientas de formulario);
- `ctx.collection`: Metainformación de la colección actual;
- El editor de código admite fragmentos `Snippets` y pre-ejecución `Run` (ver más abajo).


- `ctx.requireAsync(url)`: Carga de forma asíncrona librerías AMD/UMD por URL;
- `ctx.importAsync(url)`: Importa dinámicamente módulos ESM por URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Librerías comunes integradas como React / ReactDOM / Ant Design / Iconos de Ant Design / dayjs / lodash / math.js / formula.js, utilizadas para renderizado JSX, procesamiento de tiempo, manipulación de datos y operaciones matemáticas.

> Las variables disponibles variarán según la ubicación del botón; lo anterior es un resumen de las capacidades comunes.

## Editor y fragmentos

- `Snippets`: Abre la lista de fragmentos de código integrados, permite buscar e insertar con un clic en la posición actual del cursor.
- `Run`: Ejecuta directamente el código actual y muestra los registros de ejecución en el panel inferior `Logs`; admite `console.log/info/warn/error` y localización de errores con resaltado.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Puede combinarse con empleados de IA para generar/modificar scripts: [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/features/built-in-employee)

## Uso común (Ejemplos simplificados)

### 1) Solicitud a la interfaz y avisos

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Botón de colección: Validar selección y procesar

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Ejecutar lógica de negocio…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Botón de registro: Leer el registro de la fila actual

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Abrir vista (Cajón/Diálogo)

```js
const popupUid = ctx.model.uid + '-open'; // Se vincula al botón actual para mantener la estabilidad
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Actualizar datos tras el envío

```js
// Actualización general: prioriza recursos de tabla/lista, luego el recurso del bloque donde se encuentra el formulario
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Notas

- Idempotencia del comportamiento: Evite envíos múltiples causados por clics repetidos; puede añadir un interruptor de estado o desactivar el botón en la lógica.
- Manejo de errores: Añada try/catch a las llamadas de interfaz y proporcione avisos al usuario.
- Vinculación de vistas: Al abrir ventanas emergentes/cajones a través de `ctx.openView`, se recomienda pasar parámetros de forma explícita y, si es necesario, actualizar activamente el recurso padre tras un envío exitoso.

## Documentos relacionados

- [Variables y contexto](/interface-builder/variables)
- [Reglas de vinculación](/interface-builder/linkage-rule)
- [Vistas y ventanas emergentes](/interface-builder/actions/types/view)