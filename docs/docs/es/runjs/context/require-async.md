:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/require-async).
:::

# ctx.requireAsync()

Carga de forma asíncrona scripts **UMD/AMD** o montados globalmente mediante una URL, así como archivos **CSS**. Es adecuado para escenarios de RunJS que requieren librerías UMD/AMD como ECharts, Chart.js, FullCalendar (versión UMD) o plugins de jQuery; pasar una dirección `.css` cargará e inyectará los estilos. Si la librería también proporciona una versión ESM, priorice el uso de [ctx.importAsync()](./import-async.md).

## Casos de uso

Puede utilizarse en cualquier escenario de RunJS donde sea necesario cargar scripts UMD/AMD/globales o CSS bajo demanda, como JSBlock, JSField, JSItem, JSColumn, flujos de trabajo, JSAction, etc. Usos típicos: gráficos de ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), plugins de jQuery, etc.

## Definición de tipo

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `url` | `string` | La dirección del script o CSS. Admite **abreviaturas** `<nombre-del-paquete>@<versión>/<ruta-del-archivo>` (se añade `?raw` para obtener el archivo UMD original cuando se resuelve mediante el CDN de ESM) o una **URL completa**. Carga e inyecta estilos si se pasa un archivo `.css`. |

## Valor de retorno

- El objeto de la librería cargada (el primer valor del módulo de la retrollamada UMD/AMD). Muchas librerías UMD se adjuntan a `window` (por ejemplo, `window.echarts`), por lo que el valor de retorno podría ser `undefined`. En tales casos, acceda a la variable global según la documentación de la librería.
- Devuelve el resultado de `loadCSS` cuando se pasa un archivo `.css`.

## Descripción del formato de URL

- **Ruta abreviada**: por ejemplo, `echarts@5/dist/echarts.min.js`. Bajo el CDN de ESM por defecto (esm.sh), solicitará `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. El parámetro `?raw` se utiliza para obtener el archivo UMD original en lugar de un envoltorio ESM.
- **URL completa**: se puede escribir directamente cualquier dirección de CDN, como `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: una URL que termine en `.css` se cargará e inyectará en la página.

## Diferencia con ctx.importAsync()

- **ctx.requireAsync()**: carga scripts **UMD/AMD/globales**. Adecuado para ECharts, Chart.js, FullCalendar (UMD), plugins de jQuery, etc. Las librerías suelen adjuntarse a `window` después de la carga; el valor de retorno puede ser el objeto de la librería o `undefined`.
- **ctx.importAsync()**: carga **módulos ESM** y devuelve el espacio de nombres del módulo. Si una librería proporciona ESM, utilice `ctx.importAsync()` para obtener una mejor semántica de módulos y *tree-shaking*.

## Ejemplos

### Uso básico

```javascript
// Ruta abreviada (resuelta mediante el CDN de ESM como ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL completa
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Carga CSS e inyecta en la página
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Gráfico de ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('La librería ECharts no se ha cargado');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Resumen de ventas') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Gráfico de barras de Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js no se ha cargado');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Cantidad'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Notas

- **Formato del valor de retorno**: los métodos de exportación de UMD varían; el valor de retorno puede ser el objeto de la librería o `undefined`. Si es `undefined`, acceda a él a través de `window` según la documentación de la librería.
- **Dependencia de la red**: requiere acceso a un CDN. En entornos de red interna, puede apuntar a un servicio propio a través de **ESM_CDN_BASE_URL**.
- **Elección entre importAsync**: si una librería proporciona tanto ESM como UMD, priorice `ctx.importAsync()`.

## Relacionado

- [ctx.importAsync()](./import-async.md) - Carga módulos ESM, adecuado para Vue, dayjs (ESM), etc.
- [ctx.render()](./render.md) - Renderiza gráficos y otros componentes en un contenedor.
- [ctx.libs](./libs.md) - React, antd, dayjs, etc. integrados, no requiere carga asíncrona.