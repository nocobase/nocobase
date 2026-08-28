---
pkg: '@nocobase/plugin-app-supervisor'
---

# Режим работы с несколькими средами

## Введение

Режим мультиприложений в общей памяти даёт явные преимущества для развёртывания и эксплуатации. Однако с ростом числа приложений и усложнением бизнес-логики один экземпляр постепенно сталкивается с конкуренцией за ресурсы и снижением стабильности. Для таких сценариев можно использовать **гибридное развёртывание в нескольких средах**, чтобы поддерживать более сложные бизнес-требования.

В этом режиме система разворачивает одно **входное приложение** как единый центр управления и диспетчеризации, а также несколько **экземпляров NocoBase** как независимые окружения выполнения, в которых фактически работают бизнес-приложения. Окружения изолированы друг от друга, но взаимодействуют между собой, что эффективно распределяет нагрузку и существенно повышает стабильность, масштабируемость и изоляцию сбоев.

На уровне развёртывания разные окружения могут запускаться как отдельные процессы, Docker-контейнеры или несколько развёртываний Kubernetes, что позволяет гибко адаптироваться к инфраструктурам разных масштабов и архитектур.

## Развёртывание

В режиме гибридного развёртывания в нескольких средах:

- **входное приложение (супервизор)** отвечает за централизованное управление приложениями и окружениями;
- **рабочие приложения (воркеры)** выступают фактическими бизнес-окружениями выполнения;
- конфигурации приложений и окружений кэшируются в Redis;
- отправка команд и синхронизация статусов между супервизором и воркерами опираются на Redis.

Создание окружений пока не предоставляется. Каждый воркер нужно развернуть вручную и настроить информацию об окружении, чтобы супервизор мог его обнаружить.

### Архитектурные зависимости

Перед развёртыванием подготовьте следующие сервисы:

- **Redis**
  - кэширует конфигурации приложений и окружений;
  - используется как канал обмена командами между супервизором и воркерами.

- **База данных**
  - сервисы БД, используемые и супервизором, и воркерами.

### Входное приложение (супервизор)

Супервизор выступает единой управляющей плоскостью и отвечает за создание приложений, запуск/остановку, планирование окружений и проксирование доступа к приложениям.

Переменные окружения супервизора:

```bash
# Режим приложения
APP_MODE=supervisor
# Адаптер обнаружения приложения
APP_DISCOVERY_ADAPTER=remote
# Адаптер процесса приложения
APP_PROCESS_ADAPTER=remote
# Redis для кэша конфигураций приложений и окружений
APP_SUPERVISOR_REDIS_URL=
# Адаптер командной связи
APP_COMMAND_ADPATER=redis
# Redis для командной связи
APP_COMMAND_REDIS_URL=
```

### Рабочее приложение (воркер)

Воркер выступает фактическим бизнес-окружением выполнения и размещает/запускает конкретные экземпляры приложения NocoBase.

Переменные окружения воркера:

```bash
# Режим приложения
APP_MODE=worker
# Адаптер обнаружения приложения
APP_DISCOVERY_ADAPTER=remote
# Адаптер процесса приложения
APP_PROCESS_ADAPTER=local
# Redis для кэша конфигураций приложений и окружений
APP_SUPERVISOR_REDIS_URL=
# Адаптер командной связи
APP_COMMAND_ADPATER=redis
# Redis для командной связи
APP_COMMAND_REDIS_URL=
# Идентификатор окружения
ENVIRONMENT_NAME=
# URL доступа к окружению
ENVIRONMENT_URL=
# URL прокси окружения
ENVIRONMENT_PROXY_URL=
```

### Пример docker-compose

Следующий пример показывает гибридное развёртывание в нескольких средах, где Docker-контейнеры используются как единицы выполнения. Через Docker Compose разворачиваются один супервизор и два воркера.

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

## Руководство пользователя

Базовые операции управления приложениями такие же, как в режиме общей памяти. Подробности см. в [Режим общей памяти](./local.md). В этом разделе акцент на конфигурации, специфичной для режима нескольких сред.

### Список окружений

После развёртывания откройте **Супервизор приложений** во входном приложении. На вкладке **Окружения** можно увидеть зарегистрированные окружения воркеров: идентификатор окружения, версию воркера, URL доступа и статус. Воркеры отправляют сигналы доступности каждые 2 минуты для подтверждения работоспособности.

![](https://static-docs.nocobase.com/202512291830371.png)

### Создание приложения

При создании приложения можно выбрать одно или несколько окружений выполнения, где оно будет развернуто. В большинстве случаев рекомендуется выбирать одно окружение. Несколько окружений стоит выбирать только при использовании [разделения сервисов](/cluster-mode/services-splitting), когда одно и то же приложение разворачивается в нескольких окружениях для балансировки нагрузки или изоляции возможностей.

![](https://static-docs.nocobase.com/202512291835086.png)

### Список приложений

Список приложений показывает окружения выполнения и статус каждого приложения. Если приложение развернуто в нескольких окружениях, отображаются несколько состояний выполнения. В штатном режиме одно и то же приложение в разных окружениях должно оставаться в согласованном состоянии и запускаться/останавливаться централизованно.

![](https://static-docs.nocobase.com/202512291842216.png)

### Запуск приложения

Поскольку запуск приложения может записывать инициализационные данные в БД, приложения, развернутые в нескольких окружениях, запускаются **последовательно**, чтобы избежать состояния гонки.

![](https://static-docs.nocobase.com/202512291841727.png)

### Прокси-доступ к приложению

Приложения-воркеры можно открывать через входное приложение по подпути `/apps/:appName/admin`.

![](https://static-docs.nocobase.com/202601082154230.png)

Если приложение развернуто в нескольких окружениях, для прокси-доступа нужно выбрать целевое окружение.

![](https://static-docs.nocobase.com/202601082155146.png)

По умолчанию прокси использует адрес доступа приложения воркера из переменной окружения `ENVIRONMENT_URL`. Этот адрес должен быть достижим из сети, где работает входное приложение. Если нужен другой адрес для проксирования, его можно переопределить через переменную `ENVIRONMENT_PROXY_URL`.