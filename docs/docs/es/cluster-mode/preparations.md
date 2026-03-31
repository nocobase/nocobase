:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Prerrequisitos

Antes de implementar una aplicación en clúster, debe completar los siguientes preparativos.

## Licencia de plugins comerciales

Para ejecutar una aplicación NocoBase en modo clúster, se requiere el soporte de los siguientes **plugins**:

| Función                     | Plugin                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Adaptador de caché          | Integrado                                                                           |
| Adaptador de señal de sincronización | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Adaptador de cola de mensajes | `@nocobase/plugin-queue-adapter-redis` o `@nocobase/plugin-queue-adapter-rabbitmq` |
| Adaptador de bloqueo distribuido | `@nocobase/plugin-lock-adapter-redis`                                               |
| Asignador de ID de Worker   | `@nocobase/plugin-workerid-allocator-redis`                                         |

Primero, asegúrese de haber obtenido las licencias para los **plugins** mencionados (puede adquirir las licencias correspondientes a través de la plataforma de servicios de **plugins** comerciales).

## Componentes del sistema

Aparte de la propia instancia de la aplicación, el personal de operaciones puede seleccionar otros componentes del sistema según las necesidades operativas de cada equipo.

### Base de datos

Dado que el modo clúster actual se enfoca únicamente en las instancias de la aplicación, la base de datos solo soporta temporalmente un único nodo. Si usted cuenta con una arquitectura de base de datos como maestro-esclavo, deberá implementarla por su cuenta a través de middleware y asegurarse de que sea transparente para la aplicación NocoBase.

### Middleware

El modo clúster de NocoBase depende de algunos componentes de middleware para lograr la comunicación y coordinación entre clústeres, incluyendo:

-   **Caché**: Utiliza un middleware de caché distribuida basado en Redis para mejorar la velocidad de acceso a los datos.
-   **Señal de sincronización**: Utiliza la funcionalidad de *stream* de Redis para implementar la transmisión de señales de sincronización entre clústeres.
-   **Cola de mensajes**: Utiliza un middleware de cola de mensajes basado en Redis o RabbitMQ para procesar mensajes de forma asíncrona.
-   **Bloqueo distribuido**: Utiliza un bloqueo distribuido basado en Redis para garantizar la seguridad del acceso a los recursos compartidos en el clúster.

Cuando todos los componentes de middleware utilizan Redis, puede iniciar un único servicio de Redis dentro de la red interna del clúster (o Kubernetes). Alternativamente, puede habilitar un servicio de Redis separado para cada función (caché, señal de sincronización, cola de mensajes y bloqueo distribuido).

**Versiones recomendadas**

-   Redis: >=8.0 o una versión de redis-stack que incluya la funcionalidad Bloom Filter.
-   RabbitMQ: >=4.0

### Almacenamiento compartido

NocoBase necesita utilizar el directorio `storage` para almacenar archivos relacionados con el sistema. En el modo de múltiples nodos, debe montar un disco en la nube (o NFS) para permitir el acceso compartido entre varios nodos. De lo contrario, el almacenamiento local no se sincronizará automáticamente y no funcionará correctamente.

