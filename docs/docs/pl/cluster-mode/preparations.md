:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Przygotowanie

Przed wdrożeniem aplikacji klastrowej należy wykonać następujące czynności przygotowawcze.

## Licencja na wtyczki komercyjne

Aby aplikacja NocoBase działała w trybie klastrowym, wymaga wsparcia następujących wtyczek:

| Funkcja                  | Wtyczka                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Adapter pamięci podręcznej | Wbudowany                                                                           |
| Adapter sygnałów synchronizacji | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Adapter kolejki wiadomości | `@nocobase/plugin-queue-adapter-redis` lub `@nocobase/plugin-queue-adapter-rabbitmq` |
| Adapter blokady rozproszonej | `@nocobase/plugin-lock-adapter-redis`                                               |
| Alokator ID Workerów     | `@nocobase/plugin-workerid-allocator-redis`                                         |

Przede wszystkim prosimy upewnić się, że posiadają Państwo licencje na powyższe wtyczki (odpowiednie licencje można nabyć za pośrednictwem platformy usług wtyczek komercyjnych).

## Komponenty systemowe

Inne komponenty systemowe, poza samą instancją aplikacji, mogą być wybrane przez personel operacyjny w zależności od potrzeb operacyjnych zespołu.

### Baza danych

Ponieważ obecny tryb klastrowy dotyczy wyłącznie instancji aplikacji, baza danych tymczasowo obsługuje tylko jeden węzeł. Jeśli posiadają Państwo architekturę bazy danych typu master-slave, należy ją samodzielnie zaimplementować za pomocą oprogramowania pośredniczącego i zapewnić jej przezroczystość dla aplikacji NocoBase.

### Oprogramowanie pośredniczące

Tryb klastrowy NocoBase wymaga pewnego oprogramowania pośredniczącego do komunikacji i koordynacji między klastrami, w tym:

- **Pamięć podręczna**: Wykorzystuje rozproszone oprogramowanie pośredniczące pamięci podręcznej oparte na Redis, aby zwiększyć szybkość dostępu do danych.
- **Sygnały synchronizacji**: Wykorzystuje funkcję strumienia Redis do realizacji przesyłania sygnałów synchronizacji między klastrami.
- **Kolejka wiadomości**: Wykorzystuje oprogramowanie pośredniczące kolejki wiadomości oparte na Redis lub RabbitMQ do realizacji asynchronicznego przetwarzania wiadomości.
- **Blokada rozproszona**: Wykorzystuje blokadę rozproszoną opartą na Redis, aby zapewnić bezpieczeństwo dostępu do współdzielonych zasobów w klastrze.

Gdy wszystkie komponenty oprogramowania pośredniczącego korzystają z Redis, można uruchomić pojedynczą usługę Redis w wewnętrznej sieci klastra (lub Kubernetes). Alternatywnie, można włączyć oddzielną usługę Redis dla każdej funkcji (pamięci podręcznej, sygnałów synchronizacji, kolejki wiadomości i blokady rozproszonej).

**Zalecane wersje**

- Redis: >=8.0 lub wersja redis-stack zawierająca funkcję Bloom Filter.
- RabbitMQ: >=4.0

### Współdzielona pamięć masowa

NocoBase wymaga użycia katalogu `storage` do przechowywania plików związanych z systemem. W trybie wielowęzłowym należy zamontować dysk w chmurze (lub NFS), aby umożliwić współdzielony dostęp wielu węzłów. W przeciwnym razie lokalna pamięć masowa nie zostanie automatycznie zsynchronizowana i nie będzie działać prawidłowo.

