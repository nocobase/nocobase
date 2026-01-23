:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Logger

NocoBase-logging is gebaseerd op een wrapper rondom <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Standaard verdeelt NocoBase logs in API-verzoeklogs, systeemruntime-logs en SQL-uitvoerlogs. API-verzoeklogs en SQL-uitvoerlogs worden intern door de applicatie gegenereerd. Plugin-ontwikkelaars hoeven doorgaans alleen systeemruntime-logs te genereren die gerelateerd zijn aan hun plugin.

Dit document legt uit hoe u logs kunt aanmaken en afdrukken tijdens de ontwikkeling van plugins.

## Standaard afdrukmethode

NocoBase biedt methoden voor het afdrukken van systeemruntime-logs. Logs worden afgedrukt volgens specifieke velden en opgeslagen in aangewezen bestanden.

```ts
// Standaard afdrukmethode
app.log.info("message");

// Gebruik in middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Gebruik in plugins
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Alle bovenstaande methoden volgen de onderstaande werkwijze:

De eerste parameter is het logbericht, en de tweede parameter is een optioneel metadata-object. Dit object kan willekeurige sleutel-waardeparen bevatten. Hierbij worden `module`, `submodule` en `method` als afzonderlijke velden geëxtraheerd, terwijl de overige velden in het `meta`-veld worden geplaatst.

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

## Uitvoer naar andere bestanden

Als u de standaard afdrukmethode van het systeem wilt gebruiken, maar de logs niet naar het standaardbestand wilt schrijven, kunt u een aangepaste systeemlogger-instantie aanmaken met `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Of error-logs afzonderlijk moeten worden opgeslagen in 'xxx_error.log'
});
```

## Aangepaste logger

Als u de door het systeem geleverde afdrukmethode niet wilt gebruiken en liever de native methoden van Winston wilt toepassen, kunt u logs aanmaken met de volgende methoden.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` breidt de originele `winston.LoggerOptions` uit.

- `transports` - Gebruik `'console' | 'file' | 'dailyRotateFile'` om vooraf ingestelde uitvoermethoden toe te passen.
- `format` - Gebruik `'logfmt' | 'json' | 'delimiter'` om vooraf ingestelde afdrukformaten toe te passen.

### `app.createLogger`

In scenario's met meerdere applicaties willen we soms aangepaste uitvoermappen en bestanden, die dan kunnen worden opgeslagen in een map die vernoemd is naar de huidige applicatie.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Uitvoer naar /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Het gebruiksscenario en de werkwijze zijn hetzelfde als bij `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Uitvoer naar /storage/logs/main/custom-plugin/JJJJ-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```