:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Logger

NocoBase erbjuder ett högpresterande loggningssystem baserat på [pino](https://github.com/pinojs/pino). Överallt där ni har tillgång till `context` kan ni hämta en logger-instans via `ctx.logger` för att logga viktiga händelser under en plugin:s eller systemets körning.

## Grundläggande användning

```ts
// Loggar fatala fel (t.ex. misslyckad initiering)
ctx.logger.fatal('Applikationsinitiering misslyckades', { error });

// Loggar allmänna fel (t.ex. fel vid API-anrop)
ctx.logger.error('Dataladdning misslyckades', { status, message });

// Loggar varningar (t.ex. prestandarisker eller oväntade användaråtgärder)
ctx.logger.warn('Aktuellt formulär innehåller osparade ändringar');

// Loggar allmän körningsinformation (t.ex. att en komponent har laddats)
ctx.logger.info('Användarprofilkomponent laddad');

// Loggar felsökningsinformation (t.ex. statusändringar)
ctx.logger.debug('Aktuell användarstatus', { user });

// Loggar detaljerad spårningsinformation (t.ex. renderingsflöde)
ctx.logger.trace('Komponent renderad', { component: 'UserProfile' });
```

Dessa metoder motsvarar olika loggnivåer (från hög till låg):

| Nivå    | Metod               | Beskrivning                                          |
| :------ | :------------------ | :--------------------------------------------------- |
| `fatal` | `ctx.logger.fatal()` | Fatala fel, leder vanligtvis till att programmet avslutas |
| `error` | `ctx.logger.error()` | Felloggar, indikerar att en begäran eller åtgärd misslyckats |
| `warn`  | `ctx.logger.warn()`  | Varningsinformation, varnar för potentiella risker eller oväntade situationer |
| `info`  | `ctx.logger.info()`  | Reguljär körningsinformation                         |
| `debug` | `ctx.logger.debug()` | Felsökningsinformation, för utvecklingsmiljöer       |
| `trace` | `ctx.logger.trace()` | Detaljerad spårningsinformation, vanligtvis för djupgående diagnostik |

## Loggformat

Varje loggutdata är i strukturerat JSON-format och innehåller som standard följande fält:

| Fält       | Typ    | Beskrivning                  |
| :--------- | :----- | :--------------------------- |
| `level`    | number | Loggnivå                     |
| `time`     | number | Tidsstämpel (millisekunder)  |
| `pid`      | number | Process-ID                   |
| `hostname` | string | Värdnamn                     |
| `msg`      | string | Loggmeddelande               |
| Övrigt     | object | Anpassad kontextinformation |

Exempel på utdata:

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

## Kontextbindning

`ctx.logger` injicerar automatiskt kontextinformation, såsom aktuell plugin, modul eller begärans källa, vilket gör att loggarna mer exakt kan spåras till sin källa.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Exempel på utdata (med kontext):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Anpassad logger

Ni kan skapa anpassade logger-instanser i plugins, som ärver eller utökar standardkonfigurationen:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Underordnade loggers ärver huvudloggerns konfiguration och bifogar automatiskt kontext.

## Loggnivåhierarki

Pinos loggnivåer följer en numerisk definition från hög till låg, där lägre nummer indikerar lägre prioritet.  
Nedan finns den fullständiga tabellen över loggnivåhierarkin:

| Nivånamn  | Värde     | Metodnamn        | Beskrivning                                          |
| :-------- | :-------- | :--------------- | :--------------------------------------------------- |
| `fatal`   | 60        | `logger.fatal()` | Fatala fel, leder vanligtvis till att programmet inte kan fortsätta köra |
| `error`   | 50        | `logger.error()` | Allmänna fel, indikerar misslyckad begäran eller oväntad åtgärd |
| `warn`    | 40        | `logger.warn()`  | Varningsinformation, varnar för potentiella risker eller oväntade situationer |
| `info`    | 30        | `logger.info()`  | Normal information, loggar systemstatus eller normala operationer |
| `debug`   | 20        | `logger.debug()` | Felsökningsinformation, för problemanalys under utvecklingsfasen |
| `trace`   | 10        | `logger.trace()` | Detaljerad spårningsinformation, för djupgående diagnostik |
| `silent`  | -Infinity | (ingen motsvarande metod) | Stänger av all loggutdata                      |

Pino matar endast ut loggar som är större än eller lika med den aktuella `level`-konfigurationen. Till exempel, när loggnivån är `info`, kommer `debug`- och `trace`-loggar att ignoreras.

## Bästa praxis vid utveckling av plugins

1.  **Använd kontextloggern**  
    Använd `ctx.logger` i plugin-, modell- eller applikationskontexter för att automatiskt inkludera källinformation.

2.  **Skilj på loggnivåer**  
    -   Använd `error` för att logga affärsundantag  
    -   Använd `info` för att logga statusändringar  
    -   Använd `debug` för att logga felsökningsinformation under utveckling  

3.  **Undvik överdriven loggning**  
    Särskilt på `debug`- och `trace`-nivåer rekommenderas det att endast aktivera dem i utvecklingsmiljöer.

4.  **Använd strukturerad data**  
    Skicka in objektparametrar istället för att sammanfoga strängar, vilket underlättar logganalys och filtrering.

Genom att följa dessa metoder kan utvecklare mer effektivt spåra plugins körning, felsöka problem och upprätthålla ett strukturerat och utbyggbart loggningssystem.