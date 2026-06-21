# Установка через Docker Compose

Если вы хотите запустить NocoBase непосредственно на сервере, `docker compose` по-прежнему является наиболее прямым способом. Одной порции `docker-compose.yml` достаточно для большинства сценариев.

Однако в производственной среде рекомендуется исправить конкретный номер версии и не использовать напрямую `latest` в течение длительного времени. Это сделает обновление более управляемым.

## Предварительные условия

- Установлены Docker и Docker Compose.
- Убедитесь, что служба Docker запущена.
- Подготовлен порт, который будет открыт для внешнего мира, например `13000`.

## Шаг 1. Создайте каталог проекта

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Шаг 2: Создайте `docker-compose.yml`

В следующем примере используется PostgreSQL, который по умолчанию также является наиболее удобной комбинацией:

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

в:

- `APP_KEY` Не забудьте изменить его на свою собственную случайную строку.
- `13000:80` представляет собой сопоставление порта `13000` хоста с портом `80` контейнера.
– Если у вас уже есть служба базы данных, вы можете удалить раздел `postgres` и изменить `DB_HOST` на существующий адрес базы данных.

Если вы используете MySQL или MariaDB, не забудьте изменить `DB_DIALECT` на соответствующий тип и добавить:

```bash
DB_UNDERSCORED=true
```

## Шаг 3: Запустите приложение

```bash
docker compose up -d
```

Проверьте журнал:

```bash
docker compose logs -f app
```

## Шаг 4: Получите доступ к приложению

После запуска приложения откройте:

```text
http://<服务器IP>:13000
```

Если это первый запуск, просто следуйте инструкциям на странице, чтобы инициализировать учетную запись администратора.

## Общие команды

Запустите или обновите контейнеры:

```bash
docker compose up -d
```

Остановить приложение:

```bash
docker compose down
```

Проверьте журнал:

```bash
docker compose logs -f app
```

## Куда смотреть дальше

- Если вы хотите настроить конфигурацию ключей, портов, баз данных и т. д., продолжайте просматривать [Переменные среды приложения] (./env.md).
- Если вы готовы официально выйти в интернет, продолжайте читать [Nginx](../production/reverse-proxy/nginx.md) или [Caddy](../production/reverse-proxy/caddy.md)
- Если вы хотите создать резервную копию данных позже, перейдите к разделу [Резервное копирование и восстановление](../operations/backup-restore.md).
