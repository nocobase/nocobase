:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Voorbereidingen

Voordat u een clusterapplicatie implementeert, moet u de volgende voorbereidingen treffen.

## Licentie voor commerciële plugins

Om een NocoBase-applicatie in clustermodus te kunnen draaien, is ondersteuning van de volgende plugins vereist:

| Functie                   | Plugin                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Cache-adapter             | Ingebouwd                                                                           |
| Synchronisatiesignaal-adapter | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Message queue-adapter     | `@nocobase/plugin-queue-adapter-redis` of `@nocobase/plugin-queue-adapter-rabbitmq` |
| Distributed lock-adapter  | `@nocobase/plugin-lock-adapter-redis`                                               |
| Worker ID-allocator       | `@nocobase/plugin-workerid-allocator-redis`                                         |

Zorg er eerst voor dat u de licenties voor de bovenstaande plugins hebt verkregen (u kunt de bijbehorende pluginlicenties aanschaffen via het commerciële plugin serviceplatform).

## Systeemcomponenten

Andere systeemcomponenten, naast de applicatie-instantie zelf, kunnen door het operationele personeel worden gekozen op basis van de operationele behoeften van het team.

### Database

Aangezien de huidige clustermodus alleen gericht is op applicatie-instanties, ondersteunt de database momenteel slechts één knooppunt. Als u een database-architectuur zoals master-slave heeft, moet u deze zelf implementeren via middleware en ervoor zorgen dat deze transparant is voor de NocoBase-applicatie.

### Middleware

De clustermodus van NocoBase is afhankelijk van bepaalde middleware voor communicatie en coördinatie tussen clusters, waaronder:

- **Cache**: Maakt gebruik van Redis-gebaseerde gedistribueerde cache-middleware om de snelheid van gegevenstoegang te verbeteren.
- **Synchronisatiesignaal**: Maakt gebruik van de stream-functionaliteit van Redis om synchronisatiesignalen tussen clusters te verzenden.
- **Message queue**: Maakt gebruik van Redis- of RabbitMQ-gebaseerde message queue-middleware om asynchrone berichtverwerking te realiseren.
- **Gedistribueerde lock**: Maakt gebruik van een Redis-gebaseerde gedistribueerde lock om de veilige toegang tot gedeelde bronnen binnen het cluster te garanderen.

Wanneer alle middleware-componenten Redis gebruiken, kunt u één enkele Redis-service starten binnen het interne netwerk van het cluster (of Kubernetes). U kunt er ook voor kiezen om voor elke functie (cache, synchronisatiesignaal, message queue en gedistribueerde lock) een afzonderlijke Redis-service in te schakelen.

**Versieaanbevelingen**

- Redis: >=8.0 of een redis-stack-versie die de Bloom Filter-functionaliteit bevat.
- RabbitMQ: >=4.0

### Gedeelde opslag

NocoBase moet de `storage`-directory gebruiken om systeemgerelateerde bestanden op te slaan. In een multi-node modus moet u een clouddisk (of NFS) koppelen om gedeelde toegang over meerdere knooppunten te ondersteunen. Anders wordt lokale opslag niet automatisch gesynchroniseerd en zal deze niet correct functioneren.

