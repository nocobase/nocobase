:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# JS Action

## Introducción

La Acción JS se utiliza para ejecutar JavaScript al hacer clic en un botón, lo que le permite personalizar cualquier comportamiento de negocio. Puede utilizarla en barras de herramientas de formularios, barras de herramientas de tablas (a nivel de **colección**), filas de tablas (a nivel de registro) y otras ubicaciones para realizar operaciones como validación, mostrar notificaciones, hacer llamadas a la API, abrir ventanas emergentes/cajones y actualizar datos.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API del Contexto en Tiempo de Ejecución (Uso Común)

- `ctx.api.request(options)`: Realiza una solicitud HTTP.
- `ctx.openView(viewUid, options)`: Abre una vista configurada (cajón/diálogo/página).
- `ctx.message` / `ctx.notification`: Mensajes y notificaciones globales.
- `ctx.t()` / `ctx.i18n.t()`: Internacionalización.
- `ctx.resource`: Recurso de datos para el contexto a nivel de **colección** (por ejemplo, barra de herramientas de tabla), incluyendo métodos como `getSelectedRows()` y `refresh()`.
- `ctx.record`: El registro de la fila actual para el contexto a nivel de registro (por ejemplo, botón de fila de tabla).
- `ctx.form`: La instancia del formulario AntD para el contexto a nivel de formulario (por ejemplo, botón de barra de herramientas de formulario).
- `ctx.collection`: Metadatos de la **colección** actual.
- El editor de código soporta los fragmentos `Snippets` y la pre-ejecución `Run` (ver más abajo).

- `ctx.requireAsync(url)`: Carga asincrónicamente una librería AMD/UMD desde una URL.
- `ctx.importAsync(url)`: Importa dinámicamente un módulo ESM desde una URL.

> Las variables disponibles pueden variar según la ubicación del botón. La lista anterior es una descripción general de las capacidades comunes.

## Editor y Fragmentos de Código

- `Snippets`: Abre una lista de fragmentos de código incorporados que puede buscar e insertar en la posición actual del cursor con un solo clic.
- `Run`: Ejecuta el código actual directamente y muestra los registros de ejecución en el panel `Logs` inferior. Soporta `console.log/info/warn/error` y resalta los errores para facilitar su localización.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Puede utilizar empleados de IA para generar/modificar scripts: [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/built-in/ai-coding)

## Uso Común (Ejemplos Simplificados)

### 1) Solicitud a la API y Notificación

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Botón de Colección: Validar Selección y Procesar

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Implementar la lógica de negocio...
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Botón de Registro: Leer el Registro de la Fila Actual

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Abrir Vista (Cajón/Diálogo)

```js
const popupUid = ctx.model.uid + '-open'; // Se enlaza al botón actual para mantener la estabilidad
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Actualizar Datos Después de Enviar

```js
// Actualización general: prioriza los recursos de tabla/lista, luego el recurso del bloque que contiene el formulario
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## Consideraciones

- **Acciones Idempotentes**: Para evitar múltiples envíos debido a clics repetidos, puede añadir un indicador de estado en su lógica o deshabilitar el botón.
- **Manejo de Errores**: Añada bloques try/catch para las llamadas a la API y proporcione retroalimentación amigable al usuario.
- **Interacción de Vistas**: Al abrir una ventana emergente/cajón con `ctx.openView`, se recomienda pasar los parámetros explícitamente y, si es necesario, actualizar activamente el recurso padre después de un envío exitoso.

## Documentos Relacionados

- [Variables y Contexto](/interface-builder/variables)
- [Reglas de Vinculación](/interface-builder/linkage-rule)
- [Vistas y Ventanas Emergentes](/interface-builder/actions/types/view)