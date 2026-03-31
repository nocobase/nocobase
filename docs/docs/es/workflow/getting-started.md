:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Primeros pasos

## Configure su primer flujo de trabajo

Acceda a la página de administración del plugin de flujo de trabajo desde el menú de configuración de plugins en la barra de menú superior:

![Entrada a la administración del plugin de flujo de trabajo](https://static-docs.nocobase.com/20251027222721.png)

La interfaz de administración le mostrará todos los flujos de trabajo que ha creado:

![Administración de flujos de trabajo](https://static-docs.nocobase.com/20251027222900.png)

Haga clic en el botón "Nuevo" para crear un nuevo flujo de trabajo y seleccione el evento de colección:

![Crear flujo de trabajo](https://static-docs.nocobase.com/20251027222951.png)

Después de enviar, haga clic en el enlace "Configurar" en la lista para acceder a la interfaz de configuración del flujo de trabajo:

![Un flujo de trabajo vacío](https://static-docs.nocobase.com/20251027223131.png)

Luego, haga clic en la tarjeta del disparador para abrir el panel de configuración del disparador. Seleccione una colección creada previamente (por ejemplo, la colección "Artículos"), elija "Después de añadir un registro" para el momento del disparador y haga clic en el botón "Guardar" para completar la configuración del disparador:

![Configurar disparador](https://static-docs.nocobase.com/20251027224735.png)

A continuación, podemos hacer clic en el botón de más (+) en el flujo para añadir un nodo. Por ejemplo, seleccione un nodo de cálculo para concatenar el campo "Título" y el campo "ID" de los datos del disparador:

![Añadir nodo de cálculo](https://static-docs.nocobase.com/20251027224842.png)

Haga clic en la tarjeta del nodo para abrir el panel de configuración del nodo. Utilice la función de cálculo `CONCATENATE` proporcionada por Formula.js para concatenar los campos "Título" e "ID". Ambos campos se insertan a través del selector de variables:

![Nodo de cálculo usando funciones y variables](https://static-docs.nocobase.com/20251027224939.png)

Después, cree un nodo de actualización de datos para guardar el resultado en el campo "Título":

![Crear nodo de actualización de datos](https://static-docs.nocobase.com/20251027232654.png)

De manera similar, haga clic en la tarjeta para abrir el panel de configuración del nodo de actualización de datos. Seleccione la colección "Artículos", elija el ID de datos del disparador para el ID del registro a actualizar, seleccione "Título" para el campo a actualizar y elija el resultado del nodo de cálculo para el valor:

![Configurar nodo de actualización de datos](https://static-docs.nocobase.com/20251027232802.png)

Finalmente, haga clic en el interruptor "Habilitar"/"Deshabilitar" en la barra de herramientas superior derecha para cambiar el flujo de trabajo al estado habilitado, de modo que pueda ser disparado y ejecutado.

## Disparar el flujo de trabajo

Vuelva a la interfaz principal del sistema, cree un artículo a través del bloque de artículos y rellene el título del artículo:

![Crear datos de artículo](https://static-docs.nocobase.com/20251027233004.png)

Después de enviar y actualizar el bloque, podrá ver que el título del artículo se ha actualizado automáticamente al formato "Título del artículo + ID del artículo":

![Título del artículo modificado por el flujo de trabajo](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Sugerencia}
Dado que los flujos de trabajo disparados por eventos de colección se ejecutan de forma asíncrona, es posible que no vea la actualización de los datos inmediatamente en la interfaz después de enviarlos. Sin embargo, después de un breve momento, podrá ver el contenido actualizado al refrescar la página o el bloque.
:::

## Ver el historial de ejecución

El flujo de trabajo se ha disparado y ejecutado con éxito una vez. Podemos volver a la interfaz de administración del flujo de trabajo para ver el historial de ejecución correspondiente:

![Ver lista de flujos de trabajo](https://static-docs.nocobase.com/20251027233246.png)

En la lista de flujos de trabajo, puede ver que este flujo de trabajo ha generado un historial de ejecución. Haga clic en el enlace de la columna de recuento para abrir los registros del historial de ejecución del flujo de trabajo correspondiente:

![Lista del historial de ejecución del flujo de trabajo correspondiente](https://static-docs.nocobase.com/20251027233341.png)

Haga clic en el enlace "Ver" para acceder a la página de detalles de esa ejecución, donde podrá ver el estado de ejecución y los datos de resultado de cada nodo:

![Detalles del historial de ejecución del flujo de trabajo](https://static-docs.nocobase.com/20251027233615.png)

Los datos de contexto del disparador y los datos de resultado de la ejecución del nodo se pueden ver haciendo clic en el botón de estado en la esquina superior derecha de la tarjeta correspondiente. Por ejemplo, veamos los datos de resultado del nodo de cálculo:

![Resultado del nodo de cálculo](https://static-docs.nocobase.com/20251027233635.png)

Puede ver que los datos de resultado del nodo de cálculo contienen el título calculado, que es el dato que el nodo de actualización de datos posterior utilizará para actualizar.

## Resumen

A través de los pasos anteriores, hemos completado la configuración y el disparo de un flujo de trabajo simple y nos hemos familiarizado con los siguientes conceptos básicos:

-   **Flujo de trabajo**: Se utiliza para definir la información básica de un proceso, incluyendo el nombre, el tipo de disparador y el estado de habilitación. Puede configurar cualquier número de nodos dentro de él. Es la entidad que contiene el proceso.
-   **Disparador**: Cada flujo de trabajo contiene un disparador, que se puede configurar con condiciones específicas para que el flujo de trabajo se inicie. Es el punto de entrada del proceso.
-   **Nodo**: Un nodo es una unidad de instrucción dentro de un flujo de trabajo que realiza una acción específica. Múltiples nodos en un flujo de trabajo forman un proceso de ejecución completo a través de relaciones de flujo ascendente y descendente.
-   **Ejecución**: Una ejecución es el objeto específico que se ejecuta después de que se dispara un flujo de trabajo, también conocido como registro de ejecución o historial de ejecución. Contiene información como el estado de la ejecución y los datos de contexto del disparador. También existen resultados de ejecución correspondientes para cada nodo, que incluyen el estado y los datos de resultado después de la ejecución del nodo.

Para un uso más avanzado, puede consultar el siguiente contenido:

-   [Disparadores](./triggers/index)
-   [Nodos](./nodes/index)
-   [Uso de variables](./advanced/variables)
-   [Ejecuciones](./advanced/executions)
-   [Gestión de versiones](./advanced/revisions)
-   [Opciones avanzadas](./advanced/options)