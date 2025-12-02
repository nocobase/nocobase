:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# JS Item

## Introducción

JS Item se utiliza para crear "elementos personalizados" (no vinculados a un campo) dentro de un formulario. Con JavaScript/JSX, puede renderizar cualquier tipo de contenido, como mensajes, estadísticas, previsualizaciones o botones, e interactuar con el formulario y el contexto del registro. Es ideal para escenarios que requieren previsualizaciones en tiempo real, consejos instructivos o pequeños componentes interactivos.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## API del Contexto en Tiempo de Ejecución (Uso Común)

- `ctx.element`: El contenedor DOM (ElementProxy) del elemento actual, compatible con `innerHTML`, `querySelector`, `addEventListener`, entre otros.
- `ctx.form`: La instancia del formulario de AntD, que permite operaciones como `getFieldValue`, `getFieldsValue`, `setFieldsValue`, `validateFields`, etc.
- `ctx.blockModel`: El modelo del bloque de formulario al que pertenece, que puede escuchar `formValuesChange` para implementar la vinculación.
- `ctx.record` / `ctx.collection`: La información meta del registro actual y la **colección** (disponible en algunos escenarios).
- `ctx.requireAsync(url)`: Carga asincrónicamente una librería AMD/UMD mediante una URL.
- `ctx.importAsync(url)`: Importa dinámicamente un módulo ESM mediante una URL.
- `ctx.openView(viewUid, options)`: Abre una vista configurada (cajón lateral/diálogo/página).
- `ctx.message` / `ctx.notification`: Mensajes y notificaciones globales.
- `ctx.t()` / `ctx.i18n.t()`: Internacionalización.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza después de que el contenedor esté listo.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Librerías comunes integradas como React, ReactDOM, Ant Design, iconos de Ant Design y dayjs, utilizadas para la renderización JSX y el manejo de fechas y horas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` se mantienen por compatibilidad).
- `ctx.render(vnode)`: Renderiza un elemento React/HTML/DOM en el contenedor predeterminado `ctx.element`. Múltiples renderizaciones reutilizarán el Root y sobrescribirán el contenido existente del contenedor.

## Editor y Fragmentos de Código

- `Snippets`: Abre una lista de fragmentos de código predefinidos, permitiéndole buscar e insertarlos con un solo clic en la posición actual del cursor.
- `Run`: Ejecuta el código actual directamente y muestra los registros de ejecución en el panel `Logs` inferior. Admite `console.log/info/warn/error` y el resaltado de errores para su localización.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- Puede combinarse con el empleado de IA para generar/modificar scripts: [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/built-in/ai-coding)

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

### 2) Abrir una Vista (Cajón Lateral)

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

### 3) Cargar y Renderizar Librerías Externas

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Consideraciones Importantes

- Se recomienda utilizar una CDN de confianza para cargar librerías externas y prever un mecanismo de respaldo en caso de fallos (por ejemplo, `if (!lib) return;`).
- Para los selectores, se aconseja priorizar el uso de `class` o `[name=...]` y evitar el uso de `id` fijos, para prevenir duplicidades en múltiples bloques o ventanas emergentes.
- Limpieza de eventos: Los cambios frecuentes en los valores del formulario pueden desencadenar múltiples renderizaciones. Antes de vincular un evento, debe limpiarlo o eliminar duplicados (por ejemplo, `remove` antes de `add`, usar `{ once: true }`, o marcar con un atributo `dataset` para evitar repeticiones).

## Documentación Relacionada

- [Variables y Contexto](/interface-builder/variables)
- [Reglas de Vinculación](/interface-builder/linkage-rule)
- [Vistas y Ventanas Emergentes](/interface-builder/actions/types/view)