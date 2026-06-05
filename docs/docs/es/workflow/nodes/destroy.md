:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Eliminar datos

Permite eliminar datos de una **colección** que cumplan ciertas condiciones.

El uso básico del nodo de eliminación es similar al del nodo de actualización. La diferencia es que el nodo de eliminación no requiere la asignación de campos; solo necesita seleccionar la **colección** y las condiciones de filtro. El resultado del nodo de eliminación devuelve el número de filas eliminadas con éxito, que solo se puede ver en el historial de ejecución y no se puede utilizar como variable en nodos posteriores.

:::info{title=Nota}
Actualmente, el nodo de eliminación no admite la eliminación fila por fila; realiza eliminaciones por lotes. Por lo tanto, no activará otros eventos por cada eliminación de datos individual.
:::

## Crear nodo

En la interfaz de configuración del **flujo de trabajo**, haga clic en el botón de signo más ("+") dentro del flujo para añadir un nodo de "Eliminar datos":

![Crear nodo de eliminación de datos](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Configuración del nodo

![Nodo de eliminación_Configuración del nodo](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Colección

Seleccione la **colección** de la que desea eliminar datos.

### Condiciones de filtro

Similar a las condiciones de filtro para una consulta de **colección** regular, puede utilizar las variables de contexto del **flujo de trabajo**.

## Ejemplo

Por ejemplo, para limpiar periódicamente los datos de pedidos históricos cancelados e inválidos, puede utilizar el nodo de eliminación para lograrlo:

![Nodo de eliminación_Ejemplo_Configuración del nodo](https://static-docs.nocobase.com/b94b95077a17252f8523c3f13ce5f320.png)

El **flujo de trabajo** se activará periódicamente y ejecutará la eliminación de todos los datos de pedidos históricos cancelados e inválidos.