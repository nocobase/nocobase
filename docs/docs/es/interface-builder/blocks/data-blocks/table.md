:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Bloque de tabla

## Introducción

El bloque de tabla es uno de los bloques de datos principales integrados en **NocoBase**. Su función principal es mostrar y gestionar datos estructurados en formato de tabla. Ofrece opciones de configuración flexibles, permitiendo a los usuarios personalizar las columnas de la tabla, sus anchos, las reglas de ordenación y el alcance de los datos, entre otros, para asegurar que la información mostrada se ajuste a las necesidades específicas de su negocio.

#### Características principales:
- **Configuración flexible de columnas**: Permite personalizar las columnas y sus anchos para adaptarse a diversas necesidades de visualización de datos.
- **Reglas de ordenación**: Admite la ordenación de los datos de la tabla. Puede organizar los datos en orden ascendente o descendente según diferentes campos.
- **Definición del alcance de los datos**: Al establecer el alcance de los datos, puede controlar el rango de información que se muestra, evitando la interferencia de datos irrelevantes.
- **Configuración de operaciones**: El bloque de tabla incluye varias opciones de operación. Puede configurar fácilmente acciones como filtrar, crear nuevo, editar y eliminar para una gestión rápida de los datos.
- **Edición rápida**: Permite la edición directa de datos dentro de la tabla, lo que simplifica el proceso operativo y mejora la eficiencia del trabajo.

## Ajustes del bloque

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Reglas de vinculación del bloque

Controle el comportamiento del bloque (por ejemplo, si se muestra o si ejecuta JavaScript) mediante las reglas de vinculación.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Para más detalles, consulte [Reglas de vinculación](/interface-builder/linkage-rule)

### Establecer alcance de los datos

Ejemplo: Por defecto, filtre los pedidos cuyo "Estado" sea "Pagado".

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Para más detalles, consulte [Establecer alcance de los datos](/interface-builder/blocks/block-settings/data-scope)

### Establecer reglas de ordenación

Ejemplo: Muestre los pedidos en orden descendente por fecha.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Para más detalles, consulte [Establecer reglas de ordenación](/interface-builder/blocks/block-settings/sorting-rule)

### Habilitar edición rápida

Active "Habilitar edición rápida" en los ajustes del bloque y en la configuración de las columnas de la tabla para personalizar qué columnas se pueden editar rápidamente.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Habilitar tabla de árbol

Cuando la tabla de datos es una tabla jerárquica (de árbol), el bloque de tabla puede activar la función **"Habilitar tabla de árbol"**. Por defecto, esta opción está desactivada. Una vez habilitada, el bloque mostrará los datos en una estructura de árbol y admitirá las opciones de configuración y las operaciones correspondientes.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Expandir todas las filas por defecto

Cuando la tabla de árbol está habilitada, el bloque permite expandir todas las filas secundarias por defecto al cargarse.

## Configurar campos

### Campos de esta colección

> **Nota**: Los campos de las colecciones heredadas (es decir, los campos de la colección padre) se fusionan y se muestran automáticamente en la lista de campos actual.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Campos de colecciones relacionadas

> **Nota**: Permite mostrar campos de colecciones relacionadas (actualmente solo se admiten relaciones de uno a uno).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Otras columnas personalizadas

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Configurar operaciones

### Operaciones globales

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtrar](/interface-builder/actions/types/filter)
- [Añadir nuevo](/interface-builder/actions/types/add-new)
- [Eliminar](/interface-builder/actions/types/delete)
- [Actualizar](/interface-builder/actions/types/refresh)
- [Importar](/interface-builder/actions/types/import)
- [Exportar](/interface-builder/actions/types/export)
- [Impresión de plantilla](/template-print/index)
- [Actualización masiva](/interface-builder/actions/types/bulk-update)
- [Exportar adjuntos](/interface-builder/actions/types/export-attachments)
- [Activar flujo de trabajo](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Empleado IA](/interface-builder/actions/types/ai-employee)

### Operaciones de fila

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Ver](/interface-builder/actions/types/view)
- [Editar](/interface-builder/actions/types/edit)
- [Eliminar](/interface-builder/actions/types/delete)
- [Ventana emergente](/interface-builder/actions/types/pop-up)
- [Enlace](/interface-builder/actions/types/link)
- [Actualizar registro](/interface-builder/actions/types/update-record)
- [Impresión de plantilla](/template-print/index)
- [Activar flujo de trabajo](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Empleado IA](/interface-builder/actions/types/ai-employee)