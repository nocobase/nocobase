---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/workflow/triggers/custom-action).
:::

# Evento de acción personalizada

## Introducción

NocoBase tiene integradas acciones de datos comunes (añadir, eliminar, editar, ver, etc.). Cuando estas acciones no pueden satisfacer necesidades de negocio complejas, puede utilizar el evento de acción personalizada en un flujo de trabajo y vincular dicho evento al botón "Activar flujo de trabajo" de un bloque de página. Cuando el usuario haga clic en él, se activará un flujo de trabajo de acción personalizada.

## Crear un flujo de trabajo

Al crear un flujo de trabajo, seleccione "Evento de acción personalizada":

![Crear flujo de trabajo de "Evento de acción personalizada"](https://static-docs.nocobase.com/20240509091820.png)

## Configuración del activador

### Tipo de contexto

> v.1.6.0+

La diferencia en el tipo de contexto determinará en qué botones de bloque se puede vincular el flujo de trabajo:

* Sin contexto: es decir, un evento global, se puede vincular a los botones de acción del panel de acciones y de los bloques de datos;
* Registro único: se puede vincular a los botones de acción de bloques de datos como filas de tabla, formularios, detalles, etc.;
* Múltiples registros: se puede vincular a los botones de operación por lotes de las tablas.

![Configuración del activador_Tipo de contexto](https://static-docs.nocobase.com/20250215135808.png)

### Colección

Cuando el tipo de contexto es registro único o múltiples registros, debe seleccionar la colección a la que desea vincular el modelo de datos:

![Configuración del activador_Seleccionar colección](https://static-docs.nocobase.com/20250215135919.png)

### Datos de relación a utilizar

Si necesita utilizar los datos de relación de la fila de datos activadora en el flujo de trabajo, puede seleccionar aquí los campos de relación profundos:

![Configuración del activador_Seleccionar datos de relación a utilizar](https://static-docs.nocobase.com/20250215135955.png)

Estos campos se precargarán automáticamente en el contexto del flujo de trabajo después de que se active el evento, para que puedan ser utilizados en el flujo de trabajo.

## Configuración de la acción

Dependiendo del tipo de contexto configurado para el flujo de trabajo, la configuración de los botones de acción en los diferentes bloques también varía.

### Sin contexto

> v1.6.0+

Tanto en el panel de acciones como en otros bloques de datos, se puede añadir el botón "Activar flujo de trabajo":

![Añadir botón de acción al bloque_Panel de acciones](https://static-docs.nocobase.com/20250215221738.png)

![Añadir botón de acción al bloque_Calendario](https://static-docs.nocobase.com/20250215221942.png)

![Añadir botón de acción al bloque_Diagrama de Gantt](https://static-docs.nocobase.com/20250215221810.png)

Después de añadir el botón, vincúlelo al flujo de trabajo sin contexto creado anteriormente; tomando como ejemplo el botón en el panel de acciones:

![Vincular flujo de trabajo al botón_Panel de acciones](https://static-docs.nocobase.com/20250215222120.png)

![Seleccionar flujo de trabajo a vincular_Sin contexto](https://static-docs.nocobase.com/20250215222234.png)

### Registro único

En cualquier bloque de datos, se puede añadir el botón "Activar flujo de trabajo" en la barra de acciones para un registro único, como en formularios, filas de tabla, detalles, etc.:

![Añadir botón de acción al bloque_Formulario](https://static-docs.nocobase.com/20240509165428.png)

![Añadir botón de acción al bloque_Fila de tabla](https://static-docs.nocobase.com/20240509165340.png)

![Añadir botón de acción al bloque_Detalles](https://static-docs.nocobase.com/20240509165545.png)

Después de añadir el botón, vincule el flujo de trabajo creado anteriormente:

![Vincular flujo de trabajo al botón](https://static-docs.nocobase.com/20240509165631.png)

![Seleccionar flujo de trabajo a vincular](https://static-docs.nocobase.com/20240509165658.png)

Posteriormente, al hacer clic en este botón se activará dicho evento de acción personalizada:

![Resultado de la activación al hacer clic en el botón](https://static-docs.nocobase.com/20240509170453.png)

### Múltiples registros

> v1.6.0+

En la barra de acciones de un bloque de tabla, al añadir el botón "Activar flujo de trabajo", habrá una opción adicional para elegir si el tipo de contexto es "Sin contexto" o "Múltiples registros":

![Añadir botón de acción al bloque_Tabla](https://static-docs.nocobase.com/20250215222507.png)

Cuando se selecciona "Sin contexto", se trata de un evento global y solo se pueden vincular flujos de trabajo de tipo sin contexto.

Cuando se selecciona "Múltiples registros", se pueden vincular flujos de trabajo de tipo múltiples registros, lo cual puede utilizarse para operaciones por lotes después de seleccionar varios datos (actualmente solo soportado por tablas). En este caso, el rango de flujos de trabajo opcionales se limita a aquellos configurados para coincidir con la colección del bloque de datos actual:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Al hacer clic en el botón para activar, es obligatorio haber marcado algunas filas de datos en la tabla; de lo contrario, el flujo de trabajo no se activará:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Ejemplo

Por ejemplo, tenemos una colección de "Muestras". Para las muestras con estado "Recolectado", necesitamos proporcionar una operación de "Enviar a inspección". El envío primero verificará la información básica de la muestra, luego generará un dato de "Registro de inspección" y finalmente cambiará el estado de la muestra a "Enviado a inspección". Esta serie de procesos no se puede completar mediante simples clics en botones de "añadir, eliminar, editar o ver"; en este caso, se puede utilizar un evento de acción personalizada para lograrlo.

Primero, cree una colección de "Muestras" y una colección de "Registros de inspección", e introduzca datos de prueba básicos en la tabla de muestras:

![Ejemplo_Colección de muestras](https://static-docs.nocobase.com/20240509172234.png)

Luego, cree un flujo de trabajo de "Evento de acción personalizada". Si necesita una retroalimentación oportuna del proceso de operación, puede elegir el modo síncrono (en el modo síncrono no se pueden utilizar nodos de tipo asíncrono como el procesamiento manual):

![Ejemplo_Crear flujo de trabajo](https://static-docs.nocobase.com/20240509173106.png)

En la configuración del activador, seleccione "Muestras" como colección:

![Ejemplo_Configuración del activador](https://static-docs.nocobase.com/20240509173148.png)

Organice la lógica dentro del flujo según las necesidades del negocio; por ejemplo, el envío a inspección solo se permite cuando el parámetro del indicador es mayor a `90`, de lo contrario se notificará el problema correspondiente:

![Ejemplo_Organización de la lógica de negocio](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Sugerencia}
El nodo "[Mensaje de respuesta](../nodes/response-message.md)" puede utilizarse en eventos de acción personalizada síncronos para devolver información de aviso al cliente. No se puede utilizar en modo asíncrono.
:::

Una vez configurado y habilitado el flujo, regrese a la interfaz de la tabla y añada el botón "Activar flujo de trabajo" en la columna de acciones de la tabla:

![Ejemplo_Añadir botón de acción](https://static-docs.nocobase.com/20240509174525.png)

Luego, en el menú de configuración del botón, elija vincular el flujo de trabajo para abrir la ventana emergente de configuración:

![Ejemplo_Abrir ventana emergente de vinculación de flujo de trabajo](https://static-docs.nocobase.com/20240509174633.png)

Añada el flujo de trabajo habilitado anteriormente:

![Ejemplo_Seleccionar flujo de trabajo](https://static-docs.nocobase.com/20240509174723.png)

Después de enviar, cambie el texto del botón al nombre de la operación, como "Enviar a inspección", y el proceso de configuración habrá terminado.

Al usarlo, seleccione cualquier dato de muestra en la tabla y haga clic en el botón "Enviar a inspección" para activar el evento de acción personalizada. Tal como se organizó en la lógica anterior, si el parámetro del indicador de la muestra es menor a 90, al hacer clic aparecerá el siguiente aviso:

![Ejemplo_El indicador no cumple los criterios de envío](https://static-docs.nocobase.com/20240509175026.png)

Si el parámetro del indicador es mayor a 90, el flujo se ejecutará normalmente, generando los datos del "Registro de inspección" y cambiando el estado de la muestra a "Enviado a inspección":

![Ejemplo_Envío exitoso](https://static-docs.nocobase.com/20240509175247.png)

Con esto, se completa un evento de acción personalizada sencillo. Del mismo modo, para negocios con operaciones complejas similares, como el procesamiento de pedidos o la presentación de informes, se pueden implementar a través de eventos de acción personalizada.

## Llamada externa

La activación de los eventos de acción personalizada no se limita a las operaciones de la interfaz de usuario, también se puede activar mediante llamadas a la API HTTP. En particular, el evento de acción personalizada proporciona un nuevo tipo de operación para todas las operaciones de colección para activar flujos de trabajo: `trigger`, que