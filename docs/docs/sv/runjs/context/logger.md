:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/logger).
:::

# ctx.logger

En loggningswrapper baserad på [pino](https://github.com/pinojs/pino), som tillhandahåller högpresterande strukturerade JSON-loggar. Det rekommenderas att ni använder `ctx.logger` istället för `console` för enklare logginsamling och analys.

## Användningsområden

`ctx.logger` kan användas i alla RunJS-scenarier för felsökning, felspårning, prestandaanalys etc.

## Typdefinition

```ts
logger: pino.Logger;
```

`ctx.logger` är en instans av `engine.logger.child({ module: 'flow-engine' })`, vilket är en pino-underlogger med en `module`-kontext.

## Loggnivåer

pino stöder följande nivåer (från högsta till lägsta):

| Nivå | Metod | Beskrivning |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Allvarligt fel, leder vanligtvis till att processen avslutas |
| `error` | `ctx.logger.error()` | Fel, indikerar en misslyckad begäran eller åtgärd |
| `warn` | `ctx.logger.warn()` | Varning, indikerar potentiella risker eller onormala situationer |
| `info` | `ctx.logger.info()` | Allmän körningsinformation |
| `debug` | `ctx.logger.debug()` | Felsökningsinformation, används under utveckling |
| `trace` | `ctx.logger.trace()` | Detaljerad spårning, används för djupgående diagnostik |

## Rekommenderad användning

Det rekommenderade formatet är `level(msg, meta)`: meddelandet först, följt av ett valfritt metadataobjekt.

```ts
ctx.logger.info('Laddning av block slutförd');
ctx.logger.info('Åtgärden lyckades', { recordId: 456 });
ctx.logger.warn('Prestandavarning', { duration: 5000 });
ctx.logger.error('Åtgärden misslyckades', { userId: 123, action: 'create' });
ctx.logger.error('Begäran misslyckades', { err });
```

pino stöder även `level(meta, msg)` (objektet först) eller `level({ msg, ...meta })` (enskilt objekt), vilket kan användas vid behov.

## Exempel

### Grundläggande användning

```ts
ctx.logger.info('Laddning av block slutförd');
ctx.logger.warn('Begäran misslyckades, använder cache', { err });
ctx.logger.debug('Sparar...', { recordId: ctx.record?.id });
```

### Skapa en underlogger med child()

```ts
// Skapa en underlogger med kontext för den aktuella logiken
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Utför steg 1');
log.debug('Utför steg 2', { step: 2 });
```

### Relation till console

Det rekommenderas att ni använder `ctx.logger` direkt för att erhålla strukturerade JSON-loggar. Om ni är vana vid att använda `console`, är mappningarna: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Loggformat

pino genererar strukturerad JSON, där varje loggpost innehåller:

- `level`: Loggnivå (numerisk)
- `time`: Tidsstämpel (millisekunder)
- `msg`: Loggmeddelande
- `module`: Fastställt till `flow-engine`
- Övriga anpassade fält (skickas via objekt)

## Observera

- Loggar är strukturerad JSON, vilket gör dem enkla att samla in, söka i och analysera.
- Underloggar som skapats via `child()` följer också rekommendationen `level(msg, meta)`.
- Vissa körningsmiljöer (som arbetsflöden) kan använda andra metoder för loggutmatning.

## Relaterat

- [pino](https://github.com/pinojs/pino) — Det underliggande loggningsbiblioteket