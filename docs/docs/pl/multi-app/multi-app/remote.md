---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/multi-app/multi-app/remote).
:::

# Tryb wielośrodowiskowy

## Wprowadzenie

Tryb wielu aplikacji ze współdzieloną pamięcią posiada wyraźne zalety w zakresie wdrażania i utrzymania, ale wraz ze wzrostem liczby aplikacji i złożoności biznesowej, pojedyncza instancja może stopniowo napotykać problemy, takie jak rywalizacja o zasoby czy spadek stabilności. W takich scenariuszach użytkownicy mogą zastosować hybrydowy schemat wdrażania wielośrodowiskowego, aby sprostać bardziej złożonym wymaganiom biznesowym.

W tym trybie system wdraża aplikację wejściową jako ujednolicone centrum zarządzania i harmonogramowania, a jednocześnie wdraża wiele instancji NocoBase jako niezależne środowiska uruchomieniowe aplikacji, odpowiedzialne za faktyczną obsługę aplikacji biznesowych. Poszczególne środowiska są od siebie odizolowane i współpracują ze sobą, co skutecznie rozprasza obciążenie pojedynczej instancji i znacząco poprawia stabilność systemu, skalowalność oraz zdolność do izolacji awarii.

Na poziomie wdrożenia różne środowiska mogą działać w niezależnych procesach, być wdrażane jako oddzielne kontenery Docker lub istnieć w formie wielu wdrożeń (Deployments) Kubernetes, co pozwala na elastyczne dostosowanie do infrastruktury o różnej skali i architekturze.

## Wdrożenie

W hybrydowym trybie wdrażania wielośrodowiskowego:

- Aplikacja wejściowa (Supervisor) odpowiada za ujednolicone zarządzanie aplikacjami i informacjami o środowiskach.
- Aplikacje robocze (Worker) służą jako rzeczywiste środowiska uruchomieniowe dla biznesu.
- Konfiguracje aplikacji i środowisk są buforowane w Redis.
- Synchronizacja instrukcji i stanów między aplikacją wejściową a aplikacjami roboczymi opiera się na komunikacji Redis.

Obecnie funkcja tworzenia środowisk nie jest jeszcze dostępna; każda aplikacja robocza musi zostać wdrożona ręcznie i skonfigurowana z odpowiednimi informacjami o środowisku, zanim zostanie rozpoznana przez aplikację wejściową.

### Zależności architektury

Przed wdrożeniem należy przygotować następujące usługi:

- Redis
  - Buforowanie konfiguracji aplikacji i środowisk.
  - Służy jako kanał komunikacji poleceń między aplikacją wejściową a aplikacjami roboczymi.

- Baza danych
  - Usługi bazodanowe, z którymi muszą łączyć się aplikacje wejściowe i robocze.

### Aplikacja wejściowa (Supervisor)

Aplikacja wejściowa pełni rolę ujednoliconego centrum zarządzania, odpowiadając za tworzenie, uruchamianie, zatrzymywanie aplikacji, harmonogramowanie środowisk oraz pośrednictwo w dostępie do aplikacji (proxy).

Objaśnienie konfiguracji zmiennych środowiskowych aplikacji wejściowej:

```bash
# Tryb aplikacji
APP_MODE=supervisor
# Sposób wykrywania aplikacji
APP_DISCOVERY_ADAPTER=remote
# Sposób zarządzania procesami aplikacji
APP_PROCESS_ADAPTER=remote
# Redis do buforowania konfiguracji aplikacji i środowisk
APP_SUPERVISOR_REDIS_URL=
# Sposób komunikacji poleceń aplikacji
APP_COMMAND_ADPATER=redis
# Redis do komunikacji poleceń aplikacji
APP_COMMAND_REDIS_URL=
```

### Aplikacja robocza (Worker)

Aplikacja robocza służy jako rzeczywiste środowisko uruchomieniowe biznesu, odpowiedzialne za hostowanie i uruchamianie konkretnych instancji aplikacji NocoBase.

Objaśnienie konfiguracji zmiennych środowiskowych aplikacji roboczej:

