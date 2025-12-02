:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Colección de expresiones

## Crear una colección de plantilla de "expresiones"

Antes de utilizar nodos de operación de expresiones dinámicas dentro de un flujo de trabajo, es esencial que primero cree una colección de plantilla de "expresiones" en la herramienta de gestión de colecciones. Esta colección servirá como un repositorio para almacenar diversas expresiones:

![Crear una colección de expresiones](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Introducir datos de expresión

Luego, puede configurar un bloque de tabla e introducir varias entradas de fórmula en la colección de plantilla. Cada fila en la colección de plantilla de "expresiones" se puede considerar como una regla de cálculo diseñada para un modelo de datos específico dentro de la colección. Puede utilizar diferentes campos de los modelos de datos de varias colecciones como variables, creando expresiones únicas como reglas de cálculo. Además, puede aprovechar diferentes motores de cálculo según sea necesario.

![Introducir datos de expresión](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Sugerencia}
Una vez que las fórmulas estén establecidas, es necesario vincularlas con los datos de negocio. Asociar directamente cada fila de datos de negocio con los datos de fórmula puede ser tedioso. Por lo tanto, un enfoque común es utilizar una colección de metadatos, similar a una colección de clasificación, para crear una relación de muchos a uno (o de uno a uno) con la colección de fórmulas. Luego, los datos de negocio se asocian con los metadatos clasificados en una relación de muchos a uno. Este enfoque le permite simplemente especificar los metadatos clasificados relevantes al crear datos de negocio, facilitando la localización y utilización de los datos de fórmula correspondientes a través de la ruta de asociación establecida.
:::

## Cargar datos relevantes en el proceso

Como ejemplo, considere crear un flujo de trabajo que se active por un evento de colección. Cuando se crea un pedido, el disparador debe precargar los datos del producto asociado junto con los datos de expresión relacionados con el producto:

![Evento de colección_Configuración del disparador](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)