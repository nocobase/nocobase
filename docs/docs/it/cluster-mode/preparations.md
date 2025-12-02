:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Prerequisiti

Prima di implementare un'applicazione in modalità cluster, è necessario completare i seguenti prerequisiti.

## Licenza dei plugin commerciali

L'esecuzione di un'applicazione NocoBase in modalità cluster richiede il supporto dei seguenti plugin:

| Funzione                      | Plugin                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Adattatore cache              | Integrato                                                                           |
| Adattatore segnale di sincronizzazione | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Adattatore coda di messaggi   | `@nocobase/plugin-queue-adapter-redis` o `@nocobase/plugin-queue-adapter-rabbitmq` |
| Adattatore blocco distribuito | `@nocobase/plugin-lock-adapter-redis`                                               |
| Allocatore Worker ID          | `@nocobase/plugin-workerid-allocator-redis`                                         |

Innanzitutto, si assicuri di aver ottenuto le licenze per i plugin sopra elencati (può acquistare le licenze dei plugin corrispondenti tramite la piattaforma di servizi per i plugin commerciali).

## Componenti di sistema

Gli altri componenti di sistema, oltre all'istanza dell'applicazione stessa, possono essere scelti dal personale operativo in base alle esigenze del team.

### Database

Poiché l'attuale modalità cluster si applica solo alle istanze dell'applicazione, il database supporta temporaneamente un solo nodo. Se dispone di un'architettura di database come master-slave, dovrà implementarla autonomamente tramite middleware, assicurandosi che sia trasparente per l'applicazione NocoBase.

### Middleware

La modalità cluster di NocoBase si basa su alcuni middleware per realizzare la comunicazione e il coordinamento tra i cluster, tra cui:

- **Cache**: Usa un middleware di cache distribuita basato su Redis per migliorare la velocità di accesso ai dati.
- **Segnale di sincronizzazione**: Utilizza la funzionalità stream di Redis per implementare la trasmissione dei segnali di sincronizzazione tra i cluster.
- **Coda di messaggi**: Utilizza un middleware di coda di messaggi basato su Redis o RabbitMQ per implementare l'elaborazione asincrona dei messaggi.
- **Blocco distribuito**: Utilizza un blocco distribuito basato su Redis per garantire la sicurezza dell'accesso alle risorse condivise nel cluster.

Quando tutti i componenti middleware utilizzano Redis, è possibile avviare un singolo servizio Redis all'interno della rete interna del cluster (o Kubernetes). In alternativa, è possibile abilitare un servizio Redis separato per ciascuna funzione (cache, segnale di sincronizzazione, coda di messaggi e blocco distribuito).

**Versioni consigliate**

- Redis: >=8.0 o una versione di redis-stack che includa la funzionalità Bloom Filter.
- RabbitMQ: >=4.0

### Archiviazione condivisa

NocoBase richiede l'utilizzo della directory `storage` per memorizzare i file di sistema. In modalità multi-nodo, è necessario montare un disco cloud (o NFS) per supportare l'accesso condiviso tra più nodi. In caso contrario, l'archiviazione locale non verrà sincronizzata automaticamente e non funzionerà correttamente.

