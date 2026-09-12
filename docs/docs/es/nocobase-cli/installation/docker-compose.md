# Instalar a través de Docker Compose

Si desea ejecutar NocoBase directamente en el servidor, `docker compose` sigue siendo la forma más directa. Una porción de `docker-compose.yml` es suficiente para la mayoría de los escenarios.

Sin embargo, en un entorno de producción, se recomienda corregir el número de versión específico y no utilizar `latest` directamente durante mucho tiempo. Esto hará que la actualización sea más controlable.

## Requisitos previos

- Docker y Docker Compose instalados
- Asegúrese de que el servicio Docker esté iniciado.
- Se ha preparado un puerto para abrirse al mundo exterior, como por ejemplo `13000`

## Paso 1: crear el directorio del proyecto

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Paso 2: Crear `docker-compose.yml`

El siguiente ejemplo utiliza PostgreSQL, que también es la combinación más sencilla de forma predeterminada:

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

en:

- `APP_KEY` Recuerda cambiarlo a tu propia cadena aleatoria
- `13000:80` representa la asignación del puerto `13000` del host al puerto `80` del contenedor
- Si ya tiene un servicio de base de datos, puede eliminar la sección `postgres` y cambiar `DB_HOST` a la dirección de la base de datos existente.

Si usa MySQL o MariaDB, recuerde cambiar `DB_DIALECT` al tipo correspondiente y agregar:

```bash
DB_UNDERSCORED=true
```

## Paso 3: Inicie la aplicación

```bash
docker compose up -d
```

Verifique el registro:

```bash
docker compose logs -f app
```

## Paso 4: Accede a la aplicación

Una vez iniciada la aplicación, abra:

```text
http://<服务器IP>:13000
```

Si es la primera vez que comienza, simplemente siga las instrucciones de la página para inicializar la cuenta de administrador.

## Comandos comunes

Iniciar o actualizar contenedores:

```bash
docker compose up -d
```

Detener la aplicación:

```bash
docker compose down
```

Verifique el registro:

```bash
docker compose logs -f app
```

## Dónde buscar a continuación

- Si desea ajustar la configuración de claves, puertos, bases de datos, etc., continúe viendo [Variables de entorno de aplicación](./env.md)
- Si está listo para conectarse oficialmente, continúe leyendo [Nginx](../production/reverse-proxy/nginx.md) o [Caddy](../production/reverse-proxy/caddy.md)
- Si desea realizar una copia de seguridad de los datos más adelante, continúe para ver [Copia de seguridad y restauración] (../operaciones/backup-restore.md)
