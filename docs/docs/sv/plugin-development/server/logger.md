:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Logger

NocoBase-loggning bygger på <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Som standard delar NocoBase upp loggar i API-förfrågningsloggar, systemkörtidsloggar och SQL-exekveringsloggar. API-förfrågningsloggar och SQL-exekveringsloggar skrivs ut internt av applikationen. Som plugin-utvecklare behöver ni vanligtvis bara skriva ut systemkörtidsloggar som är relaterade till era plugin.

Detta dokument förklarar hur ni skapar och skriver ut loggar när ni utvecklar plugin.

## Standardmetoder för utskrift

NocoBase tillhandahåller metoder för att skriva ut systemkörtidsloggar. Loggarna skrivs ut enligt specificerade fält och skickas till angivna filer.

```ts
// Standardmetod för utskrift
app.log.info("message");

// Används i middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Används i plugin
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Alla ovanstående metoder följer nedanstående användning:

Det första parametern är loggmeddelandet, och det andra parametern är ett valfritt metadataobjekt som kan innehålla valfria nyckel-värde-par. `module`, `submodule` och `method` kommer att extraheras som separata fält, medan övriga fält placeras i fältet `meta`.

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

## Utmatning till andra filer

Om ni vill använda systemets standardmetod för utskrift men inte vill att loggarna ska hamna i standardfilen, kan ni skapa en anpassad systemlogginstans med `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Om felmeddelanden på error-nivå ska skrivas ut separat till 'xxx_error.log'
});
```

## Anpassad loggning

Om ni inte vill använda systemets utskriftsmetoder utan hellre vill använda Winstons inbyggda metoder, kan ni skapa loggar på följande sätt.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` utökar de ursprungliga `winston.LoggerOptions`.

- `transports` – Använd `'console' | 'file' | 'dailyRotateFile'` för att tillämpa förinställda utmatningsmetoder.
- `format` – Använd `'logfmt' | 'json' | 'delimiter'` för att tillämpa förinställda utskriftsformat.

### `app.createLogger`

I scenarier med flera applikationer vill vi ibland ha anpassade utmatningskataloger och filer, som kan skrivas ut till en katalog med namnet på den aktuella applikationen.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Skriver ut till /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Användningsområde och metod är desamma som för `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Skriver ut till /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```