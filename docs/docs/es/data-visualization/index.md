---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Descripción general

El plugin de visualización de datos de NocoBase proporciona consultas de datos visuales y un amplio conjunto de componentes de gráficos. Con una configuración sencilla, usted puede crear rápidamente paneles de visualización, presentar información valiosa y permitir el análisis y la visualización de datos multidimensionales.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Conceptos básicos
- Bloque de gráfico: Un componente de gráfico configurable en una página que admite consultas de datos, opciones de gráfico y eventos de interacción.
- Consulta de datos (Builder / SQL): Configure visualmente con el Builder o escriba SQL para obtener datos.
- Medidas (Measures) y Dimensiones (Dimensions): Las medidas se utilizan para la agregación numérica; las dimensiones se utilizan para agrupar datos (por ejemplo, fecha, categoría, región).
- Mapeo de campos: Mapee las columnas de resultados de la consulta a los campos principales del gráfico, como `xField`, `yField`, `seriesField` o `Category / Value`.
- Opciones de gráfico (Básico / Personalizado): Básico configura las propiedades comunes de forma visual; Personalizado devuelve una `option` completa de ECharts a través de JS.
- Ejecutar consulta: Ejecute la consulta y obtenga datos en el panel de configuración; puede cambiar a Tabla / JSON para inspeccionar los datos devueltos.
- Previsualizar y guardar: La previsualización es temporal; al hacer clic en Guardar, la configuración se escribe en la base de datos y se aplica.
- Variables de contexto: Reutilice la información de contexto de la página, el usuario y los filtros (por ejemplo, `{{ ctx.user.id }}`) en las consultas y la configuración del gráfico.
- Filtros y vinculación de página: Los bloques de filtro a nivel de página recopilan condiciones unificadas, se fusionan automáticamente en las consultas del gráfico y actualizan los gráficos vinculados.
- Eventos de interacción: Registre eventos a través de `chart.on` para habilitar el resaltado, la navegación y la exploración en profundidad (drill-down).

## Instalación
La visualización de datos es un plugin integrado de NocoBase; está listo para usar sin necesidad de instalación separada.