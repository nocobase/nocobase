---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Cálculo JSON

## Introducción

Basándose en diferentes motores de cálculo JSON, este nodo le permite calcular o transformar datos JSON complejos generados por nodos anteriores, para que puedan ser utilizados por nodos posteriores. Por ejemplo, los resultados de operaciones SQL y nodos de solicitud HTTP pueden transformarse a través de este nodo en los valores y formatos de variable necesarios para su uso en nodos posteriores.

## Crear Nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ('+') en el proceso para añadir un nodo de 'Cálculo JSON':

![Crear Nodo](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Nota}
Normalmente, el nodo de Cálculo JSON se crea debajo de otros nodos de datos para poder analizarlos.
:::

## Configuración del Nodo

### Motor de Análisis

El nodo de Cálculo JSON admite diferentes sintaxis a través de distintos motores de análisis. Usted puede elegir según sus preferencias y las características de cada motor. Actualmente, se admiten tres motores de análisis:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Motor de Análisis](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Fuente de Datos

La fuente de datos puede ser el resultado de un nodo anterior o un objeto de datos en el contexto del flujo de trabajo. Generalmente, es un objeto de datos sin una estructura incorporada, como el resultado de un nodo SQL o un nodo de solicitud HTTP.

![Fuente de Datos](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Nota}
Normalmente, los objetos de datos de los nodos relacionados con la colección ya están estructurados a través de la información de configuración de la colección y generalmente no necesitan ser analizados por el nodo de Cálculo JSON.
:::

### Expresión de Análisis

Expresiones de análisis personalizadas, basadas en los requisitos de análisis y el motor de análisis elegido.

![Expresión de Análisis](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Nota}
Cada motor ofrece diferentes sintaxis de análisis. Para más detalles, consulte la documentación en los enlaces.
:::

A partir de la versión `v1.0.0-alpha.15`, las expresiones admiten el uso de variables. Las variables se pre-analizan antes de que el motor específico las ejecute, reemplazando las variables con valores de cadena específicos según las reglas de las plantillas de cadena, y concatenándolas con otras cadenas estáticas en la expresión para formar la expresión final. Esta funcionalidad es muy útil cuando necesita construir expresiones dinámicamente, por ejemplo, cuando algún contenido JSON requiere una clave dinámica para su análisis.

### Mapeo de Propiedades

Cuando el resultado del cálculo es un objeto (o un array de objetos), usted puede, a través del mapeo de propiedades, asignar las propiedades necesarias a variables secundarias para su uso en nodos posteriores.

![Mapeo de Propiedades](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Nota}
Para un resultado de objeto (o array de objetos), si no se realiza el mapeo de propiedades, el objeto completo (o array de objetos) se guardará como una única variable en el resultado del nodo, y los valores de las propiedades del objeto no podrán utilizarse directamente como variables.
:::

## Ejemplo

Supongamos que los datos a analizar provienen de un nodo SQL anterior utilizado para consultar datos, y su resultado es un conjunto de datos de pedidos:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Si necesitamos analizar y calcular el precio total de cada uno de los dos pedidos en los datos, y ensamblarlo con el ID de pedido correspondiente en un objeto para actualizar el precio total del pedido, podemos configurarlo de la siguiente manera:

![Ejemplo - Configuración de Análisis SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Seleccione el motor de análisis JSONata;
2. Seleccione el resultado del nodo SQL como fuente de datos;
3. Utilice la expresión JSONata `$[0].{"id": id, "total": products.(price * quantity)}` para analizar;
4. Seleccione el mapeo de propiedades para asignar `id` y `total` a variables secundarias;

El resultado final del análisis es el siguiente:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Luego, itere sobre el array de pedidos resultante para actualizar el precio total de los pedidos.

![Actualizar el precio total del pedido correspondiente](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)