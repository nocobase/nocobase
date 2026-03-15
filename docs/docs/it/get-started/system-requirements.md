:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/get-started/system-requirements).
:::

# Requisiti di sistema

I requisiti di sistema descritti in questo documento si riferiscono esclusivamente al **servizio applicativo NocoBase stesso** e coprono le risorse di calcolo e memoria necessarie per i processi dell'applicazione. **Non includono i servizi di terze parti dipendenti**, inclusi, a titolo esemplificativo ma non esaustivo:

- API gateway / proxy inverso
- Servizi di database (ad esempio MySQL, PostgreSQL)
- Servizi di cache (ad esempio Redis)
- Middleware come code di messaggi, storage di oggetti, ecc.

Ad eccezione dei casi di verifica delle funzionalità o scenari puramente sperimentali, **si raccomanda vivamente di distribuire i suddetti servizi di terze parti in modo indipendente** su server o container separati, oppure di utilizzare direttamente i relativi servizi cloud.

La configurazione del sistema e la pianificazione della capacità per tali servizi devono essere valutate e ottimizzate separatamente in base al **volume effettivo dei dati, al carico di lavoro e alla scala di concorrenza**.

## Modalità di distribuzione a nodo singolo

La modalità di distribuzione a nodo singolo indica che il servizio applicativo NocoBase viene eseguito su un unico server o istanza di container.

### Requisiti hardware minimi

| Risorsa | Requisito |
|---|---|
| CPU | 1 core |
| Memoria | 2 GB |

**Scenari applicabili**:

- Micro-imprese
- Proof of Concept (POC)
- Ambienti di sviluppo / test
- Scenari con accesso simultaneo quasi nullo

:::info{title=Suggerimento}

- Questa configurazione garantisce solo che il sistema sia avviabile, non garantisce le prestazioni.
- All'aumentare del volume dei dati o delle richieste simultanee, le risorse di sistema potrebbero diventare rapidamente un collo di bottiglia.
- Per gli scenari di **sviluppo del codice sorgente, sviluppo di plugin o compilazione e distribuzione dal codice sorgente**, si consiglia di riservare **almeno 4 GB di memoria libera** per garantire che l'installazione delle dipendenze, la compilazione e i processi di build vengano completati con successo.

:::

### Requisiti hardware raccomandati

| Risorsa | Configurazione raccomandata |
|---|---|
| CPU | 2 core |
| Memoria | ≥ 4 GB |

**Scenari applicabili**:

Adatto per attività di piccole e medie dimensioni e ambienti di produzione con un volume limitato di accessi simultanei.

:::info{title=Suggerimento}

- Con questa configurazione, il sistema è in grado di soddisfare le normali operazioni di amministrazione e carichi di lavoro aziendali leggeri.
- Quando la complessità aziendale, gli accessi simultanei o le attività in background aumentano, è opportuno considerare l'aggiornamento delle specifiche hardware o il passaggio alla modalità cluster.

:::

## Modalità Cluster

La modalità cluster è progettata per scenari aziendali di medie e grandi dimensioni con elevata concorrenza; è possibile migliorare la disponibilità del sistema e il throughput aziendale tramite l'espansione orizzontale (per i dettagli, consultare: [Modalità Cluster](/cluster-mode)).

### Requisiti hardware dei nodi

In modalità cluster, si consiglia che la configurazione hardware di ogni nodo applicativo (Pod / istanza) sia coerente con la modalità di distribuzione a nodo singolo.

**Configurazione minima per singolo nodo:**

- CPU: 1 core
- Memoria: 2 GB

**Configurazione raccomandata per singolo nodo:**

- CPU: 2 core
- Memoria: 4 GB

### Pianificazione del numero di nodi

- Il numero di nodi nel cluster può essere esteso in base alle necessità (2–N).
- Il numero effettivo di nodi necessari dipende da:
  - Volume di accessi simultanei
  - Complessità della logica aziendale
  - Carico delle attività in background e dell'elaborazione asincrona
  - Capacità di risposta dei servizi esterni dipendenti

Si consiglia, in ambienti di produzione, di:

- Regolare dinamicamente la scala dei nodi combinando le metriche di monitoraggio (CPU, memoria, latenza delle richieste, ecc.).
- Riservare una certa ridondanza di risorse per far fronte alle fluttuazioni del traffico.