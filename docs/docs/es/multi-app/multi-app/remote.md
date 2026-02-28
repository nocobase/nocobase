---
pkg: '@nocobase/plugin-app-supervisor'
---

# Modo multi-entorno

## Introducción

El modo multiaplicación en memoria compartida ofrece ventajas claras en despliegue y operación, pero cuando crece la cantidad de aplicaciones y la complejidad de negocio, una sola instancia puede quedar limitada. Para esos escenarios se recomienda el despliegue híbrido multi-entorno.

En este modo, el sistema despliega una **aplicación de entrada** como centro unificado de gestión y planificación, y varias instancias NocoBase como entornos de ejecución independientes que alojan las aplicaciones de negocio.

A nivel de infraestructura, los entornos pueden ejecutarse como procesos separados, contenedores Docker o múltiples Deployments de Kubernetes.

## Despliegue

En el despliegue híbrido multi-entorno:

- La **aplicación de entrada (Supervisor)** gestiona apps y entornos de forma unificada
- Las **aplicaciones Worker** ejecutan la carga de negocio real
- La configuración de aplicaciones y entornos se cachea en Redis
- La comunicación de comandos y estado entre Supervisor y Workers usa Redis

La creación de entornos aún no está disponible. Cada Worker debe desplegarse y configurarse manualmente.

### Dependencias de arquitectura

Antes de desplegar, prepara:

- **Redis**
  - Cache de configuración de aplicaciones y entornos
  - Canal de comunicación de comandos entre Supervisor y Workers

- **Base de datos**
  - Servicios de base de datos para Supervisor y Workers

### Aplicación de entrada (Supervisor)

El Supervisor es el centro de control para creación de apps, arranque/parada, planificación de entornos y proxy de acceso.

Variables de entorno del Supervisor:

```bash
# Application mode
APP_MODE=supervisor
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=remote
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
```

### Aplicación Worker

Los Workers alojan y ejecutan instancias NocoBase concretas.

Variables de entorno del Worker:

```bash
# Application mode
APP_MODE=worker
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=local
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
# Environment identifier
ENVIRONMENT_NAME=
# Environment access URL
ENVIRONMENT_URL=
# Environment proxy access URL
ENVIRONMENT_PROXY_URL=
```

### Ejemplo Docker Compose

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Guía de uso

Las operaciones básicas son iguales que en [modo de memoria compartida](./local.md). Aquí se describen los puntos específicos del multi-entorno.

### Lista de entornos

Tras desplegar, entra en **App supervisor** y en la pestaña **Environment** verás los entornos Worker registrados: identificador, versión, URL y estado. Los Workers reportan heartbeat cada 2 minutos.

![](https://static-docs.nocobase.com/202512291830371.png)

### Crear aplicación

Al crear una aplicación puedes elegir uno o más entornos de ejecución. Normalmente basta con uno. Solo usa varios cuando exista [services splitting](/cluster-mode/services-splitting).

![](https://static-docs.nocobase.com/202512291835086.png)

### Lista de aplicaciones

La lista muestra entorno de ejecución y estado actual por aplicación. Si está desplegada en varios entornos, verás múltiples estados.

![](https://static-docs.nocobase.com/202512291842216.png)

### Arranque de aplicaciones

Como el arranque puede escribir datos iniciales en DB, para evitar condiciones de carrera en varios entornos el inicio se encola.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy de acceso

Las apps Worker se pueden acceder mediante la subruta `/apps/:appName/admin` de la app de entrada.

![](https://static-docs.nocobase.com/202601082154230.png)

Si una app está en varios entornos, hay que elegir el entorno objetivo del proxy.

![](https://static-docs.nocobase.com/202601082155146.png)

Por defecto se usa `ENVIRONMENT_URL`, que debe ser accesible desde la red de la app de entrada. Para otra dirección de proxy, define `ENVIRONMENT_PROXY_URL`.
