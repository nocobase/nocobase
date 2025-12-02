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
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # Ключ програми для генерації токенів користувачів тощо.
      # Якщо APP_KEY змінено, старі токени стануть недійсними.
      # Може бути будь-яким випадковим рядком, переконайтеся, що він не розголошується.
      - APP_KEY=your-secret-key
      # Тип бази даних
      - DB_DIALECT=kingbase
      # Хост бази даних, можна замінити на IP-адресу наявного сервера бази даних.
      - DB_HOST=kingbase
      # Назва бази даних
      - DB_DATABASE=kingbase
      # Користувач бази даних
      - DB_USER=nocobase
      # Пароль бази даних
      - DB_PASSWORD=nocobase
      # Часовий пояс
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Сервіс Kingbase лише для тестування
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
      ENABLE_CI: no # Має бути "no"
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Тільки pg
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