:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Programar y ejecutar JS en línea

En NocoBase, **RunJS** ofrece un método de extensión ligero, ideal para escenarios de **experimentación rápida y procesamiento de lógica temporal**. Sin necesidad de crear un **plugin** o modificar el código fuente, usted puede personalizar interfaces o interacciones directamente con JavaScript.

A través de esta funcionalidad, usted puede introducir código JS directamente en el diseñador de interfaz para lograr:

- Personalizar el contenido de renderizado (campos, bloques, columnas, ítems, etc.).
- Definir lógica de interacción personalizada (clics de botones, vinculación de eventos).
- Implementar comportamientos dinámicos combinando datos contextuales.

## Escenarios compatibles

### Bloque JS

Personalice la renderización de bloques mediante JS, lo que le permite un control total sobre la estructura y los estilos del bloque. Es ideal para mostrar componentes personalizados, gráficos estadísticos, contenido de terceros y otros escenarios de alta flexibilidad.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Documentación: [Bloque JS](/interface-builder/blocks/other-blocks/js-block)

### Acción JS

Personalice la lógica de clic de los botones de acción mediante JS, lo que le permite ejecutar cualquier operación de frontend o solicitud de API. Por ejemplo: calcular valores dinámicamente, enviar datos personalizados, activar ventanas emergentes, etc.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Documentación: [Acción JS](/interface-builder/actions/types/js-action)

### Campo JS

Personalice la lógica de renderizado de campos mediante JS. Usted puede mostrar dinámicamente diferentes estilos, contenidos o estados según los valores del campo.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Documentación: [Campo JS](/interface-builder/fields/specific/js-field)

### Ítem JS

Renderice ítems independientes mediante JS sin vincularlos a campos específicos. Se utiliza comúnmente para mostrar bloques de información personalizados.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Documentación: [Ítem JS](/interface-builder/fields/specific/js-item)

### Columna de tabla JS

Personalice la renderización de columnas de tabla mediante JS. Puede implementar lógicas complejas de visualización de celdas, como barras de progreso, etiquetas de estado, etc.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Documentación: [Columna de tabla JS](/interface-builder/fields/specific/js-column)

### Reglas de vinculación

Controle la lógica de vinculación entre campos en formularios o páginas mediante JS. Por ejemplo: cuando un campo cambia, modifique dinámicamente el valor o la visibilidad de otro campo.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Documentación: [Reglas de vinculación](/interface-builder/linkage-rule)

### Flujo de eventos

Personalice las condiciones de activación y la lógica de ejecución del flujo de eventos mediante JS para construir cadenas de interacción de frontend más complejas.

![](https://static-docs.nocobase.com/20251031092755.png)

Documentación: [Flujo de eventos](/interface-builder/event-flow)