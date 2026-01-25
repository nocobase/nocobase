:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Logger

NocoBase biedt een krachtig loggingsysteem aan, gebaseerd op [pino](https://github.com/pinojs/pino). Overal waar u toegang heeft tot de `context`, kunt u via `ctx.logger` een logger-instantie verkrijgen. Deze kunt u gebruiken om belangrijke logboeken vast te leggen tijdens de uitvoering van een plugin of het systeem.

## Basisgebruik

```ts
// Leg fatale fouten vast (bijv. initialisatiefout)
ctx.logger.fatal('Application initialization failed', { error });

// Leg algemene fouten vast (bijv. fout bij API-aanvraag)
ctx.logger.error('Data loading failed', { status, message });

// Leg waarschuwingen vast (bijv. prestatierisico's of onverwachte gebruikersacties)
ctx.logger.warn('Current form contains unsaved changes');

// Leg algemene runtime-informatie vast (bijv. component geladen)
ctx.logger.info('User profile component loaded');

// Leg debug-informatie vast (bijv. statuswijzigingen)
ctx.logger.debug('Current user state', { user });

// Leg gedetailleerde trace-informatie vast (bijv. renderproces)
ctx.logger.trace('Component rendered', { component: 'UserProfile' });
```

Deze methoden komen overeen met verschillende logniveaus (van hoog naar laag):

| Niveau | Methode | Beschrijving |
|---|---|---|
| `fatal` | `ctx.logger.fatal()` | Fatale fouten, leiden meestal tot het afsluiten van het programma |
| `error` | `ctx.logger.error()` | Foutlogboeken, duiden op een mislukte aanvraag of bewerking |
| `warn` | `ctx.logger.warn()` | Waarschuwingsinformatie, wijst op potentiële risico's of onverwachte situaties |
| `info` | `ctx.logger.info()` | Reguliere runtime-informatie |
| `debug` | `ctx.logger.debug()` | Debug-informatie voor de ontwikkelomgeving |
| `trace` | `ctx.logger.trace()` | Gedetailleerde trace-informatie, meestal voor diepgaande diagnose |

## Logformaat

Elke loguitvoer heeft een gestructureerd JSON-formaat en bevat standaard de volgende velden:

| Veld | Type | Beschrijving |
|---|---|---|
| `level` | number | Logniveau |
| `time` | number | Tijdstempel (milliseconden) |
| `pid` | number | Proces-ID |
| `hostname` | string | Hostnaam |
| `msg` | string | Logbericht |
| Overig | object | Aangepaste contextinformatie |

Voorbeeld van uitvoer:

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

## Contextbinding

`ctx.logger` injecteert automatisch contextinformatie, zoals de huidige plugin, module of aanvraagbron, waardoor logboeken nauwkeuriger naar hun bron kunnen worden herleid.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Voorbeeld van uitvoer (met context):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Aangepaste logger

U kunt in uw plugin aangepaste logger-instanties aanmaken, die de standaardconfiguratie overerven of uitbreiden:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Sub-loggers erven de configuratie van de hoofdlogger over en voegen automatisch context toe.

## Hiërarchie van logniveaus

De logniveaus van Pino volgen een numerieke definitie van hoog naar laag, waarbij kleinere getallen een lagere prioriteit aangeven.
Hieronder vindt u de complete hiërarchie van logniveaus:

| Niveau naam | Waarde | Methode naam | Beschrijving |
|---|---|---|---|
| `fatal` | 60 | `logger.fatal()` | Fatale fouten, waardoor het programma meestal niet verder kan worden uitgevoerd |
| `error` | 50 | `logger.error()` | Algemene fouten, duiden op een mislukte aanvraag of uitzonderlijke bewerking |
| `warn` | 40 | `logger.warn()` | Waarschuwingsinformatie, wijst op potentiële risico's of onverwachte situaties |
| `info` | 30 | `logger.info()` | Algemene informatie, registreert de systeemstatus of normale bewerkingen |
| `debug` | 20 | `logger.debug()` | Debug-informatie, voor probleemanalyse tijdens de ontwikkelingsfase |
| `trace` | 10 | `logger.trace()` | Gedetailleerde trace-informatie, voor diepgaande diagnose |
| `silent` | -Infinity | (geen corresponderende methode) | Schakelt alle loguitvoer uit |

Pino geeft alleen logboeken weer die groter zijn dan of gelijk zijn aan de huidige `level`-configuratie. Als het logniveau bijvoorbeeld `info` is, worden `debug`- en `trace`-logboeken genegeerd.

## Best practices bij de ontwikkeling van plugins

1.  **Gebruik de contextlogger**
    Gebruik `ctx.logger` in de context van een plugin, model of applicatie om automatisch broninformatie mee te sturen.

2.  **Onderscheid logniveaus**
    -   Gebruik `error` om bedrijfsuitvoeringen vast te leggen
    -   Gebruik `info` om statuswijzigingen vast te leggen
    -   Gebruik `debug` om debug-informatie voor ontwikkeling vast te leggen

3.  **Vermijd overmatige logging**
    Vooral op `debug`- en `trace`-niveaus wordt aanbevolen deze alleen in ontwikkelomgevingen in te schakelen.

4.  **Gebruik gestructureerde gegevens**
    Geef objectparameters door in plaats van strings samen te voegen; dit helpt bij loganalyse en -filtering.

Door deze methoden te volgen, kunnen ontwikkelaars efficiënter de uitvoering van plugins volgen, problemen oplossen en de structuur en uitbreidbaarheid van het loggingsysteem behouden.