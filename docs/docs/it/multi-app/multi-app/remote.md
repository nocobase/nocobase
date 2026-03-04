---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/multi-app/multi-app/remote).
:::

# Modalità multi-ambiente

## Introduzione

Le multi-applicazioni in modalità memoria condivisa presentano vantaggi evidenti nel deployment e nella manutenzione, ma con l'aumento del numero di applicazioni e della complessità del business, una singola istanza può trovarsi gradualmente ad affrontare problemi come la contesa delle risorse e la riduzione della stabilità. Per questi scenari, gli utenti possono adottare una soluzione di deployment ibrido multi-ambiente per supportare requisiti aziendali più complessi.

In questa modalità, il sistema distribuisce un'applicazione di ingresso come centro di gestione e pianificazione unificato, distribuendo contemporaneamente più istanze di NocoBase come ambienti di runtime delle applicazioni indipendenti, responsabili dell'effettivo hosting delle applicazioni aziendali. Ogni ambiente è isolato dagli altri e lavora in modo collaborativo, distribuendo efficacemente la pressione della singola istanza e migliorando significativamente la stabilità, la scalabilità e la capacità di isolamento dei guasti del sistema.

A livello di deployment, i diversi ambienti possono essere eseguiti in processi indipendenti, distribuiti come diversi container Docker o sotto forma di più Deployment Kubernetes, adattandosi in modo flessibile a infrastrutture di diverse dimensioni e architetture.

## Deployment

Nella modalità di deployment ibrido multi-ambiente:

- L'applicazione di ingresso (Supervisor) è responsabile della gestione unificata delle informazioni sulle applicazioni e sugli ambienti.
- L'applicazione di lavoro (Worker) funge da effettivo ambiente di runtime del business.
- Le configurazioni delle applicazioni e degli ambienti vengono memorizzate nella cache tramite Redis.
- La sincronizzazione dei comandi e dello stato tra l'applicazione di ingresso e quella di lavoro dipende dalla comunicazione Redis.

Attualmente non è ancora disponibile la funzione di creazione dell'ambiente; ogni applicazione di lavoro deve essere distribuita manualmente e configurata con le informazioni sull'ambiente corrispondente prima di poter essere riconosciuta dall'applicazione di ingresso.

### Architettura delle dipendenze

Prima del deployment, prepari i seguenti servizi:

- Redis
  - Memorizza nella cache la configurazione delle applicazioni e degli ambienti.
  - Funge da canale di comunicazione dei comandi tra l'applicazione di ingresso e l'applicazione di lavoro.

- Database
  - Servizi di database a cui devono connettersi l'applicazione di ingresso e l'applicazione di lavoro.

### Applicazione di ingresso (Supervisor)

L'applicazione di ingresso funge da centro di gestione unificato, responsabile della creazione, dell'avvio, dell'arresto delle applicazioni e della pianificazione degli ambienti, nonché del proxy di accesso alle applicazioni.

Descrizione della configurazione delle variabili d'ambiente dell'applicazione di ingresso:

```bash
# Modalità applicazione
APP_MODE=supervisor
# Metodo di scoperta delle applicazioni
APP_DISCOVERY_ADAPTER=remote
# Metodo di gestione dei processi delle applicazioni
APP_PROCESS_ADAPTER=remote
# Redis per la cache della configurazione di applicazioni e ambienti
APP_SUPERVISOR_REDIS_URL=
# Metodo di comunicazione dei comandi dell'applicazione
APP_COMMAND_ADPATER=redis
# Redis per la comunicazione dei comandi dell'applicazione
APP_COMMAND_REDIS_URL=
```

### Applicazione di lavoro (Worker)

L'applicazione di lavoro funge da effettivo ambiente di runtime del business, responsabile dell'hosting e dell'esecuzione di istanze specifiche dell'applicazione NocoBase.

Descrizione della configurazione delle variabili d'ambiente dell'applicazione di lavoro:

