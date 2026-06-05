---
pkg: '@nocobase/plugin-app-supervisor'
---

# Режим мультисреды

## Введение

Режим мульти-приложений в общей памяти удобен в эксплуатации, но при росте нагрузки и сложности бизнеса одного экземпляра может быть недостаточно. Для этого применяется гибридное мультисредовое развертывание.

В этом режиме одна **входная инстанция** используется как единый центр управления и планирования, а несколько экземпляров NocoBase работают как независимые среды исполнения.

На уровне инфраструктуры среды могут работать как отдельные процессы, Docker-контейнеры или несколько Kubernetes Deployment.

## Развертывание

В мультисредовом режиме:

- **Входное приложение (Supervisor)** централизованно управляет приложениями и средами
- **Worker-приложения** выполняют фактическую бизнес-нагрузку
- Конфигурации приложений и сред кэшируются в Redis
- Команды и синхронизация состояния между Supervisor и Worker идут через Redis

Создание сред пока не автоматизировано. Каждый Worker нужно развернуть и настроить вручную.

### Архитектурные зависимости

Перед развертыванием подготовьте:

- **Redis**
  - Кэш конфигурации приложений и сред
  - Канал командной коммуникации между Supervisor и Worker

- **База данных**
  - DB-сервисы для Supervisor и Worker

### Входное приложение (Supervisor)

Supervisor отвечает за создание приложений, запуск/остановку, маршрутизацию по средам и проксирование доступа.

Переменные окружения Supervisor:

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

### Worker-приложение

Worker хостит и запускает конкретные экземпляры приложений NocoBase.

Переменные окружения Worker:

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

### Пример Docker Compose

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

## Руководство

Базовые операции управления приложениями совпадают с [режимом общей памяти](./local.md). Ниже — особенности мультисреды.

### Список сред

После развертывания зайдите в **App supervisor** и откройте вкладку **Environment**: там отображаются зарегистрированные Worker-среды (идентификатор, версия, URL, статус). Worker отправляют heartbeat каждые 2 минуты.

![](https://static-docs.nocobase.com/202512291830371.png)

### Создание приложения

При создании приложения можно выбрать одну или несколько сред исполнения. Обычно достаточно одной. Несколько сред нужны в сценариях [services splitting](/cluster-mode/services-splitting).

![](https://static-docs.nocobase.com/202512291835086.png)

### Список приложений

Список показывает текущие среды и статусы приложений. Если приложение размещено в нескольких средах, отображается несколько статусов.

![](https://static-docs.nocobase.com/202512291842216.png)

### Запуск приложения

Поскольку запуск может записывать инициализационные данные в БД, для предотвращения race condition запуск в нескольких средах выполняется через очередь.

![](https://static-docs.nocobase.com/202512291841727.png)

### Прокси-доступ

Worker-приложения доступны через подпуть `/apps/:appName/admin` входного приложения.

![](https://static-docs.nocobase.com/202601082154230.png)

Если приложение развернуто в нескольких средах, необходимо указать целевую среду для прокси-доступа.

![](https://static-docs.nocobase.com/202601082155146.png)

По умолчанию используется `ENVIRONMENT_URL`, адрес должен быть достижим из сети входного приложения. Для отдельного прокси-адреса задайте `ENVIRONMENT_PROXY_URL`.
