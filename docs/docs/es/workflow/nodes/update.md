:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Actualizar datos

Se utiliza para actualizar datos en una **colección** que cumplen con ciertas condiciones.

Las secciones de selección de la **colección** y asignación de campos son iguales a las del nodo "Crear registro". La principal diferencia del nodo "Actualizar datos" es la adición de condiciones de filtro y la necesidad de seleccionar un modo de actualización. Además, el resultado del nodo "Actualizar datos" devuelve el número de filas actualizadas con éxito. Esto solo se puede ver en el historial de ejecución y no se puede usar como variable en nodos posteriores.

## Crear un nodo

En la interfaz de configuración del **flujo de trabajo**, haga clic en el botón de signo más ("+") dentro del flujo para añadir un nodo de "Actualizar datos":

![Añadir nodo de Actualizar datos](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Configuración del nodo

![Configuración del nodo de Actualizar datos](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Colección

Seleccione la **colección** donde necesita actualizar los datos.

### Modo de actualización

Existen dos modos de actualización:

*   **Actualización masiva**: No activa eventos de la **colección** por cada registro actualizado. Ofrece un mejor rendimiento y es adecuado para operaciones de actualización de grandes volúmenes de datos.
*   **Actualización individual**: Activa eventos de la **colección** por cada registro actualizado. Sin embargo, puede causar problemas de rendimiento con grandes volúmenes de datos y debe usarse con precaución.

La elección suele depender de los datos objetivo de la actualización y de si necesita activar otros eventos del **flujo de trabajo**. Si va a actualizar un solo registro basándose en la clave primaria, se recomienda la "Actualización individual". Si va a actualizar varios registros basándose en condiciones, se recomienda la "Actualización masiva".

### Condiciones de filtro

Similar a las condiciones de filtro en una consulta normal de una **colección**, puede usar variables de contexto del **flujo de trabajo**.

### Valores de campo

Similar a la asignación de campos en el nodo "Crear registro", puede usar variables de contexto del **flujo de trabajo** o introducir valores estáticos manualmente.

**Nota**: Los datos actualizados por el nodo "Actualizar datos" en un **flujo de trabajo** no gestionan automáticamente los datos de "Última modificación por". Necesita configurar el valor de este campo usted mismo según sea necesario.

## Ejemplo

Por ejemplo, cuando se crea un nuevo "Artículo", necesita actualizar automáticamente el campo "Número de artículos" en la **colección** "Categoría de artículos". Esto se puede lograr usando el nodo "Actualizar datos":

![Configuración de ejemplo del nodo de Actualizar datos](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Una vez que se activa el **flujo de trabajo**, se actualizará automáticamente el campo "Número de artículos" de la **colección** "Categoría de artículos" al número actual de artículos + 1.