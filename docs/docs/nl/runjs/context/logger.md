:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/logger) voor nauwkeurige informatie.
:::

# ctx.logger

Een logging-wrapper gebaseerd op [pino](https://github.com/pinojs/pino), die hoogwaardige gestructureerde JSON-logs biedt. Het wordt aanbevolen om `ctx.logger` te gebruiken in plaats van `console` voor eenvoudiger verzamelen en analyseren van logs.

## Toepassingsscenario's

`ctx.logger` kan worden gebruikt in alle RunJS-scenario's voor debugging, foutopsporing, prestatieanalyse, enz.

## Typedefinitie

```ts
logger: pino.Logger;
```

`ctx.logger` is een instantie van `engine.logger.child({ module: 'flow-engine' })`, wat een pino child-logger is met een `module`-context.

## Logniveaus

pino ondersteunt de volgende niveaus (van hoog naar laag):

| Niveau | Methode | Beschrijving |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Fatale fout, leidt meestal tot het beëindigen van het proces |
| `error` | `ctx.logger.error()` | Fout, geeft een mislukte aanvraag of bewerking aan |
| `warn` | `ctx.logger.warn()` | Waarschuwing, geeft potentiële risico's of abnormale situaties aan |
| `info` | `ctx.logger.info()` | Algemene runtime-informatie |
| `debug` | `ctx.logger.debug()` | Debug-informatie, gebruikt tijdens ontwikkeling |
| `trace` | `ctx.logger.trace()` | Gedetailleerde trace, gebruikt voor diepgaande diagnostiek |

## Aanbevolen schrijfwijze

De aanbevolen indeling is `level(msg, meta)`: het bericht komt eerst, gevolgd door een optioneel metadata-object.

```ts
ctx.logger.info('Blok laden voltooid');
ctx.logger.info('Bewerking geslaagd', { recordId: 456 });
ctx.logger.warn('Prestatiewaarschuwing', { duration: 5000 });
ctx.logger.error('Bewerking mislukt', { userId: 123, action: 'create' });
ctx.logger.error('Aanvraag mislukt', { err });
```

pino ondersteunt ook `level(meta, msg)` (object eerst) of `level({ msg, ...meta })` (enkel object), die naar behoefte kunnen worden gebruikt.

## Voorbeelden

### Basisgebruik

```ts
ctx.logger.info('Blok laden voltooid');
ctx.logger.warn('Aanvraag mislukt, cache wordt gebruikt', { err });
ctx.logger.debug('Bezig met opslaan', { recordId: ctx.record?.id });
```

### Een child-logger maken met child()

```ts
// Maak een child-logger met context voor de huidige logica
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Stap 1 uitvoeren');
log.debug('Stap 2 uitvoeren', { step: 2 });
```

### Relatie met console

Het wordt aanbevolen om `ctx.logger` rechtstreeks te gebruiken om gestructureerde JSON-logs te verkrijgen. Als u gewend bent aan `console`, zijn de koppelingen: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Logindeling

pino voert gestructureerde JSON uit, waarbij elk logitem het volgende bevat:

- `level`: Logniveau (numeriek)
- `time`: Tijdstempel (milliseconden)
- `msg`: Logbericht
- `module`: Vastgesteld op `flow-engine`
- Andere aangepaste velden (doorgegeven via objecten)

## Aandachtspunten

- Logs zijn gestructureerde JSON, waardoor ze eenvoudig te verzamelen, te doorzoeken en te analyseren zijn.
- Child-loggers gemaakt via `child()` volgen ook de aanbeveling `level(msg, meta)`.
- Sommige runtime-omgevingen (zoals workflows) kunnen andere methoden voor log-uitvoer gebruiken.

## Gerelateerd

- [pino](https://github.com/pinojs/pino) — De onderliggende logging-bibliotheek