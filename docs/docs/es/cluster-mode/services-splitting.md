:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Servicios distribuidos <Badge>v1.9.0+</Badge>

## Introducción

Normalmente, todos los servicios de una aplicación NocoBase se ejecutan en la misma instancia de Node.js. A medida que la funcionalidad de la aplicación se vuelve más compleja con el crecimiento del negocio, algunos servicios que consumen mucho tiempo pueden afectar el rendimiento general.

Para mejorar el rendimiento de la aplicación, NocoBase permite dividir los servicios de la aplicación para que se ejecuten en diferentes nodos en modo clúster. Esto evita que los problemas de rendimiento de un solo servicio afecten a toda la aplicación, impidiendo que responda correctamente a las solicitudes de los usuarios.

Por otro lado, también permite escalar horizontalmente servicios específicos de forma selectiva, mejorando la utilización de recursos del clúster.

Cuando se despliega NocoBase en un clúster, los diferentes servicios se pueden dividir y desplegar para que se ejecuten en distintos nodos. El siguiente diagrama ilustra la estructura de división:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Qué servicios se pueden dividir

### Flujo de trabajo asíncrono

**CLAVE del servicio**: `workflow:process`

Los flujos de trabajo en modo asíncrono, una vez activados, se pondrán en cola para su ejecución. Estos flujos de trabajo pueden considerarse tareas en segundo plano, y los usuarios normalmente no necesitan esperar a que se devuelvan los resultados. Especialmente para procesos complejos y que consumen mucho tiempo, con un alto volumen de activaciones, se recomienda dividirlos para que se ejecuten en nodos independientes.

### Otras tareas asíncronas a nivel de usuario

**CLAVE del servicio**: `async-task:process`

Esto incluye tareas creadas por acciones de usuario como la importación y exportación asíncronas. En casos de grandes volúmenes de datos o alta concurrencia, se recomienda dividirlas para que se ejecuten en nodos independientes.

## Cómo dividir servicios

La división de diferentes servicios en distintos nodos se logra configurando la variable de entorno `WORKER_MODE`. Esta variable de entorno se puede configurar siguiendo las siguientes reglas:

- `WORKER_MODE=<vacío>`: Cuando no está configurada o se establece como vacía, el modo de trabajo es el mismo que el modo de instancia única actual, aceptando todas las solicitudes y procesando todas las tareas. Esto es compatible con aplicaciones que no estaban configuradas previamente.
- `WORKER_MODE=!` : El modo de trabajo es procesar solo solicitudes y ninguna tarea.
- `WORKER_MODE=workflow:process,async-task:process`: Configurado con uno o más identificadores de servicio (separados por comas), el modo de trabajo es procesar solo las tareas para estos identificadores y no procesar solicitudes.
- `WORKER_MODE=*`: El modo de trabajo es procesar todas las tareas en segundo plano, independientemente del módulo, pero no procesar solicitudes.
- `WORKER_MODE=!,workflow:process`: El modo de trabajo es procesar solicitudes y, simultáneamente, procesar tareas para un identificador específico.
- `WORKER_MODE=-`: El modo de trabajo es no procesar ninguna solicitud ni tarea (este modo es necesario dentro del proceso del *worker*).

Por ejemplo, en un entorno K8S, los nodos con la misma funcionalidad de división pueden usar la misma configuración de variable de entorno, lo que facilita el escalado horizontal de un tipo específico de servicio.

## Ejemplos de configuración

### Múltiples nodos con procesamiento separado

Supongamos que hay tres nodos: `node1`, `node2` y `node3`. Se pueden configurar de la siguiente manera:

- `node1`: Solo procesa solicitudes de interfaz de usuario, configure `WORKER_MODE=!`.
- `node2`: Solo procesa tareas de flujo de trabajo, configure `WORKER_MODE=workflow:process`.
- `node3`: Solo procesa tareas asíncronas, configure `WORKER_MODE=async-task:process`.

### Múltiples nodos con procesamiento mixto

Supongamos que hay cuatro nodos: `node1`, `node2`, `node3` y `node4`. Se pueden configurar de la siguiente manera:

- `node1` y `node2`: Procesan todas las solicitudes regulares, configure `WORKER_MODE=!`, y un balanceador de carga distribuirá automáticamente las solicitudes a estos dos nodos.
- `node3` y `node4`: Procesan todas las demás tareas en segundo plano, configure `WORKER_MODE=*`.

## Referencia para desarrolladores

Al desarrollar *plugins* de negocio, puede dividir los servicios que consumen recursos significativos según los requisitos del escenario. Esto se puede lograr de las siguientes maneras:

1.  Defina un nuevo identificador de servicio, por ejemplo, `my-plugin:process`, para la configuración de la variable de entorno y proporcione la documentación correspondiente.
2.  En la lógica de negocio del lado del servidor del *plugin*, utilice la interfaz `app.serving()` para verificar el entorno y determinar si el nodo actual debe proporcionar un servicio específico basándose en la variable de entorno.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// En el código del lado del servidor del plugin
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Procesar la lógica de negocio para este servicio
} else {
  // No procesar la lógica de negocio para este servicio
}
```