Quando si implementa con Kubernetes, si prega di fare riferimento alla sezione [Implementazione Kubernetes: Archiviazione condivisa](./kubernetes#shared-storage).

### Bilanciamento del carico

La modalità cluster richiede un bilanciatore del carico per distribuire le richieste, nonché per i controlli di integrità e il failover delle istanze dell'applicazione. Questa parte deve essere selezionata e configurata in base alle esigenze operative del team.

Prendendo Nginx auto-ospitato come esempio, aggiunga il seguente contenuto al file di configurazione:

```
upstream myapp {
    # ip_hash; # Può essere utilizzato per la persistenza della sessione. Quando abilitato, le richieste dallo stesso client vengono sempre inviate allo stesso server backend.
    server 172.31.0.1:13000; # Nodo interno 1
    server 172.31.0.2:13000; # Nodo interno 2
    server 172.31.0.3:13000; # Nodo interno 3
}

server {
    listen 80;

    location / {
        # Utilizza l'upstream definito per il bilanciamento del carico
        proxy_pass http://myapp;
        # ... altre configurazioni
    }
}
```

Ciò significa che le richieste vengono instradate tramite proxy inverso e distribuite a diversi nodi server per l'elaborazione.

Per i middleware di bilanciamento del carico forniti da altri provider di servizi cloud, si prega di fare riferimento alla documentazione di configurazione fornita dal provider specifico.

## Configurazione delle variabili d'ambiente

Tutti i nodi nel cluster dovrebbero utilizzare la stessa configurazione delle variabili d'ambiente. Oltre alle [variabili d'ambiente](/api/cli/env) di base di NocoBase, è necessario configurare anche le seguenti variabili d'ambiente relative al middleware.

### Modalità multi-core

Quando l'applicazione viene eseguita su un nodo multi-core, è possibile abilitare la modalità multi-core del nodo:

```ini
# Abilita la modalità multi-core di PM2
# CLUSTER_MODE=max # Disabilitato per impostazione predefinita, richiede configurazione manuale
```

Se sta implementando pod dell'applicazione in Kubernetes, può ignorare questa configurazione e controllare il numero di istanze dell'applicazione tramite il numero di repliche del pod.

### Cache

```ini
# Adattatore cache, in modalità cluster deve essere impostato su redis (se non specificato, predefinito è in-memory)
CACHE_DEFAULT_STORE=redis

# URL di connessione dell'adattatore cache Redis, deve essere compilato
CACHE_REDIS_URL=
```

### Segnale di sincronizzazione

```ini
# URL di connessione dell'adattatore di sincronizzazione Redis, se non specificato, il predefinito è redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

### Blocco distribuito

```ini
# Adattatore blocco, in modalità cluster deve essere impostato su redis (se non specificato, il predefinito è blocco locale in-memory)
LOCK_ADAPTER_DEFAULT=redis

# URL di connessione dell'adattatore blocco Redis, se non specificato, il predefinito è redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

### Coda di messaggi

```ini
# Abilita Redis come adattatore per la coda di messaggi (se non specificato, il predefinito è adattatore in-memory)
QUEUE_ADAPTER=redis
# URL di connessione dell'adattatore per la coda di messaggi Redis, se non specificato, il predefinito è redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

### Allocatore Worker ID

Alcune `collezioni` di sistema in NocoBase utilizzano ID globalmente univoci come chiavi primarie. Per prevenire conflitti di chiavi primarie in un cluster, ogni istanza dell'applicazione deve ottenere un Worker ID univoco tramite l'Allocatore Worker ID. L'attuale intervallo di Worker ID è 0-31, il che significa che ogni applicazione può eseguire fino a 32 nodi contemporaneamente. Per i dettagli sulla progettazione dell'ID globalmente univoco, si faccia riferimento a [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# URL di connessione Redis per l'Allocatore Worker ID.
# Se omesso, verrà assegnato un Worker ID casuale.
REDIS_URL=
```

:::info{title=Suggerimento}
Di solito, gli adattatori correlati possono tutti utilizzare la stessa istanza Redis, ma è preferibile utilizzare database diversi per evitare potenziali problemi di conflitto di chiavi, ad esempio:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Attualmente, ogni `plugin` utilizza le proprie variabili d'ambiente relative a Redis. In futuro, si potrebbe considerare di unificare l'uso di `REDIS_URL` come configurazione di fallback.

:::

Se utilizza Kubernetes per gestire il cluster, può configurare le variabili d'ambiente sopra menzionate in un ConfigMap o Secret. Per maggiori dettagli, può fare riferimento a [Implementazione Kubernetes](./kubernetes).

Una volta completati tutti i prerequisiti sopra elencati, può procedere con le [Operazioni](./operations) per continuare a gestire le istanze dell'applicazione.