---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Invocar un flujo de trabajo

## Introducción

Este nodo le permite invocar otros flujos de trabajo desde un flujo de trabajo principal. Puede usar las variables del flujo de trabajo actual como entrada para el subflujo de trabajo, y luego utilizar la salida del subflujo de trabajo como variables en el flujo de trabajo principal para su uso en nodos posteriores.

El proceso para invocar un flujo de trabajo se ilustra en la siguiente imagen:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Al invocar flujos de trabajo, usted puede reutilizar lógicas de proceso comunes, como el envío de correos electrónicos o SMS, o dividir un flujo de trabajo complejo en varios subflujos de trabajo para facilitar su gestión y mantenimiento.

En esencia, un flujo de trabajo no distingue si un proceso es un subflujo de trabajo. Cualquier flujo de trabajo puede ser invocado como un subflujo de trabajo por otros flujos, y a su vez, puede invocar otros flujos. Todos los flujos de trabajo son iguales; solo existe la relación de invocación y ser invocado.

De manera similar, la invocación de un flujo de trabajo se utiliza en dos contextos principales:

1.  En el flujo de trabajo principal: Como invocador, usted llama a otros flujos de trabajo a través del nodo "Invocar flujo de trabajo".
2.  En el subflujo de trabajo: Como parte invocada, usted guarda las variables que deben ser la salida del flujo de trabajo actual a través del nodo "Salida del flujo de trabajo". Estas variables pueden ser utilizadas por nodos posteriores en el flujo de trabajo que lo invocó.

## Crear un nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ('+') dentro del flujo para añadir un nodo de "Invocar flujo de trabajo":

![添加调用工作流节点](https://static-docs.nocobase.com/20241230001323.png)

## Configurar el nodo

### Seleccionar el flujo de trabajo

Seleccione el flujo de trabajo que desea invocar. Puede usar la barra de búsqueda para encontrarlo rápidamente:

![选择工作流](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Consejo}
* Los flujos de trabajo deshabilitados también pueden ser invocados como subflujos de trabajo.
* Si el flujo de trabajo actual está en modo síncrono, solo podrá invocar subflujos de trabajo que también estén en modo síncrono.
:::

### Configurar las variables del disparador del flujo de trabajo

Una vez seleccionado el flujo de trabajo, también deberá configurar las variables del disparador, que servirán como datos de entrada para activar el subflujo de trabajo. Puede seleccionar datos estáticos directamente o elegir variables del flujo de trabajo actual:

![配置触发器变量](https://static-docs.nocobase.com/20241230162722.png)

Los diferentes tipos de disparadores requieren variables distintas, las cuales se pueden configurar en el formulario según sea necesario.

## Nodo de salida del flujo de trabajo

Consulte el contenido del nodo [Salida del flujo de trabajo](./output.md) para configurar las variables de salida del subflujo de trabajo.

## Usar la salida del flujo de trabajo

De vuelta en el flujo de trabajo principal, en los nodos que se encuentran después del nodo "Invocar flujo de trabajo", cuando desee utilizar el valor de salida del subflujo de trabajo, puede seleccionar el resultado del nodo "Invocar flujo de trabajo". Si el subflujo de trabajo genera un valor simple, como una cadena de texto, un número, un valor booleano o una fecha (la fecha es una cadena en formato UTC), puede usarlo directamente. Si se trata de un objeto complejo (como un objeto de una colección), deberá mapearlo primero a través de un nodo de "Análisis JSON" para poder usar sus propiedades; de lo contrario, solo podrá usarlo como un objeto completo.

Si el subflujo de trabajo no tiene un nodo de "Salida del flujo de trabajo" configurado, o si no genera ningún valor, entonces al usar el resultado del nodo "Invocar flujo de trabajo" en el flujo de trabajo principal, solo obtendrá un valor nulo (`null`).