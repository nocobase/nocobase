:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Opciones de gráficos

Configure cómo se muestran los gráficos. Se admiten dos modos: Básico (visual) y Personalizado (JS). El modo Básico es ideal para un mapeo rápido y propiedades comunes; el modo Personalizado se adapta a escenarios complejos y personalizaciones avanzadas.

## Estructura del panel

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> **Consejo:** Para configurar el contenido actual más fácilmente, puede plegar primero los otros paneles.

La barra de acciones superior
Selección de modo:
- **Básico:** Configuración visual. Elija un tipo y complete el mapeo de campos; ajuste las propiedades comunes directamente con los interruptores.
- **Personalizado:** Escriba código JS en el editor y devuelva una `option` de ECharts.

## Modo Básico

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Elegir tipo de gráfico
- **Compatibles:** Gráfico de líneas, de áreas, de columnas, de barras, circular (de pastel), de anillos (de rosquilla), de embudo, de dispersión, entre otros.
- Los campos requeridos pueden variar según el tipo de gráfico. Primero, confirme los nombres y tipos de las columnas en "Consulta de datos → Ver datos".

### Mapeo de campos
- **Líneas/Áreas/Columnas/Barras:**
  - `xField`: Dimensión (por ejemplo, fecha, categoría, región)
  - `yField`: Medida (valor numérico agregado)
  - `seriesField` (opcional): Agrupación de series (para múltiples líneas/grupos de columnas)
- **Circular/Anillos:**
  - `Category`: Dimensión categórica
  - `Value`: Medida
- **Embudo:**
  - `Category`: Etapa/Categoría
  - `Value`: Valor (generalmente cantidad o porcentaje)
- **Dispersión:**
  - `xField`, `yField`: Dos medidas o dimensiones para los ejes.

> Para más opciones de configuración de gráficos, consulte la documentación de ECharts: [Eje](https://echarts.apache.org/handbook/en/concepts/axis) y [Ejemplos](https://echarts.apache.org/examples/en/index.html).

**Tenga en cuenta:**
- Después de cambiar las dimensiones o medidas, vuelva a verificar el mapeo para evitar gráficos vacíos o desalineados.
- Los gráficos circulares/de anillos y de embudo deben proporcionar una combinación de "categoría + valor".

### Propiedades comunes

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Apilado, suavizado (líneas/áreas)
- Visualización de etiquetas, información sobre herramientas (`tooltip`), leyenda (`legend`)
- Rotación de etiquetas de eje, líneas divisorias
- Radio y radio interior de gráficos circulares/de anillos, orden de clasificación de embudo

**Recomendaciones:**
- Utilice gráficos de líneas/áreas para series temporales con un suavizado moderado; use gráficos de columnas/barras para la comparación de categorías principales.
- Cuando los datos son densos, no es necesario activar todas las etiquetas para evitar superposiciones.

## Modo Personalizado

Se utiliza para devolver una `option` completa de ECharts, adecuada para personalizaciones avanzadas como la fusión de múltiples series, información sobre herramientas compleja y estilos dinámicos. El uso recomendado es consolidar los datos en `dataset.source`. Para más detalles, consulte la documentación de ECharts: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series).

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Contexto de datos
- `ctx.data.objects`: Array de objetos (cada fila como un objeto, recomendado)
- `ctx.data.rows`: Array bidimensional (con encabezado)
- `ctx.data.columns`: Array bidimensional agrupado por columnas

### Ejemplo: Gráfico de líneas de pedidos mensuales
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Previsualizar y Guardar
- En el modo Personalizado, después de realizar modificaciones, puede hacer clic en el botón **Previsualizar** a la derecha para actualizar la vista previa del gráfico.
- En la parte inferior, haga clic en "Guardar" para aplicar y conservar la configuración; haga clic en "Cancelar" para revertir todos los cambios realizados en esta ocasión.

![20251026192816](https://static-docs.nocobase.com/20251026192816.png)

> [!TIP]
> Para obtener más información sobre las opciones de gráficos, consulte [Uso avanzado — Configuración de gráficos personalizados](#).