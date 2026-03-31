---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Cálculo de fechas

## Introducción

El nodo de Cálculo de fechas ofrece nueve funciones de cálculo, que incluyen añadir un periodo de tiempo, restar un periodo de tiempo, formatear la salida de una cadena de tiempo y convertir unidades de duración. Cada función tiene tipos de valores de entrada y salida específicos, y también puede recibir resultados de otros nodos como variables de parámetro. Utiliza un sistema de tuberías (pipeline) para encadenar los resultados de las funciones configuradas y obtener finalmente el resultado deseado.

## Crear nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ('+') en el flujo para añadir un nodo de "Cálculo de fechas":

![Nodo de Cálculo de fechas_Crear nodo](https://static-docs.nocobase.com/[图片].png)

## Configuración del nodo

![Nodo de Cálculo de fechas_Configuración del nodo](https://static-docs.nocobase.com/20240817184423.png)

### Valor de entrada

El valor de entrada puede ser una variable o una constante de fecha. La variable puede ser los datos que activaron este flujo de trabajo o el resultado de un nodo anterior en este mismo flujo de trabajo. Para la constante, puede seleccionar cualquier fecha.

### Tipo de valor de entrada

Se refiere al tipo del valor de entrada. Existen dos valores posibles.

*   Tipo fecha: Significa que el valor de entrada puede convertirse finalmente a un tipo de fecha y hora, como una marca de tiempo numérica o una cadena que represente una hora.
*   Tipo numérico: Dado que el tipo de valor de entrada afecta la selección de los siguientes pasos de cálculo de tiempo, es necesario seleccionar correctamente el tipo de valor de entrada.

### Pasos de cálculo

Cada paso de cálculo se compone de una función de cálculo y su configuración de parámetros. Adopta un diseño de tuberías (pipeline), donde el resultado del cálculo de la función anterior sirve como valor de entrada para el cálculo de la siguiente función. De esta manera, se puede completar una serie de cálculos y conversiones de tiempo.

Después de cada paso de cálculo, el tipo de salida también es fijo y afectará las funciones disponibles para el siguiente paso de cálculo. El cálculo solo puede continuar si los tipos coinciden. De lo contrario, el resultado de un paso será el resultado de salida final del nodo.

## Funciones de cálculo

### Añadir un periodo de tiempo

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   La cantidad a añadir, que puede ser un número o una variable predefinida del nodo.
    -   Unidad de tiempo.
-   Tipo de valor de salida: Fecha
-   Ejemplo: Si el valor de entrada es `2024-7-15 00:00:00`, la cantidad es `1` y la unidad es "día", el resultado del cálculo será `2024-7-16 00:00:00`.

### Restar un periodo de tiempo

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   La cantidad a restar, que puede ser un número o una variable predefinida del nodo.
    -   Unidad de tiempo.
-   Tipo de valor de salida: Fecha
-   Ejemplo: Si el valor de entrada es `2024-7-15 00:00:00`, la cantidad es `1` y la unidad es "día", el resultado del cálculo será `2024-7-14 00:00:00`.

### Calcular la diferencia con otra fecha

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   La fecha con la que calcular la diferencia, que puede ser una constante de fecha o una variable del contexto del flujo de trabajo.
    -   Unidad de tiempo.
    -   Si se debe tomar el valor absoluto.
    -   Operación de redondeo: Puede elegir entre mantener decimales, redondear, redondear hacia arriba y redondear hacia abajo.
-   Tipo de valor de salida: Numérico
-   Ejemplo: Si el valor de entrada es `2024-7-15 00:00:00`, el objeto de comparación es `2024-7-16 06:00:00`, la unidad es "día", no se toma el valor absoluto y se mantienen los decimales, el resultado del cálculo será `-1.25`.

:::info{title=Consejo}
Cuando el valor absoluto y el redondeo se configuran simultáneamente, primero se toma el valor absoluto y luego se aplica el redondeo.
:::

### Obtener el valor de una fecha en una unidad específica

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   Unidad de tiempo.
-   Tipo de valor de salida: Numérico
-   Ejemplo: Si el valor de entrada es `2024-7-15 00:00:00` y la unidad es "día", el resultado del cálculo será `15`.

### Establecer la fecha al inicio de una unidad específica

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   Unidad de tiempo.
-   Tipo de valor de salida: Fecha
-   Ejemplo: Si el valor de entrada es `2024-7-15 14:26:30` y la unidad es "día", el resultado del cálculo será `2024-7-15 00:00:00`.

### Establecer la fecha al final de una unidad específica

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   Unidad de tiempo.
-   Tipo de valor de salida: Fecha
-   Ejemplo: Si el valor de entrada es `2024-7-15 14:26:30` y la unidad es "día", el resultado del cálculo será `2024-7-15 23:59:59`.

### Comprobar si es año bisiesto

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   Sin parámetros
-   Tipo de valor de salida: Booleano
-   Ejemplo: Si el valor de entrada es `2024-7-15 14:26:30`, el resultado del cálculo será `true`.

### Formatear como cadena de texto

-   Recibe tipo de valor de entrada: Fecha
-   Parámetros
    -   Formato, consulte [Day.js: Format](https://day.js.org/docs/zh-CN/display/format)
-   Tipo de valor de salida: Cadena de texto
-   Ejemplo: Si el valor de entrada es `2024-7-15 14:26:30` y el formato es `the time is YYYY/MM/DD HH:mm:ss`, el resultado del cálculo será `the time is 2024/07/15 14:26:30`.

### Convertir unidad

-   Recibe tipo de valor de entrada: Numérico
-   Parámetros
    -   Unidad de tiempo antes de la conversión.
    -   Unidad de tiempo después de la conversión.
    -   Operación de redondeo, puede elegir entre mantener decimales, redondear, redondear hacia arriba y redondear hacia abajo.
-   Tipo de valor de salida: Numérico
-   Ejemplo: Si el valor de entrada es `2`, la unidad antes de la conversión es "semana", la unidad después de la conversión es "día" y no se mantienen los decimales, el resultado del cálculo será `14`.

## Ejemplo

![Nodo de Cálculo de fechas_Ejemplo](https://static-docs.nocobase.com/20240817184137.png)

Supongamos que hay un evento promocional, y queremos añadir una fecha de fin de promoción al campo de un producto cada vez que se crea uno. Esta fecha de fin es a las 23:59:59 del último día de la semana siguiente a la fecha de creación del producto. Para ello, podemos crear dos funciones de tiempo y ejecutarlas en un sistema de tuberías (pipeline):

-   Calcular la fecha de la próxima semana
-   Restablecer el resultado a las 23:59:59 del último día de esa semana

De esta manera, obtenemos el valor de tiempo deseado y lo pasamos al siguiente nodo, como un nodo de modificación de colección, para añadir la fecha de fin de promoción a la colección.