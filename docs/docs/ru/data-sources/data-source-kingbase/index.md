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
      # Ключ приложения для генерации токенов пользователей и т.д.
      # Изменение APP_KEY аннулирует старые токены
      # Используйте случайную строку и храните ее в секрете
      - APP_KEY=your-secret-key
      # Тип базы данных
      - DB_DIALECT=kingbase
      # Хост базы данных, при необходимости замените на IP существующего сервера БД
      - DB_HOST=kingbase
      # Имя базы данных
      - DB_DATABASE=kingbase
      # Пользователь базы данных
      - DB_USER=nocobase
      # Пароль базы данных
      - DB_PASSWORD=nocobase
      # Часовой пояс
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Сервис Kingbase только для целей тестирования
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
      ENABLE_CI: no # Должно быть установлено в no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Только pg
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