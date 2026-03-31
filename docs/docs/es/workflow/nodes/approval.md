---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Aprobación

## Introducción

En un flujo de trabajo de aprobación, necesitará usar un nodo de 'Aprobación' dedicado para configurar la lógica operativa para que los aprobadores procesen (aprueben, rechacen o devuelvan) las solicitudes de aprobación iniciadas. El nodo de 'Aprobación' solo se puede usar en procesos de aprobación.

:::info{title=Sugerencia}
Diferencia con el nodo 'Manual' regular: El nodo 'Manual' regular está diseñado para escenarios más generales, como la entrada manual de datos o decisiones manuales sobre si continuar el proceso en varios tipos de flujos de trabajo. El 'nodo de Aprobación' es un nodo de procesamiento especializado, exclusivo para procesos de aprobación, que maneja solo los datos de la aprobación iniciada y no se puede usar en otros flujos de trabajo.
:::

## Crear Nodo

Haga clic en el botón de más ('+') en el flujo, añada un nodo de 'Aprobación' y luego seleccione uno de los modos de aprobación para crear el nodo de aprobación:

![Crear Nodo de Aprobación](https://static-docs.nocobase.com/20251107000938.png)

## Configuración del Nodo

### Modo de Aprobación

Existen dos modos de aprobación:

1.  **Modo directo**: Se utiliza normalmente para procesos más sencillos. Si el nodo de aprobación se aprueba o no, solo determina si el proceso finaliza. Si no se aprueba, el proceso finaliza directamente.

    ![Modo directo](https://static-docs.nocobase.com/20251107001043.png)

2.  **Modo de bifurcación**: Se utiliza normalmente para lógicas de datos más complejas. Después de que el nodo de aprobación produce cualquier resultado, se pueden seguir ejecutando otros nodos dentro de su rama de resultados.

    ![Modo de bifurcación](https://static-docs.nocobase.com/20251107001234.png)

    Una vez que este nodo es 'Aprobado', además de ejecutar la rama de aprobación, el flujo de trabajo posterior también continuará. Después de una acción de 'Rechazo', el flujo de trabajo posterior también puede continuar por defecto, o puede configurar el nodo para finalizar el proceso después de ejecutar la rama.

:::info{title=Sugerencia}
El modo de aprobación no se puede modificar después de crear el nodo.
:::

### Aprobador

El aprobador es el conjunto de usuarios responsables de la acción de aprobación de este nodo. Puede ser uno o varios usuarios. La fuente puede ser un valor estático seleccionado de la lista de usuarios o un valor dinámico especificado por una variable:

![Configuración del Aprobador](https://static-docs.nocobase.com/20251107001433.png)

Al seleccionar una variable, solo puede elegir la clave primaria o la clave foránea de los datos de usuario del contexto y los resultados del nodo. Si la variable seleccionada es un array durante la ejecución (una relación de uno a muchos), cada usuario en el array se fusionará en el conjunto completo de aprobadores.

Además de seleccionar directamente usuarios o variables, también puede filtrar dinámicamente usuarios que cumplan las condiciones, basándose en criterios de consulta de la colección de usuarios, para que actúen como aprobadores:

![Filtrar aprobadores dinámicamente](https://static-docs.nocobase.com/20251107001703.png)

### Modo de Acuerdo

Si solo hay un aprobador en el momento de la ejecución final (incluyendo el caso después de la deduplicación de múltiples variables), entonces, independientemente del modo de acuerdo seleccionado, solo ese usuario realizará la acción de aprobación y el resultado será determinado únicamente por ese usuario.

Cuando hay varios usuarios en el conjunto de aprobadores, seleccionar diferentes modos de acuerdo representa diferentes métodos de procesamiento:

1.  **Cualquiera**: Basta con que una persona apruebe para que el nodo se considere aprobado. El nodo solo se rechaza si todos lo rechazan.
2.  **Cofirma**: Todos deben aprobar para que el nodo se considere aprobado. Si una sola persona lo rechaza, el nodo se considera rechazado.
3.  **Votación**: El número de personas que aprueban debe superar una proporción establecida para que el nodo se considere aprobado; de lo contrario, el nodo se considera rechazado.

Para la acción de devolución, en cualquier modo, si algún usuario en el conjunto de aprobadores lo procesa como una devolución, el nodo saldrá directamente del proceso.

### Orden de Procesamiento

De manera similar, cuando hay varios usuarios en el conjunto de aprobadores, seleccionar diferentes órdenes de procesamiento representa diferentes métodos de procesamiento:

1.  **Paralelo**: Todos los aprobadores pueden procesar en cualquier orden; el orden de procesamiento no importa.
2.  **Secuencial**: Los aprobadores procesan secuencialmente según el orden en el conjunto de aprobadores. El siguiente aprobador solo puede procesar después de que el anterior haya enviado su respuesta.

Independientemente de si está configurado para procesamiento 'Secuencial', el resultado producido según el orden de procesamiento real también seguirá las reglas del 'Modo de Acuerdo' mencionado anteriormente. El nodo completa su ejecución una vez que se cumplen las condiciones correspondientes.

### Salir del flujo de trabajo después de que finalice la rama de rechazo

Cuando el 'Modo de Aprobación' se establece en 'Modo de bifurcación', puede elegir salir del flujo de trabajo después de que finalice la rama de rechazo. Después de marcar esta opción, se mostrará una '✗' al final de la rama de rechazo, indicando que los nodos posteriores no continuarán después de que finalice esta rama:

![Salir después de rechazar](https://static-docs.nocobase.com/20251107001839.png)

### Configuración de la Interfaz del Aprobador

La configuración de la interfaz del aprobador se utiliza para proporcionar una interfaz de operación para el aprobador cuando el flujo de trabajo de aprobación llega a este nodo. Haga clic en el botón de configuración para abrir la ventana emergente:

![Ventana emergente de configuración de la interfaz del aprobador](https://static-docs.nocobase.com/20251107001958.png)

En la ventana emergente de configuración, puede añadir bloques como el contenido de envío original, información de aprobación, un formulario de procesamiento y texto de aviso personalizado:

![Añadir bloques a la interfaz del aprobador](https://static-docs.nocobase.com/20251107002604.png)

#### Contenido de Envío Original

El bloque de detalles del contenido de aprobación es el bloque de datos enviado por el iniciador. Similar a un bloque de datos regular, puede añadir libremente componentes de campo de la colección y organizarlos libremente para organizar el contenido que el aprobador necesita ver:

![Configuración del bloque de detalles](https://static-docs.nocobase.com/20251107002925.png)

#### Formulario de Procesamiento

En el bloque del formulario de acción, puede añadir botones de acción compatibles con este nodo, incluyendo 'Aprobar', 'Rechazar', 'Devolver', 'Reasignar' y 'Añadir firmante':

![Bloque de formulario de acción](https://static-docs.nocobase.com/20251107003015.png)

Además, también se pueden añadir campos modificables por el aprobador al formulario de acción. Estos campos se mostrarán en el formulario de acción cuando el aprobador esté procesando la aprobación. El aprobador puede modificar los valores de estos campos y, al enviarlos, se actualizarán simultáneamente tanto los datos para la aprobación como la instantánea de los datos correspondientes en el proceso de aprobación.

![Modificar campos de contenido de aprobación](https://static-docs.nocobase.com/20251107003206.png)

#### 'Aprobar' y 'Rechazar'

Entre los botones de acción de aprobación, 'Aprobar' y 'Rechazar' son acciones decisivas. Después de la presentación, el procesamiento del aprobador para este nodo se completa. Los campos adicionales que deben completarse al enviar, como 'Comentario', se pueden añadir en la ventana emergente de 'Configuración de procesamiento' del botón de acción.

![Configuración de procesamiento](https://static-docs.nocobase.com/20251107003314.png)

#### 'Devolver'

'Devolver' también es una operación decisiva. Además de poder configurar comentarios, también puede configurar los nodos a los que se puede devolver:

![Nodos a los que se puede devolver](https://static-docs.nocobase.com/20251107003555.png)

#### 'Reasignar' y 'Añadir Firmante'

'Reasignar' y 'Añadir firmante' son acciones no decisivas utilizadas para ajustar dinámicamente los aprobadores en el proceso de aprobación. 'Reasignar' es entregar la tarea de aprobación del usuario actual a otro usuario para que la procese. 'Añadir firmante' es añadir un aprobador antes o después del aprobador actual, y el nuevo aprobador continuará el proceso de aprobación junto con los demás.

Después de habilitar los botones de acción 'Reasignar' o 'Añadir firmante', deberá seleccionar el 'Alcance de asignación de personal' en el menú de configuración del botón para establecer el rango de usuarios que pueden ser asignados como nuevos aprobadores:

![Alcance de asignación](https://static-docs.nocobase.com/20241226232321.png)

Al igual que la configuración original del aprobador del nodo, el alcance de asignación de personal también puede ser aprobadores seleccionados directamente o basarse en condiciones de consulta de la colección de usuarios. Finalmente se fusionará en un conjunto y no incluirá a los usuarios que ya estén en el conjunto de aprobadores.

:::warning{title=Importante}
Si se habilita o deshabilita un botón de acción, o se modifica el alcance de asignación de personal, debe guardar la configuración del nodo después de cerrar la ventana emergente de configuración de la interfaz de acción. De lo contrario, los cambios en el botón de acción no surtirán efecto.
:::

## Resultado del Nodo

Una vez completada la aprobación, el estado y los datos relevantes se registrarán en el resultado del nodo y podrán ser utilizados como variables por los nodos posteriores.

![Resultado del nodo](https://static-docs.nocobase.com/20250614095052.png)

### Estado de Aprobación del Nodo

Representa el estado de procesamiento del nodo de aprobación actual. El resultado es un valor enumerado.

### Datos Después de la Aprobación

Si el aprobador modifica el contenido de la aprobación en el formulario de acción, los datos modificados se registrarán en el resultado del nodo para su uso por nodos posteriores. Para usar campos de relación, debe configurar la precarga para los campos de relación en el disparador.

### Registros de Aprobación

> v1.8.0+

El registro de procesamiento de aprobación es un array que contiene los registros de procesamiento de todos los aprobadores en este nodo. Cada registro de procesamiento incluye los siguientes campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | number | Identificador único del registro de procesamiento |
| userId | number | ID de usuario que procesó este registro |
| status | number | Estado de procesamiento |
| comment | string | Comentario en el momento del procesamiento |
| updatedAt | string | Hora de actualización del registro de procesamiento |

Puede usar estos campos como variables en nodos posteriores según sea necesario.