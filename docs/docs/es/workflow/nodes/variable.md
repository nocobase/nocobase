---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Variable

## Introducción

Puede declarar variables en un flujo de trabajo o asignar valores a variables ya declaradas. Esto se utiliza generalmente para almacenar datos temporales dentro del flujo.

## Crear nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ("+") en el flujo para añadir un nodo de "Variable":

![Add Variable Node](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Configurar nodo

### Modo

El nodo de variable es similar a las variables en programación: debe declararse antes de poder usarse y asignársele un valor. Por lo tanto, al crear un nodo de variable, debe seleccionar su modo. Hay dos modos disponibles:

![Select Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Declarar una nueva variable: Crea una nueva variable.
- Asignar a una variable existente: Asigna un valor a una variable que ya ha sido declarada anteriormente en el flujo de trabajo, lo que equivale a modificar el valor de la variable.

Cuando el nodo que se está creando es el primer nodo de variable en el flujo de trabajo, solo puede seleccionar el modo de declaración, ya que aún no hay variables disponibles para asignar.

Cuando elija asignar un valor a una variable declarada, también deberá seleccionar la variable de destino, que es el nodo donde se declaró la variable:

![Select the variable to assign a value to](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Valor

El valor de una variable puede ser de cualquier tipo. Puede ser una constante, como una cadena de texto, un número, un valor booleano o una fecha, o puede ser otra variable del flujo de trabajo.

En el modo de declaración, establecer el valor de la variable equivale a asignarle un valor inicial.

![Declare initial value](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

En el modo de asignación, establecer el valor de la variable equivale a modificar el valor de la variable de destino declarada por un nuevo valor. Los usos posteriores recuperarán este nuevo valor.

![Assign a trigger variable to a declared variable](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Usar el valor de la variable

En los nodos posteriores al nodo de variable, puede utilizar el valor de la variable seleccionando la variable declarada del grupo "Variables de nodo". Por ejemplo, en un nodo de consulta, use el valor de la variable como condición de consulta:

![Use variable value as a query filter condition](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Ejemplo

Un escenario más útil para el nodo de variable es en las ramas, donde se calculan o fusionan nuevos valores con valores anteriores (similar a `reduce`/`concat` en programación), y luego se utilizan una vez finalizada la rama. A continuación, se muestra un ejemplo de cómo utilizar una rama de bucle y un nodo de variable para concatenar una cadena de destinatarios.

Primero, cree un flujo de trabajo activado por una colección que se dispare cuando se actualicen los datos de "Artículo", y precargue los datos de relación de "Autor" asociados (para obtener los destinatarios):

![Configure Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Luego, cree un nodo de variable para almacenar la cadena de destinatarios:

![Recipient variable node](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

A continuación, cree un nodo de rama de bucle para iterar a través de los autores del artículo y concatenar su información de destinatario en la variable de destinatario:

![Loop through authors in the article](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Dentro de la rama de bucle, primero cree un nodo de cálculo para concatenar el autor actual con la cadena de autores ya almacenada:

![Concatenate recipient string](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Después del nodo de cálculo, cree otro nodo de variable. Seleccione el modo de asignación, elija el nodo de variable de destinatario como objetivo de asignación y seleccione el resultado del nodo de cálculo como valor:

![Assign the concatenated recipient string to the recipient node](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

De esta manera, una vez finalizada la rama de bucle, la variable de destinatario almacenará la cadena de destinatarios de todos los autores del artículo. Luego, después del bucle, puede usar un nodo de solicitud HTTP para llamar a una API de envío de correo, pasando el valor de la variable de destinatario como parámetro de destinatario a la API:

![Send mail to recipients via the request node](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

Hasta aquí, una función sencilla de envío masivo de correos electrónicos se ha implementado utilizando un bucle y un nodo de variable.