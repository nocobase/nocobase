---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/multi-app/multi-app/remote).
:::

# Režim více prostředí

## Úvod

Režim více aplikací se sdílenou pamětí má zřejmé výhody v nasazení a provozu, ale s rostoucím počtem aplikací a složitostí procesů může jedna instance postupně čelit problémům, jako je soupeření o prostředky a snížená stabilita. Pro tyto scénáře mohou uživatelé využít hybridní řešení nasazení ve více prostředích, které podpoří složitější obchodní požadavky.

V tomto režimu systém nasadí jednu vstupní aplikaci jako sjednocené centrum správy a plánování a zároveň nasadí několik instancí NocoBase jako nezávislá běhová prostředí aplikací, která skutečně hostují obchodní aplikace. Jednotlivá prostředí jsou od sebe izolována a spolupracují, čímž efektivně rozkládají zátěž jedné instance a výrazně zvyšují stabilitu, škálovatelnost a schopnost izolace poruch systému.

Na úrovni nasazení mohou různá prostředí běžet v samostatných procesech, jako různé kontejnery Docker nebo ve formě několika Kubernetes Deploymentů, což umožňuje flexibilní přizpůsobení infrastruktuře různých měřítek a architektur.

## Nasazení

V režimu hybridního nasazení ve více prostředích:

- Vstupní aplikace (Supervisor) odpovídá za sjednocenou správu aplikací a informací o prostředí
- Pracovní aplikace (Worker) slouží jako skutečné běhové prostředí pro obchodní aplikace
- Konfigurace aplikací a prostředí jsou ukládány do mezipaměti Redis
- Synchronizace instrukcí a stavů mezi vstupní aplikací a pracovními aplikacemi závisí na komunikaci přes Redis

V současné době není k dispozici funkce pro vytváření prostředí; každá pracovní aplikace musí být nasazena ručně a nakonfigurována s odpovídajícími informacemi o prostředí, aby ji vstupní aplikace mohla rozpoznat.

### Architektonické závislosti

Před nasazením si prosím připravte následující služby:

- Redis
  - Ukládání konfigurace aplikací a prostředí do mezipaměti
  - Slouží jako komunikační kanál pro příkazy mezi vstupní aplikací a pracovními aplikacemi

- Databáze
  - Databázové služby, ke kterým se musí připojit vstupní aplikace i pracovní aplikace

### Vstupní aplikace (Supervisor)

Vstupní aplikace slouží jako sjednocené centrum správy, které odpovídá za vytváření, spouštění, zastavování aplikací a plánování prostředí, a také za proxy přístup k aplikacím.

Popis konfigurace proměnných prostředí vstupní aplikace

```bash
# Režim aplikace
APP_MODE=supervisor
# Způsob zjišťování aplikací
APP_DISCOVERY_ADAPTER=remote
# Způsob správy procesů aplikací
APP_PROCESS_ADAPTER=remote
# Redis pro mezipaměť konfigurace aplikací a prostředí
APP_SUPERVISOR_REDIS_URL=
# Způsob komunikace příkazů aplikací
APP_COMMAND_ADPATER=redis
# Redis pro komunikaci příkazů aplikací
APP_COMMAND_REDIS_URL=
```

### Pracovní aplikace (Worker)

Pracovní aplikace slouží jako skutečné běhové prostředí, které odpovídá za hostování a běh konkrétních instancí aplikací NocoBase.

Popis konfigurace proměnných prostředí pracovní aplikace

```bash
# Režim aplikace
APP_MODE=worker
# Způsob zjišťování aplikací
APP_DISCOVERY_ADAPTER=remote
# Způsob správy procesů aplikací
APP_PROCESS_ADAPTER=local
# Redis pro mezipaměť konfigurace aplikací a prostředí
APP_SUPERVISOR_REDIS_URL=
# Způsob komunikace příkazů aplikací
APP_COMMAND_ADPATER=redis
# Redis pro komunikaci příkazů aplikací
APP_COMMAND_REDIS_URL=
# Identifikátor prostředí
ENVIRONMENT_NAME=
# URL pro přístup k prostředí
ENVIRONMENT_URL=
# URL pro proxy přístup k prostředí
ENVIRONMENT_PROXY_URL=
```

### Docker Compose Příklad

Následující příklad ukazuje hybridní řešení nasazení ve více prostředích s využitím kontejnerů Docker jako běhových jednotek, kde je pomocí Docker Compose současně nasazena jedna vstupní aplikace a dvě pracovní aplikace.

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

## Uživatelská příručka

Základní operace správy aplikací jsou stejné jako v režimu sdílené paměti, podrobnosti naleznete v části [Režim sdílené paměti](./local.md). Tato část se zaměřuje především na obsah související s konfigurací více prostředí.

### Seznam prostředí

Po dokončení nasazení přejděte na stránku „Správce aplikací“ ve vstupní aplikaci. Na kartě „Prostředí“ si můžete prohlédnout seznam registrovaných pracovních prostředí. Ten obsahuje informace jako identifikátor prostředí, verzi pracovní aplikace, URL pro přístup a stav. Pracovní aplikace odesílají signál o aktivu (heartbeat) každé 2 minuty, aby zajistily dostupnost prostředí.

![](https://static-docs.nocobase.com/202512291830371.png)

### Vytvoření aplikace

Při vytváření aplikace můžete vybrat jedno nebo více běhových prostředí, čímž určíte, do kterých pracovních aplikací bude tato aplikace nasazena. Obvykle se doporučuje vybrat pouze jedno prostředí. Více prostředí vybírejte pouze v případě, že u pracovní aplikace došlo k [rozdělení služeb](/cluster-mode/services-splitting) a je nutné nasadit stejnou aplikaci do více běhových prostředí za účelem sdílení zátěže nebo izolace schopností.

![](https://static-docs.nocobase.com/202512291835086.png)

### Seznam aplikací

Stránka se seznamem aplikací zobrazuje aktuální běhové prostředí a informace o stavu každé aplikace. Pokud je aplikace nasazena ve více prostředích, zobrazí se více provozních stavů. Stejná aplikace ve více prostředích by měla za normálních okolností udržovat jednotný stav a její spouštění a zastavování je třeba ovládat sjednoceně.

![](https://static-docs.nocobase.com/202512291842216.png)

### Spuštění aplikace

Vzhledem k tomu, že při spouštění aplikace může docházet k zápisu inicializačních dat do databáze, aplikace nasazené ve více prostředích se spouštějí postupně ve frontě, aby se předešlo souběhu (race conditions).

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy přístup k aplikaci

K pracovním aplikacím lze přistupovat přes proxy prostřednictvím podcesty `/apps/:appName/admin` vstupní aplikace.

![](https://static-docs.nocobase.com/202601082154230.png)

Pokud je aplikace nasazena ve více prostředích, je nutné určit cílové prostředí pro proxy přístup.

![](https://static-docs.nocobase.com/202601082155146.png)

Ve výchozím nastavení používá adresa proxy přístupu adresu pracovní aplikace odpovídající proměnné prostředí `ENVIRONMENT_URL`. Je nutné zajistit, aby tato adresa byla přístupná v síťovém prostředí, kde běží vstupní aplikace. Pokud potřebujete použít jinou adresu pro proxy přístup, můžete ji přepsat pomocí proměnné prostředí `ENVIRONMENT_PROXY_URL`.