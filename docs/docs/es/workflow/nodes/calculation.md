:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Nodo de Cálculo

El nodo de Cálculo le permite evaluar una expresión. El resultado de esta evaluación se guarda en el propio nodo, quedando disponible para su uso en nodos posteriores del flujo de trabajo. Es una herramienta potente para calcular, procesar y transformar datos. En cierta medida, puede reemplazar la funcionalidad de llamar a una función sobre un valor y asignar el resultado a una variable, como se haría en lenguajes de programación.

## Crear un nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de signo más ("+") dentro del flujo para añadir un nodo de "Cálculo":

![Nodo de Cálculo_Añadir](https://static-docs.nocobase.com/58a45540d26945251cd143eb4b16579.png)

## Configuración del nodo

![Nodo de Cálculo_Configuración](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Motor de cálculo

El motor de cálculo define la sintaxis que soporta la expresión. Actualmente, los motores de cálculo compatibles son [Math.js](https://mathjs.org/) y [Formula.js](https://formulajs.info/). Cada motor incluye una gran cantidad de funciones comunes y métodos para la manipulación de datos. Para conocer su uso específico, puede consultar su documentación oficial.

:::info{title=Sugerencia}
Es importante tener en cuenta que los diferentes motores varían en la forma de acceder a los índices de los arreglos. Mientras que los índices de Math.js comienzan en `1`, los de Formula.js lo hacen en `0`.
:::

Además, si necesita una concatenación de cadenas sencilla, puede utilizar directamente la opción "Plantilla de cadena". Este motor reemplazará las variables de la expresión con sus valores correspondientes y, a continuación, devolverá la cadena resultante.

### Expresión

Una expresión es la representación en cadena de texto de una fórmula de cálculo. Puede estar compuesta por variables, constantes, operadores y funciones compatibles. Puede utilizar variables del contexto del flujo, como el resultado de un nodo anterior al nodo de cálculo, o variables locales de un bucle.

Si la expresión introducida no cumple con la sintaxis, se mostrará un error en la configuración del nodo. Si durante la ejecución la variable no existe, el tipo no coincide o se utiliza una función inexistente, el nodo de cálculo se detendrá prematuramente con un estado de error.

## Ejemplo

### Calcular el precio total de un pedido

Normalmente, un pedido puede contener varios artículos, cada uno con un precio y una cantidad diferentes. El precio total del pedido debe ser la suma de los productos del precio y la cantidad de todos los artículos. Después de cargar la lista de detalles del pedido (un conjunto de datos con relación uno a muchos), puede utilizar un nodo de cálculo para determinar el precio total del pedido:

![Nodo de Cálculo_Ejemplo_Configuración](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Aquí, la función `SUMPRODUCT` de Formula.js puede calcular la suma de los productos de dos arreglos de la misma longitud, lo que le permite obtener el precio total del pedido.