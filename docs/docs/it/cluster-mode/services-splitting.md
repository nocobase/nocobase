:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Suddivisione dei Servizi <Badge>v1.9.0+</Badge>

## Introduzione

Normalmente, tutti i servizi di un'applicazione NocoBase vengono eseguiti nella stessa istanza Node.js. Man mano che le funzionalità dell'applicazione diventano più complesse con la crescita del business, alcuni servizi che richiedono molto tempo potrebbero influire sulle prestazioni complessive.

Per migliorare le prestazioni dell'applicazione, NocoBase supporta la suddivisione dei servizi dell'applicazione per eseguirli su nodi diversi in modalità cluster. Ciò evita che problemi di prestazioni di un singolo servizio influiscano sull'intera applicazione, impedendole di rispondere correttamente alle richieste degli utenti.

D'altra parte, consente anche di scalare orizzontalmente in modo mirato solo alcuni servizi, migliorando l'utilizzo delle risorse del cluster.

Quando si distribuisce NocoBase in un cluster, i diversi servizi possono essere suddivisi e distribuiti per essere eseguiti su nodi diversi. Il seguente diagramma illustra la struttura di suddivisione:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Quali Servizi Possono Essere Suddivisi

### Flusso di lavoro asincrono

**Service KEY**: `workflow:process`

I flussi di lavoro in modalità asincrona, una volta attivati, verranno accodati per l'esecuzione. Questi flussi di lavoro possono essere considerati attività in background e di solito gli utenti non devono attendere il ritorno dei risultati. Soprattutto per processi complessi e che richiedono molto tempo, con un elevato volume di attivazioni, si consiglia di suddividerli per eseguirli su nodi indipendenti.

### Altre attività asincrone a livello utente

**Service KEY**: `async-task:process`

Ciò include attività create da azioni dell'utente come l'importazione e l'esportazione asincrona. In caso di grandi volumi di dati o elevata concorrenza, si consiglia di suddividerle per eseguirle su nodi indipendenti.

## Come Suddividere i Servizi

La suddivisione di diversi servizi su nodi differenti si ottiene configurando la variabile d'ambiente `WORKER_MODE`. Questa variabile d'ambiente può essere configurata seguendo queste regole:

- `WORKER_MODE=<vuoto>`: Quando non configurato o impostato su vuoto, la modalità di lavoro è la stessa dell'attuale istanza singola: accetta tutte le richieste e gestisce tutte le attività. Compatibile con le applicazioni non configurate in precedenza.
- `WORKER_MODE=!` : La modalità di lavoro consiste nell'elaborare solo le richieste, senza gestire alcuna attività.
- `WORKER_MODE=workflow:process,async-task:process`: Configurato con uno o più identificatori di servizio (separati da virgole), la modalità di lavoro consiste nell'elaborare solo le attività di tali identificatori, senza gestire le richieste.
- `WORKER_MODE=*`: La modalità di lavoro consiste nell'elaborare tutte le attività in background, indipendentemente dal modulo, ma senza gestire le richieste.
- `WORKER_MODE=!,workflow:process`: La modalità di lavoro consiste nell'elaborare le richieste e, contemporaneamente, solo le attività di un identificatore specifico.
- `WORKER_MODE=-`: La modalità di lavoro consiste nel non elaborare alcuna richiesta o attività (questa modalità è necessaria all'interno del processo worker).

Ad esempio, in un ambiente K8S, i nodi con la stessa funzionalità di suddivisione possono utilizzare la stessa configurazione della variabile d'ambiente, rendendo facile scalare orizzontalmente un tipo specifico di servizio.

## Esempi di Configurazione

### Più Nodi con Elaborazione Separata

Supponiamo di avere tre nodi: `node1`, `node2` e `node3`. Possono essere configurati come segue:

- `node1`: Elabora solo le richieste dell'interfaccia utente, configurare `WORKER_MODE=!`.
- `node2`: Elabora solo le attività dei flussi di lavoro, configurare `WORKER_MODE=workflow:process`.
- `node3`: Elabora solo le attività asincrone, configurare `WORKER_MODE=async-task:process`.

### Più Nodi con Elaborazione Mista

Supponiamo di avere quattro nodi: `node1`, `node2`, `node3` e `node4`. Possono essere configurati come segue:

- `node1` e `node2`: Elaborano tutte le richieste regolari, configurare `WORKER_MODE=!`, e un bilanciatore di carico distribuirà automaticamente le richieste a questi due nodi.
- `node3` e `node4`: Elaborano tutte le altre attività in background, configurare `WORKER_MODE=*`.

## Riferimento per gli Sviluppatori

Quando si sviluppano `plugin` aziendali, è possibile suddividere i servizi che consumano risorse significative in base ai requisiti dello scenario. Questo può essere realizzato nei seguenti modi:

1.  Definire un nuovo identificatore di servizio, ad esempio `my-plugin:process`, per la configurazione della variabile d'ambiente e fornire la relativa documentazione.
2.  Nella logica di business lato server del `plugin`, utilizzare l'interfaccia `app.serving()` per verificare l'ambiente e determinare se il nodo corrente debba fornire un servizio specifico in base alla variabile d'ambiente.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Nel codice lato server del plugin
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Elabora la logica di business per questo servizio
} else {
  // Non elabora la logica di business per questo servizio
}
```