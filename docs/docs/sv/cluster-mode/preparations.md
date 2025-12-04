:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Förberedelser

Innan ni driftsätter en klusterapplikation behöver ni slutföra följande förberedelser.

## Licens för kommersiella plugin

För att köra en NocoBase-applikation i klusterläge krävs stöd från följande plugin:

| Funktion                  | Plugin                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Cache-adapter             | Inbyggd                                                                             |
| Synkroniseringssignal-adapter | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Meddelandekö-adapter      | `@nocobase/plugin-queue-adapter-redis` eller `@nocobase/plugin-queue-adapter-rabbitmq` |
| Distribuerad lås-adapter  | `@nocobase/plugin-lock-adapter-redis`                                               |
| Worker ID-tilldelare      | `@nocobase/plugin-workerid-allocator-redis`                                         |

Se först till att ni har skaffat licenser för ovanstående plugin (ni kan köpa motsvarande plugin-licenser via den kommersiella plugin-tjänsteplattformen).

## Systemkomponenter

Utöver själva applikationsinstansen kan övriga systemkomponenter väljas av driftpersonalen, baserat på teamets specifika driftbehov.

### Databas

Eftersom det nuvarande klusterläget endast riktar sig mot applikationsinstanser, stöder databasen för närvarande endast en enskild nod. Om ni har en databasarkitektur som master-slave, behöver ni implementera detta själva via middleware och säkerställa att det är transparent för NocoBase-applikationen.

### Middleware

NocoBase:s klusterläge förlitar sig på viss middleware för att uppnå kommunikation och koordinering mellan kluster, inklusive:

- **Cache**: Använder Redis-baserad distribuerad cache-middleware för att förbättra dataåtkomsthastigheten.
- **Synkroniseringssignal**: Använder Redis stream-funktion för att implementera överföring av synkroniseringssignaler mellan kluster.
- **Meddelandekö**: Använder Redis- eller RabbitMQ-baserad meddelandekö-middleware för att implementera asynkron meddelandehantering.
- **Distribuerat lås**: Använder ett Redis-baserat distribuerat lås för att säkerställa säker åtkomst till delade resurser i klustret.

När alla middleware-komponenter använder Redis kan ni starta en enskild Redis-tjänst inom klustrets interna nätverk (eller Kubernetes). Alternativt kan ni aktivera en separat Redis-tjänst för varje funktion (cache, synkroniseringssignal, meddelandekö och distribuerat lås).

**Versionsrekommendationer**

- Redis: >=8.0 eller en redis-stack-version som inkluderar Bloom Filter-funktionen.
- RabbitMQ: >=4.0

### Delad lagring

NocoBase behöver använda `storage`-katalogen för att lagra systemrelaterade filer. I flernodsläge bör ni montera en molndisk (eller NFS) för att stödja delad åtkomst över flera noder. Annars kommer lokal lagring inte att synkroniseras automatiskt, och systemet kommer inte att fungera korrekt.

När ni driftsätter med Kubernetes, se [Kubernetes-driftsättning: Delad lagring](./kubernetes#delad-lagring) för mer information.

### Lastbalansering

Klusterläget kräver en lastbalanserare för att distribuera förfrågningar, samt för hälsokontroller och failover av applikationsinstanser. Denna del bör väljas och konfigureras av er själva, baserat på teamets driftbehov.

Som ett exempel med en egenhostad Nginx, lägg till följande innehåll i konfigurationsfilen:

```
upstream myapp {
    # Kan användas för sessionsbeständighet. När aktiverad skickas förfrågningar från samma klient alltid till samma backend-server.
    server 172.31.0.1:13000; # Intern nod 1
    server 172.31.0.2:13000; # Intern nod 2
    server 172.31.0.3:13000; # Intern nod 3
}

server {
    listen 80;

    location / {
        # Använd den definierade upstream för lastbalansering
        proxy_pass http://myapp;
        # ... övriga konfigurationer
    }
}
```

Detta innebär att förfrågningar omvänt proxys och distribueras till olika servernoder för bearbetning.

För lastbalanserings-middleware som tillhandahålls av andra molntjänstleverantörer, se den specifika leverantörens konfigurationsdokumentation.

## Konfiguration av miljövariabler

Alla noder i klustret bör använda samma konfiguration av miljövariabler. Utöver NocoBase:s grundläggande [miljövariabler](/api/cli/env) behöver ni även konfigurera följande middleware-relaterade miljövariabler.

### Flerkärnsläge

När applikationen körs på en flerkärnig nod kan ni aktivera nodens flerkärnsläge:

```ini
# Aktivera PM2 flerkärnsläge
# CLUSTER_MODE=max # Inaktiverad som standard, kräver manuell konfiguration
```

Om ni driftsätter applikations-pods i Kubernetes kan ni ignorera denna konfiguration och istället styra antalet applikationsinstanser via antalet pod-repliker.

### Cache

```ini
# Cache-adapter, måste ställas in till redis i klusterläge (standard är in-memory om inte angivet)
CACHE_DEFAULT_STORE=redis

# Anslutnings-URL för Redis cache-adapter, måste fyllas i
CACHE_REDIS_URL=
```

### Synkroniseringssignal

```ini
# Anslutnings-URL för Redis synkroniseringsadapter, standard är redis://localhost:6379/0 om inte angivet
PUBSUB_ADAPTER_REDIS_URL=
```

### Distribuerat lås

```ini
# Lås-adapter, måste ställas in till redis i klusterläge (standard är lokalt in-memory-lås om inte angivet)
LOCK_ADAPTER_DEFAULT=redis

# Anslutnings-URL för Redis lås-adapter, standard är redis://localhost:6379/0 om inte angivet
LOCK_ADAPTER_REDIS_URL=
```

### Meddelandekö

```ini
# Aktivera Redis som meddelandekö-adapter, standard är in-memory-adapter om inte angivet
QUEUE_ADAPTER=redis
# Anslutnings-URL för Redis meddelandekö-adapter, standard är redis://localhost:6379/0 om inte angivet
QUEUE_ADAPTER_REDIS_URL=
```

### Worker ID-tilldelare

Vissa system-samlingar i NocoBase använder globalt unika ID:n som primärnycklar. För att förhindra primärnyckelkonflikter i ett kluster måste varje applikationsinstans tilldelas ett unikt Worker ID via Worker ID-tilldelaren. Det nuvarande Worker ID-intervallet är 0–31, vilket innebär att varje applikation kan köra upp till 32 noder samtidigt. För mer information om designen av globalt unika ID:n, se [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# Redis anslutnings-URL för Worker ID-tilldelaren.
# Om den utelämnas tilldelas ett slumpmässigt Worker ID.
REDIS_URL=
```

:::info{title=Tips}
Vanligtvis kan de relaterade adaptrarna alla använda samma Redis-instans, men det är bäst att använda olika databaser för att undvika potentiella nyckelkonflikter, till exempel:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

För närvarande använder varje plugin sina egna Redis-relaterade miljövariabler. I framtiden kan vi överväga att enhetligt använda `REDIS_URL` som en standardkonfiguration.

:::

Om ni använder Kubernetes för att hantera klustret kan ni konfigurera ovanstående miljövariabler i en ConfigMap eller Secret. För mer relaterat innehåll, se [Kubernetes-driftsättning](./kubernetes).

När alla ovanstående förberedelser är klara kan ni fortsätta till [Driftprocesser](./operations) för att hantera applikationsinstanserna.