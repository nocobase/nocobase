:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Configuración de gráficos personalizados

En el modo personalizado, puede configurar gráficos escribiendo código JavaScript en el editor. Basándose en `ctx.data`, debe devolver una `option` completa de ECharts. Esto es ideal para combinar múltiples series, crear tooltips complejos y aplicar estilos dinámicos. En teoría, se pueden utilizar todas las funciones y tipos de gráficos de ECharts.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Contexto de datos
- `ctx.data.objects`: Array de objetos (cada fila como un objeto)
- `ctx.data.rows`: Array bidimensional (incluye encabezado)
- `ctx.data.columns`: Array bidimensional agrupado por columnas

**Uso recomendado:**
Consolide los datos en `dataset.source`. Para obtener más detalles sobre su uso, consulte la documentación de ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Ejes](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Ejemplos](https://echarts.apache.org/examples/en/index.html)


Veamos primero un ejemplo sencillo:

## Ejemplo 1: Gráfico de barras de pedidos mensuales

![20251027082816](https://static-docs.nocobase.com/20251027082816.png)

```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'bar',
      showSymbol: false,
    },
  ],
}
```


## Ejemplo 2: Gráfico de tendencias de ventas

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monthly Sales Trend",
    subtext: "Last 12 Months",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Revenue", "Order Count", "Avg Order Value"],
    bottom: 0
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "60",
    top: "80",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: [
    {
      type: "value",
      name: "Amount(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Order Count",
      position: "right"
    }
  ],
  series: [
    {
      name: "Revenue",
      type: "line",
      smooth: true,
      encode: {
        x: "month",
        y: "monthly_revenue"
      },
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: "#5470c6"
      }
    },
    {
      name: "Order Count",
      type: "bar",
      yAxisIndex: 1,
      encode: {
        x: "month",
        y: "order_count"
      },
      itemStyle: {
        color: "#91cc75",
        opacity: 0.6
      }
    },
    {
      name: "Avg Order Value",
      type: "line",
      encode: {
        x: "month",
        y: "avg_order_value"
      },
      itemStyle: {
        color: "#fac858"
      },
      lineStyle: {
        type: "dashed"
      }
    }
  ]
}
```

**Sugerencias:**
- Mantenga un estilo de función pura: genere la `option` únicamente a partir de `ctx.data` y evite efectos secundarios.
- Los cambios en los nombres de las columnas de consulta afectan la indexación; estandarice los nombres y confírmelos en "Ver datos" antes de modificar el código.
- Para grandes volúmenes de datos, evite cálculos síncronos complejos en JavaScript; agréguelos durante la fase de consulta si es necesario.


## Más ejemplos

Para ver más ejemplos de uso, puede consultar la [aplicación de demostración](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) de NocoBase.

También puede explorar los [ejemplos](https://echarts.apache.org/examples/en/index.html) oficiales de ECharts para encontrar el efecto de gráfico que desee, y luego consultar y copiar el código de configuración JavaScript. 
 

## Previsualizar y guardar

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Haga clic en "Previsualizar" en el lado derecho o en la parte inferior para actualizar el gráfico y validar la configuración JavaScript.
- Haga clic en "Guardar" para almacenar la configuración JavaScript actual en la base de datos.
- Haga clic en "Cancelar" para volver al último estado guardado.