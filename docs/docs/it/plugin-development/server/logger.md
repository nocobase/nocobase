:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Logger

Il sistema di logging di NocoBase si basa su <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Per impostazione predefinita, NocoBase categorizza i log in log delle richieste API, log di runtime del sistema e log di esecuzione SQL. I log delle richieste API e quelli di esecuzione SQL vengono generati internamente dall'applicazione, mentre gli sviluppatori di **plugin** di solito devono solo occuparsi dei log di runtime del sistema relativi ai loro **plugin**.

Questo documento spiega come creare e generare log durante lo sviluppo di un **plugin**.

## Metodi di Stampa Predefiniti

NocoBase offre metodi per la generazione dei log di runtime del sistema. I log vengono generati seguendo campi specifici e indirizzati a file designati.

```ts
// Metodo di stampa predefinito
app.log.info("message");

// Utilizzo in un middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Utilizzo nei plugin
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Tutti i metodi sopra descritti seguono la sintassi seguente:

Il primo parametro è il messaggio del log, mentre il secondo è un oggetto `metadata` opzionale, che può contenere qualsiasi coppia chiave-valore. I campi `module`, `submodule` e `method` verranno estratti come campi separati, mentre i campi rimanenti saranno inseriti nel campo `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Output su Altri File

Se desidera utilizzare il metodo di generazione predefinito del sistema ma non vuole che l'output venga indirizzato al file predefinito, può creare un'istanza di logger di sistema personalizzata usando `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Indica se generare i log di livello error separatamente in 'xxx_error.log'
});
```

## Logger Personalizzato

Se non desidera utilizzare i metodi di generazione forniti dal sistema e preferisce quelli nativi di Winston, può creare i log usando i seguenti metodi.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

L'oggetto `options` estende le originali `winston.LoggerOptions`.

- `transports` - Può utilizzare `'console' | 'file' | 'dailyRotateFile'` per applicare i metodi di output predefiniti.
- `format` - Può utilizzare `'logfmt' | 'json' | 'delimiter'` per applicare i formati di generazione predefiniti.

### `app.createLogger`

Negli scenari multi-applicazione, a volte desideriamo personalizzare le directory e i file di output, indirizzandoli a una directory con il nome dell'applicazione corrente.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Output su /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Il caso d'uso e la sintassi sono gli stessi di `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Output su /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```