---
title: "Flujo de trabajo + IA para que los empleados completen la automatización de la investigación de antecedentes de la empresa"
description: "A través de formularios de información de la empresa, registros de investigación de antecedentes, flujos de trabajo y empleados de IA, se puede activar, retener y respaldar automáticamente un proceso de investigación de antecedentes de la empresa para su revisión manual."
keywords: "NocoBase, empleados de IA, flujo de trabajo, investigación de antecedentes de la empresa, diligencia debida, automatización, práctica empresarial"
---

# Flujo de trabajo + IA para que los empleados completen la automatización de la investigación de antecedentes de la empresa

En NocoBase, puede convertir la investigación de antecedentes de la empresa en un flujo de tareas automatizado rastreable. El personal comercial todavía trabaja en la página de información familiar de la empresa, mientras que el personal de flujo de trabajo y de inteligencia artificial es responsable de completar la información general, registrar el proceso de procesamiento y guardar cada informe generado.

![](https://static-docs.nocobase.com/202607121806356.png)

Este escenario es adecuado para abordar un problema común: la información de antecedentes de la empresa no es un campo estático que finaliza después de ingresarse una vez. La información pública cambiará, ocurrirán eventos regulatorios y el estado de la cooperación se ajustará constantemente a medida que avance el negocio. Si sólo confía en la grabación complementaria manual de forma regular, será fácil pasarlo por alto; Si permite que AI cubra directamente la información de la empresa, será difícil explicar "cómo surgió este juicio". El enfoque aquí es separar y guardar los datos actuales y el proceso de investigación: el registro de la empresa guarda la versión que utiliza el personal de la empresa y el registro de verificación de antecedentes guarda el estado, los resultados y el historial de cada encuesta de IA.

## Veamos primero las dos tablas.

El formulario de información de la empresa proporciona la información básica del objeto de investigación, y el formulario de registro de investigación de antecedentes es responsable de realizar cada tarea de investigación. Uno guarda la información disponible actualmente y el otro guarda el proceso de procesamiento y los resultados históricos.

### `companies`: Tabla de información de la empresa

| Campos centrales               | efecto                                                           |
| ---------------------- | -------------------------------------------------------------- |
| Company name           | Los principales datos identificativos del objeto de investigación.                                   |
| Website                | Proporcione pistas del sitio web oficial para reducir los errores de juicio causados ​​por empresas con el mismo nombre o abreviatura.                   |
| Address                | Asistir en la determinación de regiones, entidades y alcance del negocio.                                 |
| Company type           | Marcar relaciones comerciales como clientes, proveedores, socios, etc. para facilitar el juicio posterior y las prioridades de seguimiento. |
| Background information | Guarde el informe de antecedentes de la empresa que está utilizando actualmente y utilice Markdown para representar contenido estructurado. |

### `background_check_tasks`: Formulario de registro de verificación de antecedentes

| Campos centrales                  | efecto                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Company ID / Company name | Registre a qué empresa es esta encuesta para facilitar la ejecución de la tarea y la revisión histórica.                                 |
| Status                    | El flujo de tareas de marcado de `pending` a `processing` y `completed` también es la base para evitar activaciones repetidas. |
| Research report           | Guarde el informe de investigación completo generado por AI esta vez.                                                   |
| Summary                   | Guarde el resumen de AI del proceso de investigación, los puntos de riesgo y la información para complementar.                                     |
| Previous background       | Guarde la versión anterior antes de volver a escribir, lo que admite el seguimiento histórico y la comparación de informes nuevos y antiguos.                                   |

![](https://static-docs.nocobase.com/202607121807627.png)

## Ingrese al proceso de investigación desde la información de la empresa.

La lista de empresas es la entrada más familiar para los empresarios. Puede ver el nombre de la empresa, el sitio web oficial, el tipo de empresa, la persona de contacto, el correo electrónico y otra información en la página. Después de ingresar a una empresa, el personal comercial puede ver el informe de antecedentes actual o iniciar una nueva investigación de antecedentes.

Después de ingresar a la página de edición, se muestra "Información de fondo" usando el componente de edición Markdown. El contenido generado por IA no es un breve resumen, sino un informe estructurado que se puede leer, copiar y mantener. El personal empresarial aún puede modificarlo manualmente, pero cada resultado generado por la IA dejará un historial correspondiente en el registro de verificación de antecedentes.

![](https://static-docs.nocobase.com/202607121807450.png)

De esta manera, la página todavía parece una interfaz ordinaria de mantenimiento de datos de una empresa y el método de procesamiento subyacente se ha convertido en "datos actuales + historial de investigación". La tabla de empresa guarda la versión actual y la tabla de tareas guarda el proceso y la cadena de evidencia.

## Tres métodos de activación

![](https://static-docs.nocobase.com/202607121807495.png)

La investigación de antecedentes no debería depender únicamente de un botón manual. En los negocios reales, es posible que desee completar automáticamente la información después de agregar una nueva empresa, es posible que también necesite crear registros históricos con regularidad y también puede tomar la iniciativa de volver a investigar antes de firmar un contrato o revisarlo.

El flujo de trabajo `New company background check` maneja la investigación automática después de agregar o actualizar una empresa. Escucha los eventos de datos de la tabla de la empresa y se activa cuando el nombre de la empresa existe y la información de fondo está vacía. La IA no será llamada inmediatamente después de la activación, sino que primero comprobará si hay tareas pendientes para la misma empresa; de lo contrario, se creará un nuevo registro de verificación de antecedentes.

![](https://static-docs.nocobase.com/202607121807374.png)

El flujo de trabajo `Timing company background check` es responsable de la finalización continua de datos históricos. Se ejecuta cada 30 minutos, consulta empresas cuya información general aún está vacía y recorre lotes. Dentro del ciclo, también verificamos si la tarea ya existe y luego decidimos si crear una nueva tarea. De esta manera, la tarea programada se puede ejecutar repetidamente sin crear múltiples registros procesados ​​simultáneamente debido al escaneo repetido.

![](https://static-docs.nocobase.com/202607121807404.png)

El flujo de trabajo `Manual company background check` está vinculado al botón "Ejecutar verificación de antecedentes" en la página de detalles de la empresa, que es adecuado para que el personal comercial inicie proactivamente una encuesta antes de visitar, firmar un contrato o revisar. La activación manual y la activación automática utilizan el mismo conjunto de enlaces de seguimiento: primero se crea un registro de verificación de antecedentes y luego el flujo de trabajo de ejecución de tareas se hace cargo de la investigación de IA.

![](https://static-docs.nocobase.com/202607121807793.png)

Estas tres entradas resuelven problemas en diferentes momentos y, en última instancia, se fusionan en el mismo formulario de registro de investigación de antecedentes. Los nuevos activadores, los activadores programados y los activadores manuales solo son responsables de registrar la "necesidad de investigar", y la ejecución específica, la gestión del estado y la reescritura de resultados se entregan a flujos de trabajo posteriores para un procesamiento unificado.

## Convierta la investigación de IA en tareas

`Do company background check` es el flujo de trabajo que realmente realiza la investigación. Escucha el registro `pending` en la tabla de registros de verificación de antecedentes. Una vez que el proceso automático, programado o manual anterior crea una tarea, este flujo de trabajo se activará de forma asincrónica.

Cuando se ejecuta, el flujo de trabajo primero pregunta si la empresa todavía existe. Si la empresa no existe, se cerrará la tarea y se escribirá la descripción; si la empresa existe, el estado de la tarea cambiará a `processing` y luego se llamará al empleado de IA para generar el informe. La rápida palabra del empleado de IA requiere la salida de dos partes: un informe de Markdown que se puede escribir directamente en el campo de antecedentes de la empresa y un resumen para revisión manual.

![](https://static-docs.nocobase.com/202607121808833.png)

Después de que la IA devuelve resultados estructurados, el flujo de trabajo primero escribe el informe, el resumen y el contenido de antecedentes antiguo en el registro de verificación de antecedentes y luego escribe el nuevo informe en el registro de la empresa. Este orden evita el problema de "solo los últimos resultados, sin registros de proceso": la página de la empresa mantiene el contenido disponible más reciente y los registros de tareas conservan el contexto antes de esta generación y reescritura.

![](https://static-docs.nocobase.com/202607121808662.png)

Después de la asignación de tareas, el procesamiento por lotes también será más natural. El flujo de trabajo programado no necesita esperar a que se complete la investigación de cada empresa, sino que solo es responsable de crear múltiples registros para procesar; cada registro activa de forma independiente la encuesta de IA. Varias empresas pueden avanzar en paralelo y, si una determinada tarea falla o se agota, otras empresas no quedarán bloqueadas.

## Hacer que los resultados de la IA sean revisables

Los informes generados por IA se organizan según una estructura fija: perfil de la empresa, negocio principal, historial de desarrollo y antecedentes de capital, posición en el mercado y perspectiva competitiva, juicio de seguimiento de ventas y enlaces de citas. El personal empresarial puede ver no sólo la "conclusión", sino también los consejos de riesgo y la información adicional proporcionada por AI en el resumen.

La página de detalles del registro de investigación de antecedentes muestra "Informe de investigación" y "Antecedentes anteriores" en pestañas y proporciona una operación de "Copiar". De esta manera, puede copiar rápidamente este informe durante la discusión, revisión o comunicación externa, y también puede comparar los cambios con la versión anterior.

Los detalles del registro también configuran dos tareas de trabajadores de IA. en:

- Mejore el informe de investigación de antecedentes: regenere el informe después de agregar información a través del diálogo y escriba los resultados en los registros de la empresa.
- Compare los informes de investigación de antecedentes antiguos y nuevos: lea los informes antiguos y nuevos y deje que AI explique las diferencias sustanciales provocadas por esta actualización.

Esto permite que la IA no se limite a “generar texto una vez”, sino que participe en el proceso de mantenimiento, revisión y comparación de versiones continuos.

![](https://static-docs.nocobase.com/202607121808444.png)

## Cómo combinar el flujo de trabajo

En general, este conjunto de flujos de trabajo se puede dividir en cuatro capas.

La primera capa es responsable de crear tareas. `New company background check` es para empresas recién agregadas o actualizadas, `Timing company background check` es para completar datos históricos y `Manual company background check` es para iniciativa manual. Todos comprobarán si hay registros sin terminar antes de crear una tarea, lo que reducirá el procesamiento duplicado desde la fuente.

La segunda capa es responsable de realizar las tareas. `Do company background check` escucha el registro de verificación de antecedentes, avanza la tarea pendiente para su procesamiento, llama al empleado de IA y escribe el informe, el resumen y los campos de antecedentes actuales de la empresa al finalizar.

La tercera capa es responsable de proporcionar capacidades de reescritura controlada a los empleados de IA. Como flujo de trabajo basado en herramientas, `Update company background` restringe la IA para que solo escriba registros específicos de acuerdo con parámetros claros para evitar ejercer demasiado los permisos de modificación de datos.

La cuarta capa es responsable de la limpieza excepcional. `Clean overtime processing background check` se ejecuta cada 30 minutos para limpiar las tareas no completadas que no se han completado durante más de 15 minutos para evitar el procesamiento a largo plazo de las tareas después de una interrupción anormal.

![](https://static-docs.nocobase.com/202607121808799.png)

## ¿A qué escenarios se puede migrar?

Lo que muestra esta escena no es una forma aislada o un botón de IA separado, sino una combinación de varias capacidades en NocoBase: la tabla de datos es responsable de transportar objetos comerciales y registros históricos, la página es responsable de ver y activar por parte del personal comercial, el flujo de trabajo es responsable de programar y escribir, y el personal de IA es responsable de generar resultados estructurados revisables.

Se pueden migrar modelos similares a escenarios como la admisión de proveedores, la debida diligencia del cliente, la revisión preliminar del riesgo del contrato, la puntuación de la calidad de los clientes potenciales, el seguimiento de la opinión pública y la evaluación preliminar de los objetivos de inversión y financiación. Siempre que existan varios requisitos en el negocio, como "los datos deben completarse continuamente", "los resultados de la IA deben dejarse atrás" y "las versiones históricas no se pueden sobrescribir", se puede construir un proceso automatizado ejecutable, rastreable y escalable de manera similar.

## Documentación de referencia

- [Flujo de trabajo NocoBase](/workflow/)
- [Empleado de IA de NocoBase](/ai-employees/)
- [Nodo de empleado de IA de flujo de trabajo de NocoBase ](/ai-employees/workflow/nodes/employee/configuration)
- [Herramienta de personalización de empleados de NocoBase AI ](/ai-employees/features/tools)
