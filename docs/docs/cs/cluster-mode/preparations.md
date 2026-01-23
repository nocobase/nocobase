:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Příprava

Před nasazením clusterové aplikace je potřeba dokončit následující přípravy.

## Licence komerčních pluginů

Pro provoz aplikace NocoBase v clusterovém režimu je vyžadována podpora následujících pluginů:

| Funkce                  | Plugin                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Adaptér mezipaměti      | Vestavěný                                                                           |
| Adaptér pro synchronizační signály | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Adaptér fronty zpráv    | `@nocobase/plugin-queue-adapter-redis` nebo `@nocobase/plugin-queue-adapter-rabbitmq` |
| Adaptér distribuovaného zámku | `@nocobase/plugin-lock-adapter-redis`                                               |
| Alokátor Worker ID      | `@nocobase/plugin-workerid-allocator-redis`                                         |

Nejprve se prosím ujistěte, že jste získali licence pro výše uvedené pluginy (příslušné licence pluginů si můžete zakoupit prostřednictvím platformy služeb pro komerční pluginy).

## Systémové komponenty

Ostatní systémové komponenty, kromě samotné instance aplikace, si mohou provozní pracovníci vybrat sami na základě provozních potřeb týmu.

### Databáze

Jelikož současný clusterový režim cílí pouze na instance aplikací, databáze prozatím podporuje pouze jeden uzel. Pokud máte databázovou architekturu typu master-slave, musíte ji implementovat sami prostřednictvím middleware a zajistit, aby byla pro aplikaci NocoBase transparentní.

### Middleware

Clusterový režim NocoBase se spoléhá na některé middleware pro zajištění komunikace a koordinace mezi clustery, včetně:

- **Mezipaměť**: Využívá distribuovaný middleware mezipaměti založený na Redis pro zvýšení rychlosti přístupu k datům.
- **Synchronizační signál**: Využívá funkci streamu Redis k implementaci přenosu synchronizačních signálů mezi clustery.
- **Fronta zpráv**: Využívá middleware fronty zpráv založený na Redis nebo RabbitMQ k implementaci asynchronního zpracování zpráv.
- **Distribuovaný zámek**: Využívá distribuovaný zámek založený na Redis k zajištění bezpečného přístupu ke sdíleným zdrojům v clusteru.

Pokud všechny komponenty middleware používají Redis, můžete spustit jednu službu Redis v interní síti clusteru (nebo v Kubernetes). Alternativně můžete pro každou funkci (mezipaměť, synchronizační signál, fronta zpráv a distribuovaný zámek) povolit samostatnou službu Redis.

**Doporučení k verzím**

- Redis: >=8.0 nebo verze redis-stack, která zahrnuje funkci Bloom Filter.
- RabbitMQ: >=4.0

### Sdílené úložiště

NocoBase potřebuje používat adresář `storage` pro ukládání souborů souvisejících se systémem. V režimu více uzlů byste měli připojit cloudový disk (nebo NFS), aby byl podporován sdílený přístup napříč více uzly. V opačném případě se lokální úložiště nebude automaticky synchronizovat a nebude správně fungovat.

