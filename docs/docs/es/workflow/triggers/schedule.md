:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Tarea Programada

## Introducción

Una tarea programada es un evento que se activa según una condición de tiempo. Existen dos modos principales:

- **Tiempo personalizado**: Se activa de forma regular, similar a `cron`, basándose en la hora del sistema.
- **Campo de tiempo de la colección**: Se activa cuando se alcanza el valor de un campo de tiempo específico en una colección.

Cuando el sistema llega al momento (con una precisión de segundos) que cumple las condiciones de activación configuradas, se ejecutará el flujo de trabajo correspondiente.

## Uso Básico

### Crear una tarea programada

Para crear un flujo de trabajo, en la lista de flujos de trabajo, seleccione el tipo "Tarea Programada":

![Crear una tarea programada](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Modo de tiempo personalizado

Para este modo habitual, primero debe configurar la hora de inicio en cualquier momento (con una precisión de segundos). La hora de inicio puede ser una fecha futura o pasada. Si se configura una hora pasada, el sistema verificará si la tarea debe activarse según la condición de repetición configurada. Si no hay una condición de repetición y la hora de inicio es pasada, el flujo de trabajo ya no se activará.

Existen dos formas de configurar la regla de repetición:

- **Por intervalo**: Se activa a intervalos fijos después de la hora de inicio, por ejemplo, cada hora, cada 30 minutos, etc.
- **Modo avanzado**: Utiliza reglas `cron`, lo que le permite configurar un ciclo para que se active en fechas y horas fijas según una regla.

Después de configurar la regla de repetición, también puede establecer una condición de finalización. Puede finalizar en un momento específico o limitarse por el número de veces que se ha ejecutado.

### Modo de campo de tiempo de la colección

Utilizar un campo de tiempo de una colección para determinar la hora de inicio es un modo de activación que combina las tareas programadas habituales con los campos de tiempo de las colecciones. Este modo puede simplificar los nodos en ciertos flujos de trabajo específicos y es más intuitivo en su configuración. Por ejemplo, si necesita cambiar el estado de los pedidos impagados y vencidos a "cancelado", puede configurar una tarea programada en el modo de campo de tiempo de la colección, seleccionando como hora de inicio "30 minutos después de la creación del pedido".

## Consejos Relacionados

### Tareas programadas en estado inactivo o de apagado

Si se cumple la condición de tiempo configurada, pero el servicio de la aplicación NocoBase está inactivo o apagado, la tarea programada que debería haberse activado en ese momento se perderá. Además, una vez que el servicio se reinicie, las tareas que se perdieron no se volverán a activar. Por lo tanto, al usar esta función, es posible que deba considerar cómo manejar estas situaciones o implementar medidas de contingencia.

### Conteo de repeticiones

Cuando se configura la condición de finalización "por conteo de repeticiones", se calcula el número total de ejecuciones de todas las versiones del mismo flujo de trabajo. Por ejemplo, si una tarea programada se ha ejecutado 10 veces en la versión 1, y el conteo de repeticiones también se establece en 10, el flujo de trabajo ya no se activará. Incluso si se copia a una nueva versión, no se activará a menos que el conteo de repeticiones se cambie a un número mayor que 10. Sin embargo, si se copia como un nuevo flujo de trabajo, el conteo de ejecuciones se restablecerá a 0. Sin modificar la configuración relevante, el nuevo flujo de trabajo podrá activarse otras 10 veces.

### Diferencia entre el modo de intervalo y el modo avanzado en las reglas de repetición

El intervalo en la regla de repetición es relativo al momento de la última activación (o la hora de inicio), mientras que el modo avanzado se activa en puntos de tiempo fijos. Por ejemplo, si se configura para activarse cada 30 minutos, y la última activación fue el 2021-09-01 12:01:23, entonces la próxima activación será el 2021-09-01 12:31:23. Por otro lado, el modo avanzado (es decir, el modo `cron`) se configura para activarse en puntos de tiempo fijos; por ejemplo, puede configurarse para activarse a los 01 y 31 minutos de cada hora.

## Ejemplo

Supongamos que necesitamos verificar cada minuto los pedidos que no se han pagado después de 30 minutos de su creación y cambiar automáticamente su estado a "cancelado". Implementaremos esto utilizando ambos modos.

### Modo de tiempo personalizado

Cree un flujo de trabajo basado en tareas programadas. En la configuración del disparador, seleccione el modo "Tiempo personalizado", establezca la hora de inicio en cualquier momento no posterior a la hora actual, elija "Cada minuto" para la regla de repetición y deje la condición de finalización en blanco:

![Tarea Programada_Configuración del Disparador_Modo de Tiempo Personalizado](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Luego, configure otros nodos según la lógica del proceso para calcular la hora de hace 30 minutos y cambiar el estado de los pedidos impagados creados antes de esa hora a "cancelado":

![Tarea Programada_Configuración del Disparador_Modo de Tiempo Personalizado](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Una vez que el flujo de trabajo esté habilitado, se activará una vez por minuto a partir de la hora de inicio, calculando la hora de hace 30 minutos para actualizar el estado de los pedidos creados antes de ese momento a "cancelado".

### Modo de campo de tiempo de la colección

Cree un flujo de trabajo basado en tareas programadas. En la configuración del disparador, seleccione el modo "Campo de tiempo de la colección", elija la colección "Pedidos", establezca la hora de inicio en "30 minutos después de la creación del pedido" y seleccione "No repetir" para la regla de repetición:

![Tarea Programada_Configuración del Disparador_Modo de Campo de Tiempo de la Colección_Disparador](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Luego, configure otros nodos según la lógica del proceso para actualizar el estado del pedido con el ID de datos del disparador y un estado "no pagado" a "cancelado":

![Tarea Programada_Configuración del Disparador_Modo de Campo de Tiempo de la Colección_Nodo de Actualización](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

A diferencia del modo de tiempo personalizado, aquí no es necesario calcular la hora de hace 30 minutos, ya que el contexto de los datos del disparador del flujo de trabajo ya contiene la fila de datos que cumple la condición de tiempo. Por lo tanto, puede actualizar directamente el estado del pedido correspondiente.