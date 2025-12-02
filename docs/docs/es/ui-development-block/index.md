:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Resumen de las extensiones de bloque

En NocoBase 2.0, el mecanismo de extensión de bloques se ha simplificado considerablemente. Los desarrolladores solo necesitan heredar la clase base **FlowModel** correspondiente e implementar los métodos de interfaz relacionados (principalmente el método `renderComponent()`) para personalizar bloques rápidamente.

## Categorías de bloques

NocoBase clasifica los bloques en tres tipos, que se muestran agrupados en la interfaz de configuración:

-   **Bloques de datos (Data blocks)**: Bloques que heredan de `DataBlockModel` o `CollectionBlockModel`.
-   **Bloques de filtro (Filter blocks)**: Bloques que heredan de `FilterBlockModel`.
-   **Otros bloques (Other blocks)**: Bloques que heredan directamente de `BlockModel`.

> La agrupación de bloques está determinada por la clase base correspondiente. La lógica de clasificación se basa en las relaciones de herencia y no requiere configuración adicional.

## Descripción de las clases base

El sistema proporciona cuatro clases base para extensiones:

### BlockModel

**Modelo de bloque básico**, la clase base de bloque más versátil.

-   Adecuado para bloques de solo visualización que no dependen de datos.
-   Se clasifica en el grupo **Otros bloques**.
-   Aplicable a escenarios personalizados.

### DataBlockModel

**Modelo de bloque de datos (no vinculado a una tabla de datos)**, para bloques con fuentes de datos personalizadas.

-   No se vincula directamente a una tabla de datos; permite personalizar la lógica de obtención de datos.
-   Se clasifica en el grupo **Bloques de datos**.
-   Aplicable a: llamadas a API externas, procesamiento de datos personalizado, gráficos estadísticos, etc.

### CollectionBlockModel

**Modelo de bloque de colección**, para bloques que necesitan vincularse a una tabla de datos.

-   Requiere vincularse a una clase base de modelo de tabla de datos.
-   Se clasifica en el grupo **Bloques de datos**.
-   Aplicable a: listas, formularios, tableros Kanban y otros bloques que dependen claramente de una tabla de datos específica.

### FilterBlockModel

**Modelo de bloque de filtro**, para construir bloques de condiciones de filtro.

-   Clase base de modelo para construir condiciones de filtro.
-   Se clasifica en el grupo **Bloques de filtro**.
-   Generalmente funciona en conjunto con bloques de datos.

## Cómo elegir una clase base

Al seleccionar una clase base, puede seguir estos principios:

-   **Necesita vincularse a una tabla de datos**: Priorice `CollectionBlockModel`.
-   **Fuente de datos personalizada**: Elija `DataBlockModel`.
-   **Para establecer condiciones de filtro y trabajar con bloques de datos**: Elija `FilterBlockModel`.
-   **No está seguro de cómo categorizar**: Elija `BlockModel`.

## Inicio rápido

Crear un bloque personalizado solo requiere tres pasos:

1.  Heredar la clase base correspondiente (por ejemplo, `BlockModel`).
2.  Implementar el método `renderComponent()` para devolver un componente React.
3.  Registrar el modelo de bloque en el plugin.

Para ejemplos detallados, consulte [Escribir un plugin de bloque](./write-a-block-plugin).