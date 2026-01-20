:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Preguntas Frecuentes

## Selección de Gráficos
### ¿Cómo elijo el gráfico adecuado?
Respuesta: Elija el gráfico basándose en sus datos y objetivos:
- **Tendencias y cambios:** Gráfico de líneas o de área.
- **Comparación de valores:** Gráfico de columnas o de barras.
- **Composición y proporciones:** Gráfico circular (de pastel) o de anillo.
- **Correlación y distribución:** Gráfico de dispersión.
- **Estructura jerárquica y progreso por etapas:** Gráfico de embudo.

Para ver más tipos de gráficos, consulte los [ejemplos de ECharts](https://echarts.apache.org/examples).

### ¿Qué tipos de gráficos soporta NocoBase?
Respuesta: El modo de configuración visual incluye los gráficos más comunes (líneas, área, columnas, barras, circular, de anillo, embudo, dispersión, etc.). El modo de configuración personalizada le permite utilizar todos los tipos de gráficos de ECharts.

## Problemas con la Consulta de Datos
### ¿Los modos de configuración visual y SQL son compatibles entre sí?
Respuesta: No, no son compatibles. Sus configuraciones se almacenan de forma independiente. El modo de configuración que se utilizó en su último guardado será el que esté activo.

## Opciones de Gráficos
### ¿Cómo configuro los campos del gráfico?
Respuesta: En el modo de configuración visual, seleccione los campos de datos correspondientes según el tipo de gráfico. Por ejemplo, los gráficos de líneas o de columnas requieren la configuración de los campos del eje X y del eje Y, mientras que los gráficos circulares necesitan campos de categoría y de valor.
Le recomendamos ejecutar primero "Ejecutar consulta" para verificar si los datos cumplen con sus expectativas; por defecto, los campos del gráfico se asignarán automáticamente.

## Problemas con la Vista Previa y el Guardado
### ¿Necesito previsualizar los cambios manualmente después de modificar la configuración?
Respuesta: En el modo de configuración visual, los cambios se previsualizan automáticamente. En los modos de configuración SQL y personalizada, para evitar actualizaciones frecuentes, haga clic en "Previsualizar" manualmente una vez que haya terminado de editar.

### ¿Por qué se pierde el efecto de la vista previa del gráfico al cerrar la ventana emergente?
Respuesta: El efecto de la vista previa es solo para una visualización temporal. Después de modificar la configuración, guarde los cambios antes de cerrar; las modificaciones no guardadas no se conservarán.