:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/logger).
:::

# ctx.logger

Eine auf [pino](https://github.com/pinojs/pino) basierende Logging-Kapselung, die hochperformante strukturierte JSON-Logs bereitstellt. Es wird empfohlen, `ctx.logger` anstelle von `console` zu verwenden, um die Log-Erfassung und -Analyse zu erleichtern.

## Anwendungsbereiche

`ctx.logger` kann in allen RunJS-Szenarien für Debugging, Fehlerverfolgung, Performance-Analyse usw. verwendet werden.

## Typdefinition

```ts
logger: pino.Logger;
```

`ctx.logger` ist eine Instanz von `engine.logger.child({ module: 'flow-engine' })`, also ein pino-Child-Logger mit einem `module`-Kontext.

## Log-Ebenen

pino unterstützt die folgenden Ebenen (von hoch nach niedrig):

| Ebene | Methode | Beschreibung |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Fataler Fehler, führt normalerweise zum Beenden des Prozesses |
| `error` | `ctx.logger.error()` | Fehler, weist auf eine fehlgeschlagene Anfrage oder Operation hin |
| `warn` | `ctx.logger.warn()` | Warnung, weist auf potenzielle Risiken oder abnormale Situationen hin |
| `info` | `ctx.logger.info()` | Allgemeine Laufzeitinformationen |
| `debug` | `ctx.logger.debug()` | Debugging-Informationen für die Entwicklung |
| `trace` | `ctx.logger.trace()` | Detaillierte Verfolgung für tiefergehende Diagnosen |

## Empfohlene Schreibweise

Empfohlen wird das Format `level(msg, meta)`: Die Nachricht zuerst, gefolgt von einem optionalen Metadaten-Objekt.

```ts
ctx.logger.info('Block-Ladevorgang abgeschlossen');
ctx.logger.info('Operation erfolgreich', { recordId: 456 });
ctx.logger.warn('Performance-Warnung', { duration: 5000 });
ctx.logger.error('Operation fehlgeschlagen', { userId: 123, action: 'create' });
ctx.logger.error('Anfrage fehlgeschlagen', { err });
```

pino unterstützt auch `level(meta, msg)` (Objekt zuerst) oder `level({ msg, ...meta })` (einzelnes Objekt), die je nach Bedarf verwendet werden können.

## Beispiele

### Grundlegende Verwendung

```ts
ctx.logger.info('Block-Ladevorgang abgeschlossen');
ctx.logger.warn('Anfrage fehlgeschlagen, Cache wird verwendet', { err });
ctx.logger.debug('Wird gespeichert...', { recordId: ctx.record?.id });
```

### Child-Logger mit child() erstellen

```ts
// Erstellt einen Child-Logger mit Kontext für die aktuelle Logik
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Schritt 1 wird ausgeführt');
log.debug('Schritt 2 wird ausgeführt', { step: 2 });
```

### Beziehung zu console

Es wird empfohlen, `ctx.logger` direkt zu verwenden, um strukturierte JSON-Logs zu erhalten. Wenn Sie an die Verwendung von `console` gewöhnt sind, entsprechen diese: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Log-Format

pino gibt strukturiertes JSON aus, wobei jeder Log-Eintrag Folgendes enthält:

- `level`: Log-Ebene (numerisch)
- `time`: Zeitstempel (Millisekunden)
- `msg`: Log-Nachricht
- `module`: Festgelegt auf `flow-engine`
- Weitere benutzerdefinierte Felder (über Objekte übergeben)

## Hinweise

- Logs sind strukturiertes JSON, was die Erfassung, Suche und Analyse erleichtert.
- Für Child-Logger, die über `child()` erstellt wurden, wird ebenfalls die Schreibweise `level(msg, meta)` empfohlen.
- Einige Laufzeitumgebungen (wie Workflows) verwenden möglicherweise andere Methoden zur Log-Ausgabe.

## Verwandte Themen

- [pino](https://github.com/pinojs/pino) — Die zugrunde liegende Logging-Bibliothek