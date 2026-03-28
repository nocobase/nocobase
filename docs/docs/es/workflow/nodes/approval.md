---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/workflow/nodes/approval).
:::

# Aprobación

## Introducción

En un flujo de trabajo de aprobación, se requiere el uso de un nodo de "Aprobación" dedicado para configurar la lógica operativa (aprobar, rechazar o devolver) que los aprobadores utilizarán para procesar la aprobación iniciada. El nodo de "Aprobación" solo puede utilizarse dentro de procesos de aprobación.

:::info{title=Sugerencia}
Diferencia con el nodo de "Procesamiento manual" ordinario: El nodo de "Procesamiento manual" está destinado a escenarios más generales, como la entrada manual de datos o procesos de decisión manual sobre si continuar el flujo en diversos tipos de flujos de trabajo. El "nodo de Aprobación" es un nodo de procesamiento especializado exclusivamente para procesos de aprobación, que solo maneja los datos de la aprobación iniciada y no puede utilizarse en otros flujos de trabajo.
:::

## Crear nodo

Haga clic en el botón más ("+") en el proceso, añada un nodo de "Aprobación" y seleccione uno de los modos de aprobación para crear el nodo:

![Crear nodo de aprobación](https://static-docs.nocobase.com/20251107000938.png)

## Configuración del nodo

### Modo de aprobación

Existen dos modos de aprobación:

1.  Modo directo: Generalmente se utiliza para procesos sencillos. El hecho de que el nodo de aprobación se apruebe o no solo determina si el proceso finaliza; en caso de no ser aprobado, se sale directamente del proceso.

    ![Modo de aprobación_Modo directo](https://static-docs.nocobase.com/20251107001043.png)

2.  Modo de bifurcación: Generalmente se utiliza para lógicas de datos más complejas. Después de que el nodo de aprobación genere cualquier resultado, se pueden seguir ejecutando otros nodos dentro de su rama de resultados.

    ![Modo de aprobación_Modo de bifurcación](https://static-docs.nocobase.com/20251107001234.png)

    Una vez que este nodo es "Aprobado", además de ejecutar la rama de aprobación, también continuará con el proceso posterior. Tras una acción de "Rechazo", por defecto también se puede continuar con el proceso posterior, o se puede configurar en el nodo para finalizar el proceso después de ejecutar la rama.

:::info{title=Sugerencia}
El modo de aprobación no puede modificarse una vez creado el nodo.
:::

### Aprobador

El aprobador es el conjunto de usuarios responsables del comportamiento de aprobación de este nodo. Puede ser uno o varios usuarios. La fuente de selección puede ser un valor estático de la lista de usuarios o un valor dinámico especificado por una variable:

![Nodo de aprobación_Aprobador](https://static-docs.nocobase.com/20251107001433.png)

Al seleccionar una variable, solo puede elegir la clave primaria o foránea de los datos de usuario en el contexto o en los resultados del nodo. Si la variable seleccionada es un array durante la ejecución (relación de muchos a muchos), cada usuario del array se fusionará en el conjunto total de aprobadores.

Además de seleccionar directamente usuarios o variables, también puede filtrar dinámicamente a los usuarios que cumplan con ciertos criterios basándose en las condiciones de consulta de la tabla de usuarios para que actúen como aprobadores:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Modo de acuerdo

Si al momento de la ejecución final solo hay un aprobador (incluyendo casos tras eliminar duplicados de múltiples variables), independientemente del modo de acuerdo seleccionado, solo ese usuario realizará la operación de aprobación y el resultado será determinado únicamente por él.

Cuando hay varios usuarios en el conjunto de aprobadores, la elección de diferentes modos de acuerdo representa distintas formas de procesamiento:

1. Cualquiera: Basta con que una persona apruebe para que el nodo se considere aprobado; solo si todos rechazan, el nodo se considera rechazado.
2. Cofirma: Se requiere que todos aprueben para que el nodo se considere aprobado; basta con que una persona rechace para que el nodo se considere rechazado.
3. Votación: Se requiere que el número de personas que aprueben supere una proporción establecida para que el nodo se considere aprobado; de lo contrario, se considera rechazado.

Para la operación de devolución, en cualquier modo, si algún usuario del conjunto de aprobadores procesa la solicitud como devolución, el nodo saldrá directamente del proceso.

### Orden de procesamiento

Del mismo modo, cuando hay varios usuarios en el conjunto de aprobadores, la elección de diferentes órdenes de procesamiento representa distintas formas de actuar:

1. Paralelo: Todos los aprobadores pueden procesar en cualquier orden; la secuencia no importa.
2. Secuencial: Los aprobadores procesan uno tras otro según el orden en el conjunto de aprobadores; el siguiente solo puede procesar después de que el anterior haya enviado su decisión.

Independientemente de si se establece como procesamiento "Secuencial", los resultados generados según el orden real de procesamiento también siguen las reglas del "Modo de acuerdo" mencionadas anteriormente. El nodo completa su ejecución una vez que se alcanzan las condiciones correspondientes.

### Salir del flujo de trabajo tras finalizar la rama de rechazo

Cuando el "Modo de aprobación" se establece en "Modo de bifurcación", puede optar por salir del flujo de trabajo tras finalizar la rama de rechazo. Al marcar esta opción, aparecerá una "✗" al final de la rama de rechazo, indicando que no se continuará con los nodos posteriores tras finalizar dicha rama:

![Nodo de aprobación_Salir tras rechazo](https://static-docs.nocobase.com/20251107001839.png)

### Configuración de la interfaz del aprobador

La configuración de la interfaz del aprobador se utiliza para proporcionar al aprobador una interfaz de operación cuando el flujo de trabajo de aprobación llega a este nodo. Haga clic en el botón de configuración para abrir la ventana emergente:

![Nodo de aprobación_Configuración de interfaz_Ventana](https://static-docs.nocobase.com/20251107001958.png)

En la ventana de configuración, puede añadir bloques como el contenido de envío original, información de aprobación, formulario de procesamiento y texto de aviso personalizado:

![Nodo de aprobación_Configuración de interfaz_Añadir bloques](https://static-docs.nocobase.com/20251107002604.png)

#### Contenido de envío original

El bloque de detalles del contenido de aprobación es el bloque de datos enviado por el iniciador. Al igual que un bloque de datos ordinario, puede añadir libremente componentes de campo de la colección y organizarlos para estructurar el contenido que el aprobador necesita revisar:

![Nodo de aprobación_Configuración de interfaz_Bloque de detalles](https://static-docs.nocobase.com/20251107002925.png)

#### Formulario de procesamiento

En el bloque del formulario de operación, puede añadir los botones de acción compatibles con este nodo, incluyendo "Aprobar", "Rechazar", "Devolver", "Reasignar" y "Añadir firmante":

![Nodo de aprobación_Configuración de interfaz_Bloque de formulario de operación](https://static-docs.nocobase.com/20251107003015.png)

Además, en el formulario de operación se pueden añadir campos que el aprobador puede modificar. Estos campos se mostrarán en el formulario cuando el aprobador procese la solicitud; el aprobador puede modificar sus valores y, al enviar, se actualizarán tanto los datos utilizados para la aprobación como la instantánea de los datos correspondientes en el flujo de aprobación.

![Nodo de aprobación_Configuración de interfaz_Formulario de operación_Modificar campos](https://static-docs.nocobase.com/20251107003206.png)

#### "Aprobar" y "Rechazar"

Entre los botones de operación de aprobación, "Aprobar" y "Rechazar" son acciones decisivas. Una vez enviados, se completa el procesamiento del aprobador en este nodo. Los campos adicionales que deben completarse al enviar, como "Comentario", pueden añadirse en la ventana de "Configuración de procesamiento" del botón de operación.

![Nodo de aprobación_Configuración de interfaz_Formulario de operación_Configuración de procesamiento](https://static-docs.nocobase.com/20251107003314.png)

#### "Devolver"

"Devolver" también es una operación decisiva. Además de configurar comentarios, puede configurar los nodos a los que se puede devolver la solicitud:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Reasignar" y "Añadir firmante"

"Reasignar" y "Añadir firmante" son operaciones no decisivas utilizadas para ajustar dinámicamente a los aprobadores en el flujo de aprobación. "Reasignar" consiste en entregar la tarea de aprobación del usuario actual a otro usuario para que la procese; "Añadir firmante" consiste en añadir un aprobador antes o después del aprobador actual para que continúen la aprobación conjuntamente.

Tras habilitar los botones de "Reasignar" o "Añadir firmante", debe seleccionar el "Alcance de asignación de personal" en el menú de configuración del botón para establecer el rango de nuevos aprobadores que pueden ser asignados:

![Nodo de aprobación_Configuración de interfaz_Formulario de operación_Alcance de asignación](https://static-docs.nocobase.com/20241226232321.png)

Al igual que la configuración original de aprobadores del nodo, el alcance de asignación puede consistir en aprobadores seleccionados directamente o basarse en condiciones de consulta de la tabla de usuarios; finalmente se fusionará en un conjunto que no incluirá a los usuarios que ya se encuentren en el conjunto de aprobadores.

:::warning{title=Importante}
Si activa o desactiva algún botón de operación, o si modifica el alcance de asignación de personal, debe guardar la configuración del nodo después de cerrar la ventana de configuración de la interfaz de operación; de lo contrario, los cambios en los botones no surtirán efecto.
:::

### Tarjeta de "Mis aprobaciones" <Badge>2.0+</Badge>

Puede utilizarse para configurar la tarjeta de tarea en la lista de "Mis aprobaciones" del Centro de tareas.

![20260214141554](https://static-docs.nocobase.com/20260214141554.png)

En la tarjeta puede configurar libremente los campos de negocio que desee mostrar (excepto campos de relación) o información relacionada con la aprobación.

Una vez que la aprobación entra en este nodo, podrá ver la tarjeta de tarea personalizada en la lista del Centro de tareas:

![20260214141722](https://static-docs.nocobase.com/20260214141722.png)

## Resultado del nodo

Una vez completada la aprobación, el estado y los datos relacionados se registrarán en el resultado del nodo, pudiendo ser utilizados como variables por los nodos posteriores.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Estado de aprobación del nodo

Representa el estado de procesamiento del nodo de aprobación actual; el resultado es un valor enumerado.

### Datos después de la aprobación

Si el aprobador modificó el contenido de la aprobación en el formulario de operación, los datos modificados se registrarán en el resultado del nodo para su uso en nodos posteriores. Si necesita utilizar campos de relación, debe configurar la precarga de dichos campos en el disparador.

### Registros de aprobación

> v1.8.0+

El registro de procesamiento de aprobación es un array que contiene los registros de procesamiento de todos los aprobadores en este nodo. Cada fila de registro contiene los siguientes campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | number | Identificador único del registro de procesamiento |
| userId | number | ID del usuario que procesó el registro |
| status | number | Estado del procesamiento |
| comment | string | Comentario realizado al procesar |
| updatedAt | string | Fecha y hora de actualización del registro |

Puede utilizar estos campos como variables en los nodos posteriores según sea necesario.