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

Además de las propias instancias de la aplicación, una implementación en clúster también requiere componentes del sistema como la base de datos, el middleware, el almacenamiento compartido y el balanceo de carga. Cada equipo puede elegir la implementación concreta de estos componentes según su propio modelo operativo.

### Base de datos

Dado que el modo clúster actual se enfoca únicamente en las instancias de la aplicación, la base de datos solo soporta temporalmente un único nodo. Si usted cuenta con una arquitectura de base de datos como maestro-esclavo, deberá implementarla por su cuenta a través de middleware y asegurarse de que sea transparente para la aplicación NocoBase.

Si necesita standby en caliente o recuperación ante desastres entre zonas de disponibilidad o regiones, la estrategia de sincronización y conmutación de la base de datos debe ser diseñada e implementada por su equipo de operaciones.

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

NocoBase necesita utilizar el directorio `storage` para almacenar archivos relacionados con el sistema, y el almacenamiento compartido también es un componente obligatorio del despliegue en clúster. En el modo de múltiples nodos, puede elegir distintas implementaciones según su entorno de infraestructura, como discos en la nube, NFS o EFS, para permitir el acceso compartido entre varios nodos. De lo contrario, los archivos del sistema no se sincronizarán automáticamente y la aplicación no podrá funcionar correctamente.

Al implementar con Kubernetes, consulte la sección [Implementación en Kubernetes: Almacenamiento compartido](./kubernetes#shared-storage).

#### Qué suele almacenarse en el directorio `storage`

El contenido del directorio `storage` varía según los plugins habilitados y el método de despliegue. Según la implementación actual, el contenido habitual incluye:

| Ruta | Propósito | Recomendación de uso |
| --- | --- | --- |
| `storage/uploads` | Archivos subidos cuando se usa el modo de almacenamiento local | En clústeres de producción, se recomienda priorizar almacenamiento de objetos como S3 / OSS / COS |
| `storage/plugins` | Paquetes de plugins locales instalados, subidos o detectados en tiempo de ejecución | Si depende de plugins locales, este directorio debe compartirse; si los plugins ya están integrados en la imagen, esta dependencia puede reducirse |
| `storage/apps/<app>/jwt_secret.dat` | Secreto de token predeterminado generado automáticamente cuando `APP_KEY` no está configurado explícitamente | No dependa de este archivo en producción; configure `APP_KEY` explícitamente |
| `storage/apps/<app>/aes_key.dat` | Clave AES predeterminada generada automáticamente cuando `APP_AES_SECRET_KEY` no está configurado explícitamente | No dependa de este archivo en producción; configure `APP_AES_SECRET_KEY` explícitamente |
| `storage/environment-variables/<app>/aes_key.dat` | Archivo de clave AES para escenarios del plugin de variables de entorno | Se recomienda montar un archivo de clave en modo solo lectura |
| `storage/logs` | Directorio de logs predeterminado y algunos registros de migración | Se recomienda integrar una plataforma de logs externa en el futuro |
| `storage/tmp` | Archivos temporales para importación, exportación, migración, etc. | Puede ser temporal, pero si necesita reutilizarse entre nodos, debe compartirse, o bien la operación debe fijarse en un único nodo de administración |
| `storage/backups`, `storage/duplicator`, `storage/migration-manager` | Artefactos relacionados con copia de seguridad, restauración y migración | Deben tratarse como directorios de operaciones, almacenarse de forma persistente y no modificarse de forma concurrente entre varios nodos |

La tabla anterior no es exhaustiva, pero ilustra un punto importante: `storage` mezcla archivos de negocio, archivos de claves, directorios de plugins, logs y artefactos temporales relacionados con operaciones. Por ello, en los despliegues en clúster, la base habitual es persistir y compartir todo el directorio `/app/nocobase/storage`.

#### Recomendaciones relacionadas con el almacenamiento

La consistencia del clúster en NocoBase depende principalmente de la base de datos, Redis, las colas de mensajes y los bloqueos distribuidos, y no de usar el sistema de archivos compartido como medio de coordinación de alta concurrencia.

Por ello, se recomienda:

- Para archivos de negocio de alta frecuencia, como los adjuntos, utilizar preferentemente almacenamiento de objetos. No se recomienda depender a largo plazo del almacenamiento local en clústeres de producción.
- El almacenamiento compartido debe utilizarse principalmente para alojar el directorio `storage`, y no como un servicio de almacenamiento de archivos de alto rendimiento.
- Operaciones como la instalación o actualización de plugins, las copias de seguridad, las restauraciones y las migraciones deben realizarse solo después de reducir el clúster a un único nodo; una vez finalizadas, el clúster puede volver a ampliarse.

### Balanceo de carga

El modo clúster requiere un balanceador de carga para distribuir las solicitudes, así como para realizar comprobaciones de estado y conmutación por error de las instancias de la aplicación. Esta parte debe seleccionarse y configurarse según las necesidades operativas de su equipo.

Tomando como ejemplo un Nginx autoalojado, añada el siguiente contenido al archivo de configuración:

```
upstream myapp {
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

Para despliegues de alta disponibilidad, se recomienda:

- Ejecutar al menos 2 instancias de la aplicación dentro del mismo clúster y dejar que el balanceador de carga se encargue del failover de las instancias.
- La verificación de estado del balanceador de carga debe reflejar la disponibilidad real de la aplicación, y no limitarse a comprobar si el puerto está abierto.
- Si necesita standby en caliente entre zonas de disponibilidad o regiones, normalmente deberá desplegar varios clústeres independientes, y el equipo de operaciones será responsable de sincronizar y conmutar la base de datos, el almacenamiento compartido y el resto de la infraestructura.

## Configuración de variables de entorno

Todos los nodos del clúster deben utilizar la misma configuración de variables de entorno. Además de las [variables de entorno](/api/cli/env) básicas de NocoBase, también es necesario configurar las siguientes variables de entorno relacionadas con el middleware.

### Secretos clave

Además de las variables de entorno del middleware, todos los nodos del clúster también deben configurar explícitamente los mismos secretos clave:

```ini
APP_KEY=
APP_AES_SECRET_KEY=
# O use un archivo de clave montado en modo solo lectura
# APP_AES_SECRET_KEY_PATH=
```

- `APP_KEY` se utiliza para la firma de tokens / JWT. Si no se configura explícitamente, la aplicación recurre al archivo de secreto predeterminado en `storage`.
- `APP_AES_SECRET_KEY` se utiliza para descifrar campos sensibles en la base de datos. Si no se configura explícitamente, la aplicación también recurre al archivo de secreto predeterminado en `storage`.
- En contenedores efímeros o despliegues multinodo, depender de archivos de secretos locales generados automáticamente puede hacer que los tokens dejen de ser válidos tras un reinicio o que los datos cifrados históricos ya no puedan descifrarse.

:::info{title=Consejo}
`APP_AES_SECRET_KEY` debe ser una clave AES-256 de 32 bytes, representada por 64 caracteres hexadecimales.

En entornos en la nube, se recomienda gestionar estos valores de forma centralizada a través de servicios como Secrets Manager, SSM Parameter Store, Kubernetes Secret o un archivo de clave montado en modo solo lectura.
:::

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
