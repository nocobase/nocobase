---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::


# Источник данных - KingbaseES

## Введение

Вы можете использовать базу данных KingbaseES в качестве источника данных, как основную, так и внешнюю базу данных.

:::warning
В настоящее время поддерживаются только базы данных KingbaseES, работающие в режиме pg.
:::

## Установка

### Использование в качестве основной базы данных

Процесс установки описан в документации по установке; основное отличие заключается в переменных окружения.

#### Переменные окружения

Отредактируйте файл .env, чтобы добавить или изменить следующие переменные окружения:

```bash
# Настройте параметры БД по мере необходимости
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Установка с помощью Docker

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

#### Установка с помощью create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Использование в качестве внешней базы данных

Выполните команду установки или обновления:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Активируйте плагин:

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Руководство пользователя

- Основная база данных: См. [Основной источник данных](/data-sources/data-source-main/)
- Внешняя база данных: См. [Источник данных / Внешняя база данных](/data-sources/data-source-manager/external-database)