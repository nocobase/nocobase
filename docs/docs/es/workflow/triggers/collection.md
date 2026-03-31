:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Eventos de Colección

## Introducción

Los disparadores de tipo evento de colección escucharán los eventos de creación, actualización y eliminación en una colección. Cuando ocurre una operación de datos en esa colección y se cumplen las condiciones configuradas, se activa el flujo de trabajo correspondiente. Por ejemplo, esto es útil en escenarios como deducir el inventario de un producto después de crear un nuevo pedido, o esperar una revisión manual después de añadir un nuevo comentario.

## Uso Básico

Existen varios tipos de cambios en una colección:

1.  Después de crear datos.
2.  Después de actualizar datos.
3.  Después de crear o actualizar datos.
4.  Después de eliminar datos.

![Collection Event_Trigger Timing Selection](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Puede elegir el momento del disparo según las diferentes necesidades de su negocio. Cuando el cambio seleccionado incluye la actualización de la colección, también puede especificar los campos que han cambiado. La condición del disparador se cumple solo cuando los campos seleccionados cambian. Si no selecciona ningún campo, significa que cualquier cambio en cualquier campo puede activar el disparador.

![Collection Event_Select Changed Fields](https://static-docs.nocobase.com/874a175f01298b3c00267b2b4674611.png)

Más específicamente, puede configurar reglas de condición para cada campo de la fila de datos que activa el evento. El disparador solo se activará cuando los campos cumplan las condiciones correspondientes.

![Collection Event_Configure Data Conditions](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Después de que se activa un evento de colección, la fila de datos que generó el evento se inyectará en el plan de ejecución como datos de contexto del disparador, para ser utilizada como variable por los nodos posteriores en el flujo de trabajo. Sin embargo, cuando los nodos posteriores necesiten usar los campos de relación de estos datos, primero deberá configurar la precarga de los datos relacionados. Los datos relacionados seleccionados se inyectarán en el contexto junto con el disparador y podrán seleccionarse y usarse jerárquicamente.

## Consejos Relacionados

### Actualmente no se admite el disparo por operaciones de datos masivas

Los eventos de colección actualmente no admiten el disparo por operaciones de datos masivas. Por ejemplo, al crear un artículo y añadir simultáneamente múltiples etiquetas para ese artículo (datos de relaciones de uno a muchos), solo se activará el flujo de trabajo para crear el artículo. Las múltiples etiquetas creadas simultáneamente no activarán el flujo de trabajo para crear etiquetas. Al asociar o añadir datos de relaciones de muchos a muchos, tampoco se activará el flujo de trabajo para la colección intermedia.

### Las operaciones de datos fuera de la aplicación no activarán eventos

Las operaciones en colecciones a través de llamadas a la API HTTP de la interfaz de la aplicación también pueden activar los eventos correspondientes. Sin embargo, si los cambios de datos se realizan directamente a través de operaciones de base de datos en lugar de a través de la aplicación NocoBase, los eventos correspondientes no se podrán activar. Por ejemplo, los disparadores nativos de la base de datos no se asociarán con los flujos de trabajo de la aplicación.

Además, usar el nodo de operación SQL para operar en la base de datos es equivalente a operaciones directas en la base de datos y no activará eventos de colección.

### Fuentes de Datos Externas

Los flujos de trabajo admiten fuentes de datos externas desde la versión `0.20`. Si está utilizando un plugin de fuente de datos externa y el evento de colección está configurado para una fuente de datos externa, siempre que las operaciones de datos en esa fuente de datos se realicen dentro de la aplicación (como creación de usuarios, actualizaciones y operaciones de datos de flujo de trabajo), los eventos de colección correspondientes se pueden activar. Sin embargo, si los cambios de datos se realizan a través de otros sistemas o directamente en la base de datos externa, los eventos de colección no se podrán activar.

## Ejemplo

Tomemos como ejemplo el escenario de calcular el precio total y deducir el inventario después de crear un nuevo pedido.

Primero, creamos una colección de Productos y una colección de Pedidos con los siguientes modelos de datos:

| Nombre del Campo | Tipo de Campo      |
| ---------------- | ------------------ |
| Nombre del Producto | Texto de una línea |
| Precio           | Número             |
| Inventario       | Entero             |

| Nombre del Campo | Tipo de Campo          |
| ---------------- | ---------------------- |
| ID del Pedido    | Secuencia              |
| Producto del Pedido | Muchos a Uno (Productos) |
| Total del Pedido | Número                 |

Y añadimos algunos datos básicos de productos:

| Nombre del Producto | Precio | Inventario |
| ------------------- | ------ | ---------- |
| iPhone 14 Pro       | 7999   | 10         |
| iPhone 13 Pro       | 5999   | 0          |

Luego, creamos un flujo de trabajo basado en el evento de la colección de Pedidos:

![Collection Event_Example_New Order Trigger](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Aquí están algunas de las opciones de configuración:

-   **Colección**: Seleccione la colección "Pedidos".
-   **Momento del disparador**: Seleccione "Después de crear datos".
-   **Condiciones del disparador**: Dejar en blanco.
-   **Precargar datos relacionados**: Marque "Productos".

Luego, configure otros nodos según la lógica del flujo de trabajo: verificar si el inventario del producto es mayor que 0. Si lo es, deducir el inventario; de lo contrario, el pedido es inválido y debe eliminarse:

![Collection Event_Example_New Order Workflow Orchestration](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

La configuración de los nodos se explicará en detalle en la documentación para tipos de nodos específicos.

Habilite este flujo de trabajo y pruébelo creando un nuevo pedido a través de la interfaz. Después de realizar un pedido para el "iPhone 14 Pro", el inventario del producto correspondiente se reducirá a 9. Si se realiza un pedido para el "iPhone 13 Pro", el pedido será eliminado debido a la falta de inventario.

![Collection Event_Example_New Order Execution Result](https://static-docs.nocobase.com/24cbe31e24ba4804b3bd48d99415c54f.png)