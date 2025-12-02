:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Logger

NocoBase Le offre un sistema di logging ad alte prestazioni basato su [pino](https://github.com/pinojs/pino). Ovunque Lei abbia accesso a un `context`, può ottenere un'istanza del logger tramite `ctx.logger` per registrare i log chiave durante l'esecuzione di un **plugin** o del sistema.

## Utilizzo di Base

```ts
// Registra errori fatali (es. fallimento dell'inizializzazione)
ctx.logger.fatal('Application initialization failed', { error });

// Registra errori generici (es. errori nelle richieste API)
ctx.logger.error('Data loading failed', { status, message });

// Registra avvisi (es. rischi di performance o operazioni utente anomale)
ctx.logger.warn('Current form contains unsaved changes');

// Registra informazioni generali di runtime (es. componente caricato)
ctx.logger.info('User profile component loaded');

// Registra informazioni di debug (es. cambiamenti di stato)
ctx.logger.debug('Current user state', { user });

// Registra informazioni di traccia dettagliate (es. flusso di rendering)
ctx.logger.trace('Component rendered', { component: 'UserProfile' });
```

Questi metodi corrispondono a diversi livelli di log (dal più alto al più basso):

| Livello   | Metodo              | Descrizione |
| --------- | ------------------- | ----------- |
| `fatal` | `ctx.logger.fatal()` | Errori fatali, che di solito causano l'uscita del programma |
| `error` | `ctx.logger.error()` | Log di errore, che indicano il fallimento di una richiesta o operazione |
| `warn`  | `ctx.logger.warn()`  | Informazioni di avviso, che segnalano potenziali rischi o situazioni inattese |
| `info`  | `ctx.logger.info()`  | Informazioni di runtime regolari |
| `debug` | `ctx.logger.debug()` | Informazioni di debug per l'ambiente di sviluppo |
| `trace` | `ctx.logger.trace()` | Informazioni di traccia dettagliate, solitamente per diagnosi approfondite |

## Formato dei Log

Ogni output di log è in formato JSON strutturato e contiene i seguenti campi per impostazione predefinita:

| Campo     | Tipo   | Descrizione |
| --------- | ------ | ----------- |
| `level`   | number | Livello del log   |
| `time`    | number | Timestamp (millisecondi) |
| `pid`     | number | ID processo  |
| `hostname` | string | Nome host    |
| `msg`     | string | Messaggio del log |
| Altri    | object | Informazioni di contesto personalizzate |

Esempio di output:

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Binding del Contesto

`ctx.logger` inietta automaticamente le informazioni di contesto, come il **plugin** corrente, il modulo o la fonte della richiesta, consentendo ai log di tracciare l'origine in modo più accurato.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Esempio di output (con contesto):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Logger Personalizzato

Può creare istanze di logger personalizzate nei **plugin**, ereditando o estendendo le configurazioni predefinite:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

I logger figli ereditano la configurazione del logger principale e allegano automaticamente il contesto.

## Gerarchia dei Livelli di Log

I livelli di log di Pino seguono una definizione numerica dal più alto al più basso, dove numeri più piccoli indicano una priorità inferiore.  
Di seguito è riportata la tabella completa della gerarchia dei livelli di log:

| Nome Livello | Valore | Nome Metodo | Descrizione |
| ---------- | ----- | ----------- | ----------- |
| `fatal`    | 60    | `logger.fatal()` | Errori fatali, che di solito impediscono al programma di continuare l'esecuzione |
| `error`    | 50    | `logger.error()` | Errori generici, che indicano il fallimento di una richiesta o eccezioni operative |
| `warn`     | 40    | `logger.warn()` | Informazioni di avviso, che segnalano potenziali rischi o situazioni inattese |
| `info`     | 30    | `logger.info()` | Informazioni generali, che registrano lo stato del sistema o operazioni normali |
| `debug`    | 20    | `logger.debug()` | Informazioni di debug per l'analisi dei problemi in fase di sviluppo |
| `trace`    | 10    | `logger.trace()` | Informazioni di traccia dettagliate per una diagnosi approfondita |
| `silent`   | -Infinity | (nessun metodo corrispondente) | Disattiva tutti gli output di log |

Pino emette solo i log con un livello maggiore o uguale alla configurazione `level` attuale. Ad esempio, quando il livello di log è `info`, i log di `debug` e `trace` verranno ignorati.

## Best Practice nello Sviluppo di **Plugin**

1.  **Utilizzi il Logger di Contesto**  
    Utilizzi `ctx.logger` nei contesti di **plugin**, modello o applicazione per includere automaticamente le informazioni sull'origine.

2.  **Distingua i Livelli di Log**  
    - Utilizzi `error` per registrare eccezioni di business  
    - Utilizzi `info` per registrare cambiamenti di stato  
    - Utilizzi `debug` per registrare informazioni di debug per lo sviluppo  

3.  **Eviti il Logging Eccessivo**  
    Soprattutto ai livelli `debug` e `trace`, Le consigliamo di abilitarli solo negli ambienti di sviluppo.

4.  **Utilizzi Dati Strutturati**  
    Passi parametri oggetto invece di concatenare stringhe; questo aiuta nell'analisi e nel filtraggio dei log.

Seguendo queste pratiche, gli sviluppatori possono tracciare in modo più efficiente l'esecuzione dei **plugin**, risolvere i problemi e mantenere un sistema di logging strutturato ed estensibile.