Při nasazování s Kubernetes se prosím podívejte na kapitolu [Nasazení Kubernetes: Sdílené úložiště](./kubernetes#共享存储).

### Vyrovnávání zátěže

Clusterový režim vyžaduje vyrovnávač zátěže pro distribuci požadavků, stejně jako pro kontroly stavu a převzetí služeb při selhání instancí aplikací. Tuto část byste měli vybrat a nakonfigurovat podle provozních potřeb týmu.

Vezměme si jako příklad vlastní Nginx; do konfiguračního souboru přidejte následující obsah:

```
upstream myapp {
    # ip_hash; # Lze použít pro udržení relace. Po aktivaci jsou požadavky od stejného klienta vždy odesílány na stejný backend server.
    server 172.31.0.1:13000; # Interní uzel 1
    server 172.31.0.2:13000; # Interní uzel 2
    server 172.31.0.3:13000; # Interní uzel 3
}

server {
    listen 80;

    location / {
        # Použijte definovaný upstream pro vyrovnávání zátěže
        proxy_pass http://myapp;
        # ... další konfigurace
    }
}
```

To znamená, že požadavky jsou reverzně proxyovány a distribuovány na různé serverové uzly ke zpracování.

Pro middleware vyrovnávání zátěže poskytovaný jinými poskytovateli cloudových služeb se prosím podívejte na konfigurační dokumentaci poskytnutou konkrétním poskytovatelem.

## Konfigurace proměnných prostředí

Všechny uzly v clusteru by měly používat stejnou konfiguraci proměnných prostředí. Kromě základních [proměnných prostředí](/api/cli/env) NocoBase je také potřeba nakonfigurovat následující proměnné prostředí související s middleware.

### Vícejádrový režim

Když aplikace běží na vícejádrovém uzlu, můžete povolit vícejádrový režim uzlu:

```ini
# Povolit vícejádrový režim PM2
# CLUSTER_MODE=max # Ve výchozím nastavení je zakázáno, vyžaduje ruční konfiguraci
```

Pokud nasazujete pody aplikací v Kubernetes, můžete tuto konfiguraci ignorovat a řídit počet instancí aplikací prostřednictvím počtu replik podů.

### Mezipaměť

```ini
# Adaptér mezipaměti, v clusterovém režimu je potřeba nastavit na redis (pokud není vyplněno, výchozí je paměť)
CACHE_DEFAULT_STORE=redis

# Adresa připojení adaptéru mezipaměti Redis, je potřeba ji aktivně vyplnit
CACHE_REDIS_URL=
```

### Synchronizační signál

```ini
# Adresa připojení synchronizačního adaptéru Redis, pokud není vyplněno, výchozí je redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

### Distribuovaný zámek

```ini
# Adaptér zámku, v clusterovém režimu je potřeba nastavit na redis (pokud není vyplněno, výchozí je lokální zámek v paměti)
LOCK_ADAPTER_DEFAULT=redis

# Adresa připojení adaptéru zámku Redis, pokud není vyplněno, výchozí je redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

### Fronta zpráv

```ini
# Povolit Redis jako adaptér fronty zpráv, pokud není vyplněno, výchozí je adaptér v paměti
QUEUE_ADAPTER=redis
# Adresa připojení adaptéru fronty zpráv Redis, pokud není vyplněno, výchozí je redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

### Alokátor Worker ID

Jelikož některé systémové kolekce v NocoBase používají globálně unikátní ID jako primární klíče, je potřeba zajistit, aby každá instance aplikace v clusteru získala unikátní Worker ID prostřednictvím Alokátoru Worker ID, a tím se předešlo problémům s konflikty primárních klíčů. Aktuální rozsah Worker ID je 0–31, což znamená, že stejná aplikace může současně běžet na maximálně 32 uzlech. Podrobnosti o návrhu globálně unikátního ID naleznete v [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# Adresa připojení Redis pro Alokátor Worker ID. Pokud není vyplněno, bude Worker ID přiděleno náhodně.
REDIS_URL=
```

:::info{title=Tip}
Obvykle mohou všechny související adaptéry používat stejnou instanci Redis, ale je nejlepší používat různé databáze, aby se předešlo potenciálním problémům s konflikty klíčů, například:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

V současné době každý plugin používá vlastní proměnné prostředí související s Redis. V budoucnu zvážíme sjednocení a použití `REDIS_URL` jako záložní konfigurace.

:::

Pokud používáte Kubernetes pro správu clusteru, můžete výše uvedené proměnné prostředí nakonfigurovat v ConfigMap nebo Secret. Další související informace naleznete v [Nasazení Kubernetes](./kubernetes).

Po dokončení všech výše uvedených příprav můžete přejít na [Provozní postupy](./operations) a pokračovat ve správě instancí aplikací.