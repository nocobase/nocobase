:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Bloque JS

## Introducción

El Bloque JS es un "bloque de renderizado personalizado" muy flexible que le permite escribir código JavaScript directamente para generar interfaces, vincular eventos, llamar a APIs de datos o integrar bibliotecas de terceros. Es ideal para visualizaciones personalizadas, experimentos temporales y escenarios de extensión ligeros que son difíciles de cubrir con los bloques predefinidos.

## API del Contexto de Ejecución

El contexto de ejecución del Bloque JS ya tiene inyectadas capacidades comunes que puede usar directamente:

- `ctx.element`: El contenedor DOM del bloque (envuelto de forma segura como ElementProxy), compatible con `innerHTML`, `querySelector`, `addEventListener`, entre otros.
- `ctx.requireAsync(url)`: Carga asincrónicamente una biblioteca AMD/UMD mediante una URL.
- `ctx.importAsync(url)`: Importa dinámicamente un módulo ESM mediante una URL.
- `ctx.openView`: Abre una vista configurada (ventana emergente/cajón lateral/página).
- `ctx.useResource(...)` + `ctx.resource`: Accede a los datos como un recurso.
- `ctx.i18n.t()` / `ctx.t()`: Capacidad de internacionalización integrada.
- `ctx.onRefReady(ctx.ref, cb)`: Renderiza después de que el contenedor esté listo para evitar problemas de temporización.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: Bibliotecas comunes integradas como React, ReactDOM, Ant Design, iconos de Ant Design y dayjs, utilizadas para el renderizado JSX y el manejo de fechas y horas. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` se mantienen por compatibilidad.)
- `ctx.render(vnode)`: Renderiza un elemento React, una cadena HTML o un nodo DOM en el contenedor predeterminado `ctx.element`. Múltiples llamadas reutilizarán el mismo React Root y sobrescribirán el contenido existente del contenedor.

## Añadir un Bloque

Puede añadir un Bloque JS a una página o a una ventana emergente.
![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## Editor y Snippets

El editor de scripts del Bloque JS es compatible con el resaltado de sintaxis, las sugerencias de errores y los fragmentos de código (Snippets) integrados. Esto le permite insertar rápidamente ejemplos comunes como renderizar gráficos, vincular eventos de botones, cargar bibliotecas externas, renderizar componentes de React/Vue, líneas de tiempo, tarjetas de información, etc.

- `Snippets`: Abre la lista de fragmentos de código integrados. Puede buscar e insertar un fragmento seleccionado en la posición actual del cursor en el editor de código con un solo clic.
- `Run`: Ejecuta directamente el código en el editor actual y muestra los registros de ejecución en el panel `Logs` inferior. Es compatible con la visualización de `console.log/info/warn/error`, y los errores se resaltarán y podrán localizarse en la fila y columna específicas.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

Además, desde la esquina superior derecha del editor, puede invocar directamente al empleado de IA "Ingeniero Frontend · Nathan". Él le ayudará a escribir o modificar scripts basándose en el contexto actual. Luego, puede hacer clic en "Apply to editor" para aplicar los cambios al editor y ejecutar el código para ver el resultado. Para más detalles, consulte:

- [Empleado de IA · Nathan: Ingeniero Frontend](/ai-employees/built-in/ai-coding)

## Entorno de Ejecución y Seguridad

- **Contenedor**: El sistema proporciona un contenedor DOM seguro `ctx.element` (ElementProxy) para el script, que solo afecta al bloque actual y no interfiere con otras áreas de la página.
- **Sandbox**: El script se ejecuta en un entorno controlado. `window`/`document`/`navigator` utilizan objetos proxy seguros, lo que permite el uso de APIs comunes mientras restringe comportamientos de riesgo.
- **Re-renderizado**: El bloque se vuelve a renderizar automáticamente cuando se oculta y luego se muestra de nuevo (para evitar la ejecución repetida del script de montaje inicial).

## Usos Comunes (Ejemplos Simplificados)

### 1) Renderizar React (JSX)

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) Plantilla de Solicitud API

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) Cargar ECharts y Renderizar

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) Abrir una Vista (Cajón Lateral)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) Leer un Recurso y Renderizar JSON

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## Notas

- Se recomienda utilizar CDNs de confianza para cargar bibliotecas externas.
- **Consejo para el uso de selectores**: Priorice el uso de selectores de atributo `class` o `[name=...]`. Evite usar `id`s fijos para prevenir conflictos de `id`s duplicados cuando utilice múltiples bloques o ventanas emergentes, lo que podría causar problemas de estilo o eventos.
- **Limpieza de eventos**: Dado que el bloque puede renderizarse varias veces, los escuchadores de eventos deben limpiarse o desduplicarse antes de vincularlos para evitar activaciones repetidas. Puede usar un enfoque de "eliminar y luego añadir", un escuchador de un solo uso o una bandera para evitar duplicados.

## Documentos Relacionados

- [Variables y Contexto](/interface-builder/variables)
- [Reglas de Vinculación](/interface-builder/linkage-rule)
- [Vistas y Ventanas Emergentes](/interface-builder/actions/types/view)