```bash
# Modalità applicazione
APP_MODE=worker
# Metodo di scoperta delle applicazioni
APP_DISCOVERY_ADAPTER=remote
# Metodo di gestione dei processi delle applicazioni
APP_PROCESS_ADAPTER=local
# Redis per la cache della configurazione di applicazioni e ambienti
APP_SUPERVISOR_REDIS_URL=
# Metodo di comunicazione dei comandi dell'applicazione
APP_COMMAND_ADPATER=redis
# Redis per la comunicazione dei comandi dell'applicazione
APP_COMMAND_REDIS_URL=
# Identificatore dell'ambiente
ENVIRONMENT_NAME=
# URL di accesso all'ambiente
ENVIRONMENT_URL=
# URL di accesso proxy dell'ambiente
ENVIRONMENT_PROXY_URL=
```

### Esempio Docker Compose

Il seguente esempio mostra una soluzione di deployment ibrido multi-ambiente con container Docker come unità di runtime, distribuendo contemporaneamente un'applicazione di ingresso e due applicazioni di lavoro tramite Docker Compose.

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

## Manuale d'uso

Le operazioni di gestione di base delle applicazioni non differiscono dalla modalità a memoria condivisa; si prega di fare riferimento alla [Modalità memoria condivisa](./local.md). Questa sezione introduce principalmente i contenuti relativi alla configurazione multi-ambiente.

### Elenco degli ambienti

Al termine del deployment, acceda alla pagina "App Supervisor" dell'applicazione di ingresso; nella scheda "Ambienti" è possibile visualizzare l'elenco degli ambienti di lavoro registrati. Questo include informazioni come l'identificatore dell'ambiente, la versione dell'applicazione di lavoro, l'URL di accesso e lo stato. L'applicazione di lavoro invia un heartbeat ogni 2 minuti per garantire la disponibilità dell'ambiente.

![](https://static-docs.nocobase.com/202512291830371.png)

### Creazione dell'applicazione

Durante la creazione di un'applicazione, è possibile selezionare uno o più ambienti di runtime per specificare in quali applicazioni di lavoro verrà distribuita l'applicazione. In genere, si consiglia di selezionare un solo ambiente. Selezioni più ambienti solo quando l'applicazione di lavoro ha effettuato una [suddivisione dei servizi](/cluster-mode/services-splitting) ed è necessario distribuire la stessa applicazione in più ambienti di runtime per ottenere la ripartizione del carico o l'isolamento delle capacità.

![](https://static-docs.nocobase.com/202512291835086.png)

### Elenco delle applicazioni

La pagina dell'elenco delle applicazioni mostrerà l'ambiente di runtime corrente e le informazioni sullo stato di ogni applicazione. Se un'applicazione è distribuita in più ambienti, verranno visualizzati più stati di esecuzione. In condizioni normali, la stessa applicazione in più ambienti manterrà uno stato unificato e dovrà essere avviata e arrestata in modo coordinato.

![](https://static-docs.nocobase.com/202512291842216.png)

### Avvio dell'applicazione

Poiché l'avvio dell'applicazione può comportare la scrittura di dati di inizializzazione nel database, per evitare race condition in contesti multi-ambiente, l'avvio delle applicazioni distribuite in più ambienti avverrà in coda.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy di accesso alle applicazioni

Le applicazioni di lavoro possono essere accessibili tramite proxy attraverso il sotto-percorso `/apps/:appName/admin` dell'applicazione di ingresso.

![](https://static-docs.nocobase.com/202601082154230.png)

Se l'applicazione è distribuita in più ambienti, è necessario specificare un ambiente di destinazione per l'accesso proxy.

![](https://static-docs.nocobase.com/202601082155146.png)

Per impostazione predefinita, l'indirizzo di accesso proxy utilizza l'indirizzo di accesso dell'applicazione di lavoro, corrispondente alla variabile d'ambiente `ENVIRONMENT_URL`; si assicuri che tale indirizzo sia accessibile nell'ambiente di rete in cui si trova l'applicazione di ingresso. Se è necessario utilizzare un indirizzo di accesso proxy diverso, è possibile sovrascriverlo tramite la variabile d'ambiente `ENVIRONMENT_PROXY_URL`.