:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/fields/specific/js-item).
:::

# JS Item

## Introducción

JS Item se utiliza para "elementos personalizados" (no vinculados a campos) en formularios. Usted puede usar JavaScript/JSX para renderizar cualquier contenido (consejos, estadísticas, previsualizaciones, botones, etc.) e interactuar con el formulario y el contexto del registro; es adecuado para escenarios como previsualizaciones en tiempo real, consejos de instrucciones, pequeños componentes interactivos, etc.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API del Contexto en Tiempo de Ejecución (Uso Común)

- `ctx.element`: El contenedor DOM (ElementProxy) del elemento actual, soporta `innerHTML`, `querySelector`, `addEventListener`, etc.;
- `ctx.form`: Instancia de AntD Form, permite `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, etc.;
- `ctx.blockModel`: El modelo del bloque de formulario donde se encuentra, puede escuchar `formValuesChange` para implementar vinculaciones;
- `ctx.record` / `ctx.collection`: Información de metadatos del registro actual y de la **colección** (disponible en algunos escenarios);
- `ctx.requireAsync(url)`: Carga asíncronamente una librería AMD/UMD por URL;
- `ctx.importAsync(url)`: Importa dinámicamente un módulo ESM por URL;
- `ctx.openView(viewUid, options)`: Abre una vista configurada (cajón/diálogo/página);
- `ctx.message` / `ctx.notification`: Mensajes y notificaciones globales;
- `ctx.t()` / `ctx.i18n.t()`: Internacionalización;
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza una vez que el contenedor esté listo;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Librerías integradas como React / ReactDOM / Ant Design / Iconos de Ant Design / dayjs / lodash / math.js / formula.js, etc., para renderizado JSX, procesamiento de tiempo, manipulación de datos y operaciones matemáticas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` se mantienen por compatibilidad).
- `ctx.render(vnode)`: Renderiza elementos React/HTML/DOM en el contenedor predeterminado `ctx.element`; múltiples renderizados reutilizarán el Root y sobrescribirán el contenido existente del contenedor.

## Editor y Fragmentos de Código

- `Snippets`: Abre la lista de fragmentos de código integrados, permite buscar e insertar con un clic en la posición actual del cursor.
- `Run`: Ejecuta el código actual directamente y muestra los registros de ejecución en el panel `Logs` inferior; soporta `console.log/info/warn/error` y localización de errores con resaltado.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Puede combinarse con el empleado de IA para generar/modificar scripts: [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/features/built-in-employee)

## Usos Comunes (Ejemplos Simplificados)

### 1) Previsualización en Tiempo Real (Lectura de Valores del Formulario)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Abrir una Vista (Cajón)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Cargar Librerías Externas y Renderizar

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Notas

- Se recomienda usar CDNs confiables para la carga de librerías externas; debe manejar casos de fallo (ej. `if (!lib) return;`).
- Se recomienda priorizar el uso de `class` o `[name=...]` para los selectores, evitando el uso de `id` fijos para prevenir la duplicidad de `id` en múltiples bloques o ventanas emergentes.
- Limpieza de eventos: Los cambios frecuentes en los valores del formulario activarán múltiples renderizados; antes de vincular eventos, se debe limpiar o eliminar duplicados (ej. `remove` antes de `add`, o `{ once: true }`, o usar `dataset` para marcar y evitar repeticiones).

## Documentación Relacionada

- [Variables y Contexto](/interface-builder/variables)
- [Reglas de Vinculación](/interface-builder/linkage-rule)
- [Vistas y Ventanas Emergentes](/interface-builder/actions/types/view)