Wanneer u implementeert met Kubernetes, raadpleeg dan de sectie [Kubernetes-implementatie: Gedeelde opslag](./kubernetes#shared-storage).

### Load balancing

De clustermodus vereist een load balancer voor het distribueren van verzoeken, evenals voor gezondheidscontroles en failover van applicatie-instanties. Dit onderdeel moet worden gekozen en geconfigureerd op basis van de operationele behoeften van het team.

Als voorbeeld van een zelf gehoste Nginx, voegt u de volgende inhoud toe aan het configuratiebestand:

```
upstream myapp {
    # ip_hash; # Kan worden gebruikt voor sessiepersistentie. Indien ingeschakeld, worden verzoeken van dezelfde client altijd naar dezelfde backend-server gestuurd.
    server 172.31.0.1:13000; # Intern knooppunt 1
    server 172.31.0.2:13000; # Intern knooppunt 2
    server 172.31.0.3:13000; # Intern knooppunt 3
}

server {
    listen 80;

    location / {
        # Gebruik de gedefinieerde upstream voor load balancing
        proxy_pass http://myapp;
        # ... andere configuraties
    }
}
```

Dit betekent dat verzoeken via een reverse proxy worden gedistribueerd naar verschillende serverknooppunten voor verwerking.

Voor load balancing-middleware die door andere cloudserviceproviders wordt aangeboden, raadpleegt u de configuratiedocumentatie van de specifieke provider.

## Omgevingsvariabelen configureren

Alle knooppunten in het cluster moeten dezelfde configuratie van omgevingsvariabelen gebruiken. Naast de basis [omgevingsvariabelen](/api/cli/env) van NocoBase, moeten ook de volgende middleware-gerelateerde omgevingsvariabelen worden geconfigureerd.

### Multi-core modus

Wanneer de applicatie op een multi-core knooppunt draait, kunt u de multi-core modus van het knooppunt inschakelen:

```ini
# Schakel PM2 multi-core modus in
# CLUSTER_MODE=max # Standaard uitgeschakeld, vereist handmatige configuratie
```

Als u applicatie-pods implementeert in Kubernetes, kunt u deze configuratie negeren en het aantal applicatie-instanties regelen via het aantal pod-replica's.

### Cache

```ini
# Cache-adapter, moet in clustermodus worden ingesteld op redis (standaard is in-memory indien niet ingevuld)
CACHE_DEFAULT_STORE=redis

# Redis cache-adapter verbindings-URL, moet handmatig worden ingevuld
CACHE_REDIS_URL=
```

### Synchronisatiesignaal

```ini
# Redis synchronisatie-adapter verbindings-URL, standaard is redis://localhost:6379/0 indien niet ingevuld
PUBSUB_ADAPTER_REDIS_URL=
```

### Gedistribueerde lock

```ini
# Lock-adapter, moet in clustermodus worden ingesteld op redis (standaard is in-memory lokale lock indien niet ingevuld)
LOCK_ADAPTER_DEFAULT=redis

# Redis lock-adapter verbindings-URL, standaard is redis://localhost:6379/0 indien niet ingevuld
LOCK_ADAPTER_REDIS_URL=
```

### Message queue

```ini
# Schakel Redis in als de message queue-adapter (standaard is in-memory adapter indien niet ingevuld)
QUEUE_ADAPTER=redis
# Redis message queue-adapter verbindings-URL, standaard is redis://localhost:6379/0 indien niet ingevuld
QUEUE_ADAPTER_REDIS_URL=
```

### Worker ID-allocator

Aangezien sommige systeemcollecties in NocoBase globaal unieke ID's als primaire sleutels gebruiken, moet elk applicatie-instantie een unieke Worker ID krijgen via de Worker ID-allocator om conflicten met primaire sleutels binnen een cluster te voorkomen. Het huidige bereik voor Worker ID's is 0-31, wat betekent dat dezelfde applicatie maximaal 32 knooppunten tegelijkertijd kan ondersteunen. Voor meer details over het ontwerp van globaal unieke ID's, zie [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id)

```ini
# Redis verbindings-URL voor de Worker ID-allocator. Indien weggelaten, wordt een willekeurige Worker ID toegewezen.
REDIS_URL=
```

:::info{title=Tip}
Gewoonlijk kunnen de gerelateerde adapters allemaal dezelfde Redis-instantie gebruiken, maar het is het beste om verschillende databases te gebruiken om mogelijke sleutelconflicten te voorkomen, bijvoorbeeld:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Momenteel gebruikt elke plugin zijn eigen Redis-gerelateerde omgevingsvariabelen. In de toekomst overwegen we om `REDIS_URL` uniform te gebruiken als fallback-configuratie.

:::

Als u Kubernetes gebruikt om het cluster te beheren, kunt u de bovengenoemde omgevingsvariabelen configureren in een ConfigMap of Secret. Voor meer gerelateerde inhoud kunt u [Kubernetes-implementatie](./kubernetes) raadplegen.

Nadat alle bovenstaande voorbereidingen zijn voltooid, kunt u doorgaan naar de [operationele procedures](./operations) om de applicatie-instanties verder te beheren.