:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Consultar Datos

Este nodo le permite consultar y recuperar registros de datos de una **colección** que cumplen con condiciones específicas.

Puede configurarlo para consultar un solo registro o múltiples registros. El resultado de la consulta puede utilizarse como una variable en nodos posteriores. Cuando consulta múltiples registros, el resultado es un array. Si el resultado de la consulta está vacío, puede elegir si desea continuar ejecutando los nodos subsiguientes.

## Crear Nodo

En la interfaz de configuración del **flujo de trabajo**, haga clic en el botón de más ("+") en el flujo para añadir un nodo de "Consultar Datos":

![Añadir nodo de Consultar Datos](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Configuración del Nodo

![Configuración del Nodo de Consulta](https://static-docs.nocobase.com/20240520131324.png)

### Colección

Seleccione la **colección** de la que desea consultar datos.

### Tipo de Resultado

El tipo de resultado se divide en "Un solo registro" y "Múltiples registros":

-   **Un solo registro**: El resultado es un objeto, que corresponde únicamente al primer registro que coincide, o `null` si no hay coincidencias.
-   **Múltiples registros**: El resultado será un array que contiene todos los registros que cumplen las condiciones. Si no hay registros que coincidan, será un array vacío. Puede procesarlos uno por uno utilizando un nodo de Bucle.

### Condiciones de Filtro

Al igual que las condiciones de filtro en una consulta de **colección** regular, puede utilizar las variables de contexto del **flujo de trabajo**.

### Ordenación

Al consultar uno o varios registros, puede utilizar reglas de ordenación para controlar el resultado deseado. Por ejemplo, para consultar el registro más reciente, puede ordenar por el campo "Fecha de Creación" en orden descendente.

### Paginación

Cuando el conjunto de resultados puede ser muy grande, puede utilizar la paginación para controlar la cantidad de resultados de la consulta. Por ejemplo, para consultar los 10 registros más recientes, puede ordenar por el campo "Fecha de Creación" en orden descendente y luego configurar la paginación a 1 página con 10 registros.

### Manejo de Resultados Vacíos

En el modo de un solo registro, si no hay datos que cumplan las condiciones, el resultado de la consulta será `null`. En el modo de múltiples registros, será un array vacío (`[]`). Puede elegir si desea marcar la opción "Salir del **flujo de trabajo** cuando el resultado de la consulta esté vacío". Si la marca, y el resultado de la consulta está vacío, los nodos subsiguientes no se ejecutarán y el **flujo de trabajo** finalizará anticipadamente con un estado de fallo.