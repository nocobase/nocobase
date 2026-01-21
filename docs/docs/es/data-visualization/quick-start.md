:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Inicio rápido

En esta guía, configuraremos un gráfico desde cero, utilizando las funciones esenciales. Las capacidades opcionales se abordarán en capítulos posteriores.

Requisitos previos:
- Debe tener configurada una **fuente de datos** y una **colección** (tabla de datos), y contar con permisos de lectura.

## Añadir un bloque de gráfico

En el diseñador de páginas, haga clic en "Añadir bloque", seleccione "Gráfico" y añada un bloque de gráfico.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Después de añadirlo, haga clic en "Configurar" en la esquina superior derecha del bloque.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Se abrirá el panel de configuración del gráfico a la derecha. Este panel consta de tres secciones: Consulta de datos, Opciones del gráfico y Eventos.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Configurar la consulta de datos
En el panel "Consulta de datos", puede configurar la **fuente de datos**, los filtros de consulta y otras opciones relacionadas.

- Seleccione la **fuente de datos** y la **colección**
  - En el panel "Consulta de datos", elija la **fuente de datos** y la **colección** como base para su consulta.
  - Si la **colección** no está disponible o aparece vacía, verifique primero si ha sido creada y si su usuario tiene los permisos necesarios.

- Configurar medidas (Measures)
  - Seleccione uno o más campos numéricos como medidas.
  - Para cada medida, configure la agregación: Suma / Recuento / Promedio / Máximo / Mínimo.

- Configurar dimensiones (Dimensions)
  - Seleccione uno o más campos como dimensiones de agrupación (por ejemplo, fecha, categoría, región).
  - Para los campos de fecha/hora, puede establecer un formato (por ejemplo, `YYYY-MM`, `YYYY-MM-DD`) para asegurar una visualización consistente.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Otras opciones como filtrar, ordenar y paginar son opcionales.

## Ejecutar consulta y ver datos

- Haga clic en "Ejecutar consulta" para obtener los datos y renderizar una vista previa del gráfico directamente a la izquierda.
- Puede hacer clic en "Ver datos" para previsualizar los resultados de los datos obtenidos; puede alternar entre los formatos Tabla y JSON. Haga clic de nuevo para ocultar la vista previa de los datos.
- Si el resultado de los datos está vacío o no es el esperado, regrese al panel de consulta y verifique los permisos de la **colección**, las asignaciones de campos para medidas/dimensiones y los tipos de datos.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Configurar opciones del gráfico

En el panel "Opciones del gráfico", puede elegir el tipo de gráfico y configurar sus opciones.

- Primero, seleccione un tipo de gráfico (línea/área, columna/barra, pastel/anillo, dispersión, etc.).
- Complete las asignaciones de campos principales:
  - Línea/área/columna/barra: `xField` (dimensión), `yField` (medida), `seriesField` (serie, opcional)
  - Pastel/anillo: `Category` (dimensión categórica), `Value` (medida)
  - Dispersión: `xField`, `yField` (dos medidas o dimensiones)
  - Para más configuraciones de gráficos, consulte la documentación de ECharts: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Después de hacer clic en "Ejecutar consulta", las asignaciones de campos se completan automáticamente por defecto. Si cambia las dimensiones o medidas, por favor, vuelva a verificar las asignaciones.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Previsualizar y guardar
Los cambios de configuración se actualizan automáticamente en tiempo real en la vista previa, que puede ver en la página de la izquierda. Sin embargo, tenga en cuenta que ninguna modificación se guardará realmente hasta que haga clic en el botón "Guardar".

También puede utilizar los botones en la parte inferior:

- **Previsualizar**: Los cambios de configuración actualizan la vista previa automáticamente. También puede hacer clic en el botón "Previsualizar" en la parte inferior para forzar una actualización manual.
- **Cancelar**: Si no desea conservar los cambios actuales, puede hacer clic en el botón "Cancelar" en la parte inferior o actualizar la página para revertir al último estado guardado.
- **Guardar**: Haga clic en "Guardar" para persistir la configuración actual de la consulta y el gráfico en la base de datos, lo que hará que sea efectiva para todos los usuarios.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Puntos clave a tener en cuenta

- **Configuración mínima viable**: Seleccione una **colección** y al menos una medida. Se recomienda añadir dimensiones para una visualización agrupada más clara.
- Para las dimensiones de fecha, establezca un formato adecuado (por ejemplo, `YYYY-MM` para estadísticas mensuales) para evitar que el eje X sea discontinuo o desordenado.
- **Si la consulta está vacía o el gráfico no se muestra:**
  - Verifique la **colección**/permisos y las asignaciones de campos.
  - Utilice "Ver datos" para confirmar que los nombres y tipos de las columnas coinciden con la asignación del gráfico.
- **La vista previa es temporal**: Sirve únicamente para validación y ajustes. Los cambios solo se harán efectivos oficialmente después de hacer clic en "Guardar".