```bash
# Tryb aplikacji
APP_MODE=worker
# Sposób wykrywania aplikacji
APP_DISCOVERY_ADAPTER=remote
# Sposób zarządzania procesami aplikacji
APP_PROCESS_ADAPTER=local
# Redis do buforowania konfiguracji aplikacji i środowisk
APP_SUPERVISOR_REDIS_URL=
# Sposób komunikacji poleceń aplikacji
APP_COMMAND_ADPATER=redis
# Redis do komunikacji poleceń aplikacji
APP_COMMAND_REDIS_URL=
# Identyfikator środowiska
ENVIRONMENT_NAME=
# Adres URL dostępu do środowiska
ENVIRONMENT_URL=
# Adres URL dostępu przez proxy do środowiska
ENVIRONMENT_PROXY_URL=
```

### Przykład Docker Compose

Poniższy przykład przedstawia hybrydowy schemat wdrażania wielośrodowiskowego z wykorzystaniem kontenerów Docker jako jednostek uruchomieniowych, wdrażając jednocześnie jedną aplikację wejściową i dwie aplikacje robocze za pomocą Docker Compose.

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

## Podręcznik użytkownika

Podstawowe operacje zarządzania aplikacjami nie różnią się od trybu współdzielonej pamięci; prosimy zapoznać się z sekcją [Tryb współdzielonej pamięci](./local.md). Ta część koncentruje się głównie na treściach związanych z konfiguracją wielośrodowiskową.

### Lista środowisk

Po zakończeniu wdrażania, po wejściu na stronę „App Supervisor” aplikacji wejściowej, na karcie „Environments” można wyświetlić listę zarejestrowanych środowisk roboczych. Zawiera ona identyfikator środowiska, wersję aplikacji roboczej, adres URL dostępu oraz status. Aplikacje robocze wysyłają sygnał bicia serca (heartbeat) co 2 minuty, aby zapewnić dostępność środowiska.

![](https://static-docs.nocobase.com/202512291830371.png)

### Tworzenie aplikacji

Podczas tworzenia aplikacji można wybrać jedno lub więcej środowisk uruchomieniowych, aby określić, w których aplikacjach roboczych zostanie wdrożona dana aplikacja. Zazwyczaj zaleca się wybór jednego środowiska. Wybór wielu środowisk jest uzasadniony tylko wtedy, gdy w aplikacji roboczej przeprowadzono [podział usług](/cluster-mode/services-splitting) i konieczne jest wdrożenie tej samej aplikacji w wielu środowiskach w celu równoważenia obciążenia lub izolacji możliwości.

![](https://static-docs.nocobase.com/202512291835086.png)

### Lista aplikacji

Strona listy aplikacji wyświetla aktualne środowisko uruchomieniowe oraz informacje o statusie dla każdej aplikacji. Jeśli aplikacja jest wdrożona w wielu środowiskach, wyświetlanych będzie wiele stanów uruchomienia. Ta sama aplikacja w wielu środowiskach powinna w normalnych warunkach utrzymywać jednolity stan i wymagać ujednoliconego sterowania uruchamianiem i zatrzymywaniem.

![](https://static-docs.nocobase.com/202512291842216.png)

### Uruchamianie aplikacji

Ponieważ uruchomienie aplikacji może wiązać się z zapisywaniem danych inicjalizacyjnych do bazy danych, aby uniknąć wyścigów (race conditions) w środowisku wielośrodowiskowym, aplikacje wdrożone w wielu środowiskach będą uruchamiane w kolejce.

![](https://static-docs.nocobase.com/202512291841727.png)

### Pośrednictwo w dostępie do aplikacji (Proxy)

Dostęp do aplikacji roboczych może odbywać się za pośrednictwem aplikacji wejściowej poprzez ścieżkę podrzędną `/apps/:appName/admin`.

![](https://static-docs.nocobase.com/202601082154230.png)

Jeśli aplikacja jest wdrożona w wielu środowiskach, należy określić docelowe środowisko dla dostępu przez proxy.

![](https://static-docs.nocobase.com/202601082155146.png)

Domyślnie adres dostępu proxy korzysta z adresu dostępu aplikacji roboczej, odpowiadającego zmiennej środowiskowej `ENVIRONMENT_URL`. Należy upewnić się, że adres ten jest dostępny w środowisku sieciowym, w którym znajduje się aplikacja wejściowa. Jeśli wymagane jest użycie innego adresu dostępu proxy, można go nadpisać za pomocą zmiennej środowiskowej `ENVIRONMENT_PROXY_URL`.