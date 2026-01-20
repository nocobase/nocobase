---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Bucle

## Introducción

Un bucle es equivalente a estructuras sintácticas como `for`/`while`/`forEach` en lenguajes de programación. Cuando necesite repetir ciertas operaciones un número determinado de veces o para una **colección** de datos (un array), puede usar un nodo de bucle.

## Instalación

Este es un **plugin** integrado y no requiere instalación.

## Creación de un nodo

En la interfaz de configuración del **flujo de trabajo**, haga clic en el botón de más ('+') en el flujo para añadir un nodo de "Bucle":

![Creación de un nodo de Bucle](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Después de crear un nodo de bucle, se generará una rama dentro del bucle. Puede añadir cualquier número de nodos dentro de esta rama. Estos nodos pueden usar no solo las variables del contexto del **flujo de trabajo**, sino también las variables locales del contexto del bucle, como el objeto de datos que se itera en la **colección** del bucle, o el índice del contador del bucle (el índice comienza desde `0`). El alcance de las variables locales se limita al interior del bucle. Si hay bucles anidados, puede usar las variables locales del bucle específico en cada nivel.

## Configuración del nodo

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Objeto del bucle

El bucle maneja los diferentes tipos de datos del objeto del bucle de manera distinta:

1.  **Array**: Este es el caso más común. Normalmente, puede seleccionar una variable del contexto del **flujo de trabajo**, como los múltiples resultados de datos de un nodo de consulta, o datos de relaciones uno a muchos precargados. Si se selecciona un array, el nodo de bucle iterará a través de cada elemento del array, asignando el elemento actual a una variable local en el contexto del bucle para cada iteración.

2.  **Número**: Cuando la variable seleccionada es un número, se utilizará como el número de iteraciones. El valor debe ser un entero positivo; los números negativos no entrarán en el bucle, y la parte decimal de un número será ignorada. El índice del contador del bucle en la variable local es también el valor del objeto del bucle. Este valor comienza desde **0**. Por ejemplo, si el número del objeto del bucle es 5, el objeto y el índice en cada bucle serán: 0, 1, 2, 3, 4.

3.  **Cadena de texto**: Cuando la variable seleccionada es una cadena de texto, su longitud se utilizará como el número de iteraciones, procesando cada carácter de la cadena por índice.

4.  **Otros**: Otros tipos de valores (incluidos los tipos de objeto) se tratan como un objeto de bucle de un solo elemento y solo se ejecutarán una vez. Esta situación normalmente no requiere un bucle.

Además de seleccionar una variable, también puede introducir directamente constantes para tipos numéricos y de cadena de texto. Por ejemplo, al introducir `5` (tipo numérico), el nodo de bucle iterará 5 veces. Al introducir `abc` (tipo cadena de texto), el nodo de bucle iterará 3 veces, procesando los caracteres `a`, `b` y `c` respectivamente. En la herramienta de selección de variables, elija el tipo deseado para la constante.

### Condición del bucle

Desde la versión `v1.4.0-beta`, se han añadido opciones relacionadas con las condiciones del bucle. Puede habilitar las condiciones del bucle en la configuración del nodo.

**Condición**

Similar a la configuración de condiciones en un nodo de condición, puede combinar configuraciones y usar variables del bucle actual, como el objeto del bucle, el índice del bucle, etc.

**Momento de la verificación**

Similar a las estructuras `while` y `do/while` en lenguajes de programación, puede elegir evaluar la condición configurada antes de que comience cada bucle o después de que termine cada bucle. La evaluación de la poscondición permite que los otros nodos dentro del cuerpo del bucle se ejecuten una vez antes de que se verifique la condición.

**Cuando no se cumple la condición**

Similar a las sentencias `break` y `continue` en lenguajes de programación, puede elegir salir del bucle o continuar con la siguiente iteración.

### Manejo de errores en nodos internos del bucle

Desde la versión `v1.4.0-beta`, cuando un nodo dentro del bucle falla al ejecutarse (debido a condiciones no cumplidas, errores, etc.), puede configurar el **flujo de trabajo** subsiguiente. Se admiten tres métodos de manejo:

*   Salir del **flujo de trabajo** (como `throw` en programación)
*   Salir del bucle y continuar con el **flujo de trabajo** (como `break` en programación)
*   Continuar con el siguiente objeto del bucle (como `continue` en programación)

El valor predeterminado es "Salir del **flujo de trabajo**", que puede cambiarse según sea necesario.

## Ejemplo

Por ejemplo, cuando se realiza un pedido, necesita verificar el stock de cada producto en el pedido. Si el stock es suficiente, deduzca el stock; de lo contrario, actualice el producto en el detalle del pedido como inválido.

1.  Cree tres **colecciones**: Productos <-(1:m)-- Detalles del Pedido --(m:1)-> Pedidos. El modelo de datos es el siguiente:

    | Nombre del campo | Tipo de campo |
    | ---------------- | ------------- |
    | Detalles del pedido | Uno a muchos (Detalles del pedido) |
    | Precio total del pedido | Número |

    | Nombre del campo | Tipo de campo |
    | ---------------- | ------------- |
    | Producto | Muchos a uno (Producto) |
    | Cantidad | Número |

    | Nombre del campo | Tipo de campo |
    | ---------------- | ------------- |
    | Nombre del producto | Texto de una línea |
    | Precio | Número |
    | Stock | Entero |

2.  Cree un **flujo de trabajo**. Para el disparador, seleccione "Evento de **colección**", y elija la **colección** "Pedidos" para que se active "Después de añadir un registro". También necesita configurarlo para precargar los datos de relación de la **colección** "Detalles del Pedido" y la **colección** de Productos bajo los detalles:

    ![Nodo de Bucle_Ejemplo_Configuración del Disparador](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Cree un nodo de bucle y seleccione el objeto del bucle como "Datos del disparador / Detalles del Pedido", lo que significa que procesará cada registro en la **colección** de Detalles del Pedido:

    ![Nodo de Bucle_Ejemplo_Configuración del Nodo de Bucle](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Dentro del nodo de bucle, cree un nodo de "Condición" para verificar si el stock del producto es suficiente:

    ![Nodo de Bucle_Ejemplo_Configuración del Nodo de Condición](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Si es suficiente, cree un "nodo de Cálculo" y un nodo de "Actualizar registro" en la rama "Sí" para actualizar el registro del producto correspondiente con el stock deducido calculado:

    ![Nodo de Bucle_Ejemplo_Configuración del Nodo de Cálculo](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Nodo de Bucle_Ejemplo_Configuración del Nodo de Actualización de Stock](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  De lo contrario, en la rama "No", cree un nodo de "Actualizar registro" para actualizar el estado del detalle del pedido a "inválido":

    ![Nodo de Bucle_Ejemplo_Configuración del Nodo de Actualización de Detalles del Pedido](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

La estructura general del **flujo de trabajo** es la siguiente:

![Nodo de Bucle_Ejemplo_Estructura del Flujo de Trabajo](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Después de configurar y activar este **flujo de trabajo**, cuando se crea un nuevo pedido, se verificará automáticamente el stock de los productos en los detalles del pedido. Si el stock es suficiente, se deducirá; de lo contrario, el producto en el detalle del pedido se actualizará a inválido (para que se pueda calcular un total de pedido válido).