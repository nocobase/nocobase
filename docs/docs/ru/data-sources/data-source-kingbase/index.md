---
pkg: "@nocobase/plugin-data-source-kingbase"
---

# Источник данных - база данных KingbaseES

## Введение

KingbaseES может использоваться как источник данных: как основная база данных или как внешняя база данных.

:::warning
Сейчас поддерживаются только базы данных KingbaseES, работающие в режиме pg.
:::

## Установка

### Использование как основной базы данных

Порядок настройки см. в документации по установке; основное отличие связано с переменными окружения.

#### Переменные окружения

Отредактируйте файл `.env`, добавив или изменив следующие параметры переменных окружения:

```bash
# При необходимости скорректируйте параметры БД
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Установка через Docker

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
      # Ключ приложения для генерации пользовательских токенов и т.д.
      # При изменении APP_KEY старые токены станут недействительны
      # Используйте случайную строку и храните ее в секрете
      - APP_KEY=your-secret-key
      # Тип базы данных
      - DB_DIALECT=kingbase
      # Хост базы данных, при необходимости замените на IP существующего сервера БД
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Имя базы данных
      - DB_DATABASE=kingbase
      # Пользователь базы данных
      - DB_USER=nocobase
      # Пароль базы данных
      - DB_PASSWORD=nocobase
      # Часовой пояс
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

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

#### Установка через create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=UTC
```

### Использование как внешней базы данных

Выполните команду установки или обновления

```bash
yarn nocobase install
# или
yarn nocobase upgrade
```

Активируйте плагин

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Руководство пользовател

- Основная база данных: см. [Основной источник данных](/data-sources/data-source-main/)
- Внешняя база данных: см. [Источники данных / Внешняя база данных](/data-sources/data-source-manager/external-database)