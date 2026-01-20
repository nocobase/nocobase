---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::

# Джерело даних - KingbaseES

## Вступ

Базу даних KingbaseES можна використовувати як джерело даних, як основну базу даних, так і як зовнішню.

:::warning
Наразі підтримуються лише бази даних KingbaseES, що працюють у режимі pg.
:::

## Встановлення

### Використання як основної бази даних

Процедури встановлення описані в документації з інсталяції. Основна відмінність полягає в змінних середовища.

#### Змінні середовища

Відредагуйте файл .env, щоб додати або змінити наступні конфігурації змінних середовища:

```bash
# За потреби налаштуйте параметри бази даних
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Встановлення за допомогою Docker

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

#### Встановлення за допомогою create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Використання як зовнішньої бази даних

Виконайте команду встановлення або оновлення:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Активуйте плагін

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Посібник користувача

- Основна база даних: Дивіться [Основне джерело даних](/data-sources/data-source-main/)
- Зовнішня база даних: Дивіться [Джерело даних / Зовнішня база даних](/data-sources/data-source-manager/external-database)