Podczas wdrażania za pomocą Kubernetes, prosimy zapoznać się z sekcją [Wdrożenie Kubernetes: Współdzielona pamięć masowa](./kubernetes#shared-storage).

### Równoważenie obciążenia

Tryb klastrowy wymaga użycia load balancera (równoważnika obciążenia) do dystrybucji żądań, a także do sprawdzania stanu i przełączania awaryjnego instancji aplikacji. Tę część należy wybrać i skonfigurować zgodnie z potrzebami operacyjnymi zespołu.

Na przykład, w przypadku samodzielnie hostowanego Nginx, należy dodać następującą zawartość do pliku konfiguracyjnego:

```
upstream myapp {
    # ip_hash; # Może być używany do utrzymywania sesji. Po włączeniu, żądania od tego samego klienta są zawsze wysyłane do tego samego serwera backendowego.
    server 172.31.0.1:13000; # Węzeł wewnętrzny 1
    server 172.31.0.2:13000; # Węzeł wewnętrzny 2
    server 172.31.0.3:13000; # Węzeł wewnętrzny 3
}

server {
    listen 80;

    location / {
        # Użyj zdefiniowanego upstream do równoważenia obciążenia
        proxy_pass http://myapp;
        # ... inne konfiguracje
    }
}
```

Oznacza to, że żądania są przekazywane przez reverse proxy i dystrybuowane do różnych węzłów serwera w celu przetworzenia.

W przypadku oprogramowania pośredniczącego do równoważenia obciążenia oferowanego przez innych dostawców usług chmurowych, prosimy zapoznać się z dokumentacją konfiguracji dostarczoną przez konkretnego dostawcę.

## Konfiguracja zmiennych środowiskowych

Wszystkie węzły w klastrze powinny używać tej samej konfiguracji zmiennych środowiskowych. Oprócz podstawowych [zmiennych środowiskowych](/api/cli/env) NocoBase, należy również skonfigurować następujące zmienne środowiskowe związane z oprogramowaniem pośredniczącym.

### Tryb wielordzeniowy

Gdy aplikacja działa na węźle wielordzeniowym, można włączyć tryb wielordzeniowy węzła:

```ini
# Włącz tryb wielordzeniowy PM2
# CLUSTER_MODE=max # Domyślnie wyłączony, wymaga ręcznej konfiguracji
```

Jeśli wdrażają Państwo pody aplikacji w Kubernetes, można zignorować tę konfigurację i kontrolować liczbę instancji aplikacji za pomocą liczby replik podów.

### Pamięć podręczna

```ini
# Adapter pamięci podręcznej, w trybie klastrowym należy ustawić na redis (domyślnie, jeśli nie wypełniono, to pamięć wbudowana)
CACHE_DEFAULT_STORE=redis

# Adres URL połączenia adaptera pamięci podręcznej Redis, należy aktywnie wypełnić
CACHE_REDIS_URL=
```

### Sygnały synchronizacji

```ini
# Adres URL połączenia adaptera synchronizacji Redis, domyślnie, jeśli nie wypełniono, to redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

### Blokada rozproszona

```ini
# Adapter blokady, w trybie klastrowym należy ustawić na redis (domyślnie, jeśli nie wypełniono, to lokalna blokada w pamięci)
LOCK_ADAPTER_DEFAULT=redis

# Adres URL połączenia adaptera blokady Redis, domyślnie, jeśli nie wypełniono, to redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

### Kolejka wiadomości

```ini
# Włącz Redis jako adapter kolejki wiadomości, domyślnie, jeśli nie wypełniono, to adapter w pamięci
QUEUE_ADAPTER=redis
# Adres URL połączenia adaptera kolejki wiadomości Redis, domyślnie, jeśli nie wypełniono, to redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

### Alokator ID Workerów

Niektóre kolekcje systemowe w NocoBase używają globalnie unikalnych identyfikatorów (ID) jako kluczy podstawowych. Aby zapobiec konfliktom kluczy podstawowych w klastrze, każda instancja aplikacji musi uzyskać unikalny ID Workera za pośrednictwem Alokatora ID Workerów. Obecny zakres ID Workera to 0–31, co oznacza, że każda aplikacja może jednocześnie działać na maksymalnie 32 węzłach. Szczegóły dotyczące projektowania globalnie unikalnych identyfikatorów znajdują się w [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# Adres URL połączenia Redis dla Alokatora ID Workerów.
# Jeśli pominięto, zostanie przypisany losowy ID Workera.
REDIS_URL=
```

:::info{title=Wskazówka}
Zazwyczaj powiązane adaptery mogą korzystać z tej samej instancji Redis, ale najlepiej jest używać różnych baz danych, aby uniknąć potencjalnych problemów z konfliktami kluczy, na przykład:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Obecnie każda wtyczka używa własnych zmiennych środowiskowych związanych z Redis. W przyszłości rozważymy ujednolicenie użycia `REDIS_URL` jako konfiguracji awaryjnej.

:::

Jeśli używają Państwo Kubernetes do zarządzania klastrem, mogą Państwo skonfigurować powyższe zmienne środowiskowe w ConfigMap lub Secret. Więcej powiązanych treści znajdą Państwo w [Wdrożenie Kubernetes](./kubernetes).

Po zakończeniu wszystkich powyższych prac przygotowawczych, mogą Państwo przejść do [Procesów operacyjnych](./operations), aby kontynuować zarządzanie instancjami aplikacji.