Al implementar con Kubernetes, consulte la sección [Implementación en Kubernetes: Almacenamiento compartido](./kubernetes#shared-storage).

### Balanceo de carga

El modo clúster requiere un balanceador de carga para distribuir las solicitudes, así como para realizar comprobaciones de estado y conmutación por error de las instancias de la aplicación. Esta parte debe seleccionarse y configurarse según las necesidades operativas de su equipo.

Tomando como ejemplo un Nginx autoalojado, añada el siguiente contenido al archivo de configuración:

```
upstream myapp {
    # ip_hash; # Se puede usar para la persistencia de sesiones. Cuando está habilitado, las solicitudes del mismo cliente siempre se envían al mismo servidor backend.
    server 172.31.0.1:13000; # Nodo interno 1
    server 172.31.0.2:13000; # Nodo interno 2
    server 172.31.0.3:13000; # Nodo interno 3
}

server {
    listen 80;

    location / {
        # Utiliza el upstream definido para el balanceo de carga
        proxy_pass http://myapp;
        # ... otras configuraciones
    }
}
```

Esto significa que las solicitudes se reenvían mediante proxy inverso y se distribuyen a diferentes nodos de servidor para su procesamiento.

Para el middleware de balanceo de carga proporcionado por otros proveedores de servicios en la nube, consulte la documentación de configuración específica del proveedor.

## Configuración de variables de entorno

Todos los nodos del clúster deben utilizar la misma configuración de variables de entorno. Además de las [variables de entorno](/api/cli/env) básicas de NocoBase, también es necesario configurar las siguientes variables de entorno relacionadas con el middleware.

### Modo multinúcleo

Cuando la aplicación se ejecuta en un nodo multinúcleo, puede habilitar el modo multinúcleo del nodo:

```ini
# Habilitar el modo multinúcleo de PM2
# CLUSTER_MODE=max # Deshabilitado por defecto, requiere configuración manual
```

Si está implementando pods de aplicación en Kubernetes, puede ignorar esta configuración y controlar el número de instancias de aplicación a través del número de réplicas del pod.

### Caché

```ini
# Adaptador de caché, en modo clúster debe configurarse como redis (por defecto es en memoria si no se especifica)
CACHE_DEFAULT_STORE=redis

# URL de conexión del adaptador de caché de Redis, debe rellenarse
CACHE_REDIS_URL=
```

### Señal de sincronización

```ini
# URL de conexión del adaptador de sincronización de Redis, por defecto es redis://localhost:6379/0 si no se especifica
PUBSUB_ADAPTER_REDIS_URL=
```

### Bloqueo distribuido

```ini
# Adaptador de bloqueo, en modo clúster debe configurarse como redis (por defecto es bloqueo local en memoria si no se especifica)
LOCK_ADAPTER_DEFAULT=redis

# URL de conexión del adaptador de bloqueo de Redis, por defecto es redis://localhost:6379/0 si no se especifica
LOCK_ADAPTER_REDIS_URL=
```

### Cola de mensajes

```ini
# Habilitar Redis como adaptador de cola de mensajes, por defecto es el adaptador en memoria si no se especifica
QUEUE_ADAPTER=redis
# URL de conexión del adaptador de cola de mensajes de Redis, por defecto es redis://localhost:6379/0 si no se especifica
QUEUE_ADAPTER_REDIS_URL=
```

### Asignador de ID de Worker

Algunas **colecciones** del sistema en NocoBase utilizan IDs globalmente únicos como claves primarias. Para evitar conflictos de claves primarias en un clúster, cada instancia de aplicación debe obtener un ID de Worker único a través del Asignador de ID de Worker. El rango actual de ID de Worker es de 0 a 31, lo que significa que cada aplicación puede ejecutar hasta 32 nodos simultáneamente. Para obtener más detalles sobre el diseño del ID único global, consulte [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# URL de conexión de Redis para el Asignador de ID de Worker.
# Si se omite, se asignará un ID de Worker aleatorio.
REDIS_URL=
```

:::info{title=Consejo}
Normalmente, todos los adaptadores relacionados pueden usar la misma instancia de Redis, pero es recomendable utilizar diferentes bases de datos para evitar posibles problemas de conflicto de claves, por ejemplo:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Actualmente, cada **plugin** utiliza sus propias variables de entorno de Redis. En el futuro, se podría considerar unificar el uso de `REDIS_URL` como configuración de respaldo.

:::

Si utiliza Kubernetes para gestionar el clúster, puede configurar las variables de entorno mencionadas en un ConfigMap o Secret. Para más información, consulte [Implementación en Kubernetes](./kubernetes).

Una vez completados todos los preparativos anteriores, puede pasar a los [procesos de operación](./operations) para continuar gestionando las instancias de la aplicación.