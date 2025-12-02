---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Mapeo de Variables JSON

> v1.6.0

## Introducción

Se utiliza para mapear estructuras JSON complejas de los resultados de nodos anteriores a variables, para que puedan ser utilizadas en nodos posteriores. Por ejemplo, los valores de las propiedades de los resultados de las operaciones SQL y los nodos de solicitud HTTP pueden utilizarse en nodos posteriores una vez mapeados.

:::info{title=Consejo}
A diferencia del nodo de Cálculo JSON, el nodo de Mapeo de Variables JSON no admite expresiones personalizadas ni se basa en un motor de terceros. Se utiliza únicamente para mapear valores de propiedades en una estructura JSON, pero su uso es más sencillo.
:::

## Crear Nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ('+') en el flujo para añadir un nodo de "Mapeo de Variables JSON":

![Crear Nodo](https://static-docs.nocobase.com/20250113173635.png)

## Configuración del Nodo

### Fuente de Datos

La fuente de datos puede ser el resultado de un nodo anterior o un objeto de datos en el contexto del proceso. Generalmente, es un objeto de datos no estructurado, como el resultado de un nodo SQL o un nodo de solicitud HTTP.

![Fuente de Datos](https://static-docs.nocobase.com/20250113173720.png)

### Introducir Datos de Ejemplo

Pegue datos de ejemplo y haga clic en el botón de análisis para generar automáticamente una lista de variables:

![Introducir Datos de Ejemplo](https://static-docs.nocobase.com/20250113182327.png)

Si hay variables en la lista generada automáticamente que no necesite utilizar, puede eliminarlas haciendo clic en el botón de eliminar.

:::info{title=Consejo}
Los datos de ejemplo no son el resultado final de la ejecución; solo se utilizan para ayudar a generar la lista de variables.
:::

### La Ruta Incluye Índice de Array

Si no está marcada esta opción, el contenido del array se mapeará según el método predeterminado de manejo de variables de los flujos de trabajo de NocoBase. Por ejemplo, si introduce el siguiente ejemplo:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

En las variables generadas, `b.c` representará el array `[2, 3]`.

Si marca esta opción, la ruta de la variable incluirá el índice del array, por ejemplo, `b.0.c` y `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Al incluir índices de array, debe asegurarse de que los índices de array en los datos de entrada sean consistentes; de lo contrario, se producirá un error de análisis.

## Uso en Nodos Posteriores

En la configuración de los nodos posteriores, puede utilizar las variables generadas por el nodo de Mapeo de Variables JSON:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Aunque la estructura JSON puede ser compleja, después del mapeo, solo necesita seleccionar la variable para la ruta correspondiente.