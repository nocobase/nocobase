:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/logger).
:::

# ctx.logger

Un wrapper per il logging basato su [pino](https://github.com/pinojs/pino), che fornisce log JSON strutturati ad alte prestazioni. Si raccomanda di utilizzare `ctx.logger` invece di `console` per facilitare la raccolta e l'analisi dei log.

## Scenari di utilizzo

`ctx.logger` può essere utilizzato in tutti gli scenari RunJS per il debug, il tracciamento degli errori, l'analisi delle prestazioni, ecc.

## Definizione del tipo

```ts
logger: pino.Logger;
```

`ctx.logger` è un'istanza di `engine.logger.child({ module: 'flow-engine' })`, ovvero un logger figlio di pino con un contesto `module`.

## Livelli di log

pino supporta i seguenti livelli (dal più alto al più basso):

| Livello | Metodo | Descrizione |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Errore fatale, solitamente porta all'uscita del processo |
| `error` | `ctx.logger.error()` | Errore, indica il fallimento di una richiesta o di un'operazione |
| `warn` | `ctx.logger.warn()` | Avviso, indica potenziali rischi o situazioni anomale |
| `info` | `ctx.logger.info()` | Informazioni generali sul runtime |
| `debug` | `ctx.logger.debug()` | Informazioni di debug, utilizzate durante lo sviluppo |
| `trace` | `ctx.logger.trace()` | Tracciamento dettagliato, utilizzato per la diagnostica profonda |

## Scrittura consigliata

Il formato raccomandato è `level(msg, meta)`: il messaggio viene prima, seguito da un oggetto opzionale di metadati.

```ts
ctx.logger.info('Caricamento blocco completato');
ctx.logger.info('Operazione riuscita', { recordId: 456 });
ctx.logger.warn('Avviso prestazioni', { duration: 5000 });
ctx.logger.error('Operazione fallita', { userId: 123, action: 'create' });
ctx.logger.error('Richiesta fallita', { err });
```

pino supporta anche `level(meta, msg)` (oggetto prima) o `level({ msg, ...meta })` (oggetto singolo), che possono essere utilizzati secondo le necessità.

## Esempi

### Utilizzo di base

```ts
ctx.logger.info('Caricamento blocco completato');
ctx.logger.warn('Richiesta fallita, utilizzo della cache', { err });
ctx.logger.debug('Salvataggio in corso', { recordId: ctx.record?.id });
```

### Creazione di un logger figlio con child()

```ts
// Crea un logger figlio con contesto per la logica corrente
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Esecuzione passaggio 1');
log.debug('Esecuzione passaggio 2', { step: 2 });
```

### Relazione con console

Si consiglia di utilizzare direttamente `ctx.logger` per ottenere log JSON strutturati. Se ha l'abitudine di usare `console`, le corrispondenze sono: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Formato dei log

pino emette JSON strutturato, dove ogni voce di log contiene:

- `level`: Livello del log (numerico)
- `time`: Timestamp (millisecondi)
- `msg`: Messaggio di log
- `module`: Fisso come `flow-engine`
- Altri campi personalizzati (passati tramite oggetti)

## Note

- I log sono JSON strutturati, il che li rende facili da raccogliere, ricercare e analizzare.
- Anche i logger figli creati tramite `child()` seguono la raccomandazione `level(msg, meta)`.
- Alcuni ambienti di esecuzione (come i flussi di lavoro) potrebbero utilizzare metodi di output dei log differenti.

## Correlati

- [pino](https://github.com/pinojs/pino) — La libreria di logging sottostante