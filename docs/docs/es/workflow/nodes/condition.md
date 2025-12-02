:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Condición

## Introducción

Similar a la sentencia `if` en lenguajes de programación, este nodo determina el curso del flujo de trabajo posterior según el resultado de la condición configurada.

## Crear Nodo

El nodo de Condición tiene dos modos: "Continuar si es verdadero" y "Ramificar en verdadero/falso". Debe seleccionar uno de estos modos al crear el nodo, y no podrá modificarlo posteriormente en su configuración.

![Condición_Selección_de_Modo](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

En el modo "Continuar si es verdadero", cuando el resultado de la condición sea "verdadero", el flujo de trabajo continuará ejecutando los nodos posteriores. De lo contrario, el flujo de trabajo se terminará y saldrá prematuramente con un estado de fallo.

![Modo 'Continuar si es verdadero'](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Este modo es adecuado para escenarios en los que el flujo de trabajo no debe continuar si la condición no se cumple. Por ejemplo, imagine un botón de envío de formulario para un pedido, vinculado a un "Evento antes de la acción". Si el stock del producto en el pedido es insuficiente, el proceso de creación del pedido no debería continuar, sino que debería fallar y terminar.

En el modo "Ramificar en verdadero/falso", el nodo de condición creará dos ramas posteriores, que corresponden a los resultados "verdadero" y "falso" de la condición. Cada rama puede configurarse con sus propios nodos posteriores. Después de que cualquiera de las ramas complete su ejecución, se fusionará automáticamente de nuevo en la rama superior del nodo de condición para continuar ejecutando los nodos siguientes.

![Modo 'Ramificar en verdadero/falso'](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Este modo es adecuado para escenarios en los que se necesitan realizar diferentes acciones dependiendo de si la condición se cumple o no. Por ejemplo, puede verificar si un dato existe: si no existe, lo crea; si existe, lo actualiza.

## Configuración del Nodo

### Motor de Cálculo

Actualmente, se admiten tres motores:

-   **Básico**: Obtiene un resultado lógico mediante cálculos binarios simples y agrupaciones "Y" u "O".
-   **Math.js**: Calcula expresiones compatibles con el motor [Math.js](https://mathjs.org/) para obtener un resultado lógico.
-   **Formula.js**: Calcula expresiones compatibles con el motor [Formula.js](https://formulajs.info/) para obtener un resultado lógico.

En los tres tipos de cálculo, se pueden utilizar variables del contexto del flujo de trabajo como parámetros.