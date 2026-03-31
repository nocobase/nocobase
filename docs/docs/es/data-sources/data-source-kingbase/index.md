---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Fuente de datos - KingbaseES

## Introducción

Puede utilizar la base de datos KingbaseES como una fuente de datos, ya sea como la base de datos principal o como una base de datos externa.

:::warning
Actualmente, solo se admiten las bases de datos KingbaseES que se ejecutan en modo pg.
:::

## Instalación

### Uso como base de datos principal

Consulte la documentación de instalación para conocer los procedimientos de configuración. La principal diferencia radica en las variables de entorno.

#### Variables de entorno

Edite el archivo .env para añadir o modificar las siguientes configuraciones de variables de entorno:

```bash
# Ajuste los parámetros de la base de datos según sea necesario
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalación con Docker

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Instalación usando create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Uso como base de datos externa

Ejecute el comando de instalación o actualización:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Active el plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Guía de uso

- Base de datos principal: Consulte la [fuente de datos principal](/data-sources/data-source-main/)
- Base de datos externa: Consulte [Fuente de datos / Base de datos externa](/data-sources/data-source-manager/external-database)