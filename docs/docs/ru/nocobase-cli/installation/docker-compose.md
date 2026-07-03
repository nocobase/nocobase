# Установка через Docker Compose

Если хотите запустить NocoBase прямо на сервере, `docker compose` по-прежнему самый простой способ. Одного `docker-compose.yml` достаточно для большинства сценариев.

В производственном окружении рекомендуется зафиксировать конкретную версию и не использовать `latest` длительное время — так проще управлять обновлениями.

## Предварительные условия

- Установлены Docker и Docker Compose.
- Служба Docker запущена.
- Подготовлен порт для внешнего доступа, например `13000`.

## Шаг 1. Создайте каталог проекта

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Шаг 2. Создайте `docker-compose.yml`

В примере ниже используется PostgreSQL — наиболее удобная комбинация по умолчанию:

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

Примечание:

- `APP_KEY` — замените на собственную случайную строку.
- `13000:80` — сопоставление порта `13000` хоста с портом `80` контейнера.
- Если служба БД уже есть, удалите секцию `postgres` и укажите существующий адрес в `DB_HOST`.

При использовании MySQL или MariaDB измените `DB_DIALECT` на соответствующий тип и добавьте:

```bash
DB_UNDERSCORED=true
```

## Шаг 3. Запустите приложение

```bash
docker compose up -d
```

Проверьте лог:

```bash
docker compose logs -f app
```

## Шаг 4. Откройте приложение

После запуска откройте:

```text
http://<IP-сервер>:13000
```

При первом запуске следуйте подсказкам на странице для инициализации учётной записи администратора.

## Частые команды

Запуск или обновление контейнеров:

```bash
docker compose up -d
```

Остановка приложения:

```bash
docker compose down
```

Просмотр лога:

```bash
docker compose logs -f app
```

## Куда смотреть дальше

- Чтобы настроить ключи, порты, БД и т. д., см. [Конфигурация приложения и `.env`](./env.md).
- Если готовы официально вывести систему в сеть, продолжайте с [Nginx](../production/reverse-proxy/nginx.md) или [Caddy](../production/reverse-proxy/caddy.md).
- Для резервного копирования данных позже см. [Резервное копирование и восстановление](../operations/backup-restore.md).
