---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Повідомлення про ШІ-переклад"}
Цей документ було перекладено за допомогою ШІ. Для точної інформації зверніться до [англійської версії](/multi-app/multi-app/remote).
:::

# Режим кількох середовищ

## Вступ

Багатозастосунковий режим зі спільною пам'яттю має очевидні переваги в розгортанні та експлуатації, проте зі збільшенням кількості застосунків та складності бізнесу один екземпляр може поступово стикатися з проблемами конкуренції за ресурси та зниження стабільності. Для таких сценаріїв користувачі можуть застосовувати схему гібридного розгортання в кількох середовищах, щоб підтримувати складніші бізнес-вимоги.

У цьому режимі система розгортає один вхідний застосунок як єдиний центр управління та планування, а також кілька екземплярів NocoBase як незалежні середовища виконання застосунків, що безпосередньо забезпечують роботу бізнес-застосунків. Середовища ізольовані одне від одного та працюють спільно, що дозволяє ефективно розподіляти навантаження на один екземпляр, значно підвищуючи стабільність, масштабованість та здатність системи до ізоляції збоїв.

На рівні розгортання різні середовища можуть працювати як в окремих процесах, так і бути розгорнутими у вигляді різних контейнерів Docker або кількох Kubernetes Deployment, що дозволяє гнучко адаптуватися до інфраструктурних середовищ різного масштабу та архітектури.

## Розгортання

У режимі гібридного розгортання в кількох середовищах:

- Вхідний застосунок (Supervisor) відповідає за уніфіковане управління інформацією про застосунки та середовища
- Робочий застосунок (Worker) виступає як фактичне середовище виконання бізнесу
- Конфігурації застосунків та середовищ кешуються через Redis
- Синхронізація інструкцій та станів між вхідним та робочим застосунками залежить від зв'язку через Redis

Наразі функція створення середовища не надається; кожен робочий застосунок потрібно розгорнути вручну та налаштувати відповідну інформацію про середовище, перш ніж він зможе бути розпізнаний вхідним застосунком.

### Архітектурні залежності

Перед розгортанням підготуйте наступні сервіси:

- Redis
  - Кешування конфігурацій застосунків та середовищ
  - Використовується як канал командного зв'язку між вхідним та робочим застосунками

- База даних
  - Сервіси баз даних, до яких мають підключатися вхідний та робочий застосунки

### Вхідний застосунок (Supervisor)

Вхідний застосунок виступає як єдиний центр управління, відповідальний за створення, запуск, зупинку застосунків та планування середовищ, а також за проксі-доступ до застосунків.

Пояснення змінних середовища вхідного застосунку

```bash
# Режим застосунку
APP_MODE=supervisor
# Спосіб виявлення застосунків
APP_DISCOVERY_ADAPTER=remote
# Спосіб управління процесами застосунків
APP_PROCESS_ADAPTER=remote
# Redis для кешування конфігурацій застосунків та середовищ
APP_SUPERVISOR_REDIS_URL=
# Спосіб зв'язку команд застосунків
APP_COMMAND_ADPATER=redis
# Redis для зв'язку команд застосунків
APP_COMMAND_REDIS_URL=
```

### Робочий застосунок (Worker)

Робочий застосунок виступає як фактичне середовище виконання бізнесу, відповідальне за розміщення та запуск конкретних екземплярів застосунків NocoBase.

Пояснення змінних середовища робочого застосунку

```bash
# Режим застосунку
APP_MODE=worker
# Спосіб виявлення застосунків
APP_DISCOVERY_ADAPTER=remote
# Спосіб управління процесами застосунків
APP_PROCESS_ADAPTER=local
# Redis для кешування конфігурацій застосунків та середовищ
APP_SUPERVISOR_REDIS_URL=
# Спосіб зв'язку команд застосунків
APP_COMMAND_ADPATER=redis
# Redis для зв'язку команд застосунків
APP_COMMAND_REDIS_URL=
# Ідентифікатор середовища
ENVIRONMENT_NAME=
# URL-адреса доступу до середовища
ENVIRONMENT_URL=
# URL-адреса проксі-доступу до середовища
ENVIRONMENT_PROXY_URL=
```

### Приклад Docker Compose

Наступний приклад демонструє схему гібридного розгортання в кількох середовищах з використанням контейнерів Docker як одиниць виконання, де через Docker Compose одночасно розгортаються один вхідний застосунок та два робочі застосунки.

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

## Посібник користувача

Основні операції з управління застосунками не відрізняються від режиму спільної пам'яті, будь ласка, зверніться до розділу [Режим спільної пам'яті](./local.md). Ця частина в основному описує вміст, пов'язаний з конфігурацією кількох середовищ.

### Список середовищ

Після завершення розгортання перейдіть на сторінку «Менеджер застосунків» вхідного застосунку, де на вкладці «Середовища» можна переглянути список зареєстрованих робочих середовищ. Він містить таку інформацію, як ідентифікатор середовища, версія робочого застосунку, URL-адреса доступу та статус. Робочі застосунки повідомляють про свій стан (heartbeat) кожні 2 хвилини, щоб забезпечити доступність середовища.

![](https://static-docs.nocobase.com/202512291830371.png)

### Створення застосунку

При створенні застосунку ви можете вибрати одне або кілька середовищ виконання, щоб вказати, у яких робочих застосунках буде розгорнуто цей застосунок. Зазвичай рекомендується вибирати одне середовище. Вибирайте кілька середовищ лише тоді, коли в робочому застосунку виконано [розподіл сервісів](/cluster-mode/services-splitting) і необхідно розгорнути той самий застосунок у кількох середовищах виконання для розподілу навантаження або ізоляції можливостей.

![](https://static-docs.nocobase.com/202512291835086.png)

### Список застосунків

Сторінка списку застосунків відображає поточне середовище виконання та інформацію про статус для кожного застосунку. Якщо застосунок розгорнуто в кількох середовищах, відображатиметься кілька статусів виконання. За звичайних обставин той самий застосунок у кількох середовищах зберігатиме єдиний стан, і його запуск та зупинку потрібно контролювати уніфіковано.

![](https://static-docs.nocobase.com/202512291842216.png)

### Запуск застосунку

Оскільки під час запуску застосунку в базу даних можуть записуватися ініціалізаційні дані, для уникнення станів гонитви в умовах кількох середовищ, застосунки, розгорнути в кількох середовищах, запускатимуться по черзі.

![](https://static-docs.nocobase.com/202512291841727.png)

### Проксі-доступ до застосунку

До робочих застосунків можна отримати доступ через проксі за допомогою підшляху `/apps/:appName/admin` вхідного застосунку.

![](https://static-docs.nocobase.com/202601082154230.png)

Якщо застосунок розгорнуто в кількох середовищах, необхідно вказати цільове середовище для проксі-доступу.

![](https://static-docs.nocobase.com/202601082155146.png)

За замовчуванням для проксі-доступу використовується адреса доступу робочого застосунку, що відповідає змінній середовища `ENVIRONMENT_URL`. Переконайтеся, що ця адреса доступна в мережевому середовищі, де знаходиться вхідний застосунок. Якщо потрібно використовувати іншу адресу для проксі-доступу, її можна перевизначити за допомогою змінної середовища `ENVIRONMENT_PROXY_URL`.