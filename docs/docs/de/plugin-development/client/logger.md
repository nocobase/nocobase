:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Logger

NocoBase bietet ein leistungsstarkes Logging-System, das auf [pino](https://github.com/pinojs/pino) basiert. Überall dort, wo Sie Zugriff auf den `context` haben, können Sie eine Logger-Instanz über `ctx.logger` abrufen. Diese Instanz dient dazu, wichtige Logs während der Laufzeit von Plugins oder des Systems zu erfassen.

## Grundlegende Verwendung

```ts
// Fatalen Fehler protokollieren (z. B. Initialisierungsfehler)
ctx.logger.fatal('Anwendungsinitialisierung fehlgeschlagen', { error });

// Allgemeine Fehler protokollieren (z. B. API-Request-Fehler)
ctx.logger.error('Daten konnten nicht geladen werden', { status, message });

// Warnungen protokollieren (z. B. Performance-Risiken oder unerwartete Benutzeraktionen)
ctx.logger.warn('Das aktuelle Formular enthält ungespeicherte Änderungen');

// Allgemeine Laufzeitinformationen protokollieren (z. B. Komponente geladen)
ctx.logger.info('Benutzerprofil-Komponente geladen');

// Debug-Informationen protokollieren (z. B. Statusänderungen)
ctx.logger.debug('Aktueller Benutzerstatus', { user });

// Detaillierte Trace-Informationen protokollieren (z. B. Rendering-Ablauf)
ctx.logger.trace('Komponente gerendert', { component: 'UserProfile' });
```

Diese Methoden entsprechen verschiedenen Log-Ebenen (von hoch nach niedrig):

| Ebene   | Methode              | Beschreibung                                                      |
| ------- | -------------------- | ----------------------------------------------------------------- |
| `fatal` | `ctx.logger.fatal()` | Fataler Fehler, der normalerweise zum Programmabbruch führt       |
| `error` | `ctx.logger.error()` | Fehler-Log, der einen fehlgeschlagenen Request oder eine fehlgeschlagene Operation anzeigt |
| `warn`  | `ctx.logger.warn()`  | Warninformationen, die auf potenzielle Risiken oder unerwartete Situationen hinweisen |
| `info`  | `ctx.logger.info()`  | Reguläre Laufzeitinformationen                                    |
| `debug` | `ctx.logger.debug()` | Debug-Informationen für die Entwicklungsumgebung                  |
| `trace` | `ctx.logger.trace()` | Detaillierte Trace-Informationen, üblicherweise für eine tiefgehende Diagnose |

## Log-Format

Jede Log-Ausgabe erfolgt im strukturierten JSON-Format und enthält standardmäßig die folgenden Felder:

| Feld       | Typ    | Beschreibung                  |
| ---------- | ------ | ----------------------------- |
| `level`    | number | Log-Ebene                     |
| `time`     | number | Zeitstempel (Millisekunden)   |
| `pid`      | number | Prozess-ID                    |
| `hostname` | string | Hostname                      |
| `msg`      | string | Log-Nachricht                 |
| `Andere`   | object | Benutzerdefinierte Kontextinformationen |

Beispielausgabe:

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

## Kontextbindung

`ctx.logger` injiziert automatisch Kontextinformationen, wie das aktuelle Plugin, Modul oder die Request-Quelle. Dadurch können Logs präziser ihrer Herkunft zugeordnet werden.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Beispielausgabe (mit Kontext):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Benutzerdefinierter Logger

Sie können in Plugins benutzerdefinierte Logger-Instanzen erstellen, die die Standardkonfigurationen erben oder erweitern:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Child-Logger erben die Konfiguration des Haupt-Loggers und fügen automatisch den Kontext hinzu.

## Hierarchie der Log-Ebenen

Pinos Log-Ebenen folgen einer numerischen Definition von hoch nach niedrig, wobei kleinere Zahlen eine geringere Priorität bedeuten.  
Hier ist die vollständige Tabelle der Log-Ebenen-Hierarchie:

| Ebenenname | Wert      | Methodenname     | Beschreibung                                                      |
| ---------- | --------- | ---------------- | ----------------------------------------------------------------- |
| `fatal`    | 60        | `logger.fatal()` | Fataler Fehler, der normalerweise dazu führt, dass das Programm nicht weiter ausgeführt werden kann |
| `error`    | 50        | `logger.error()` | Allgemeiner Fehler, der einen fehlgeschlagenen Request oder eine fehlerhafte Operation anzeigt |
| `warn`     | 40        | `logger.warn()`  | Warninformationen, die auf potenzielle Risiken oder unerwartete Situationen hinweisen |
| `info`     | 30        | `logger.info()`  | Allgemeine Informationen, die den Systemstatus oder normale Operationen protokollieren |
| `debug`    | 20        | `logger.debug()` | Debug-Informationen zur Problemanalyse während der Entwicklungsphase |
| `trace`    | 10        | `logger.trace()` | Detaillierte Trace-Informationen für eine tiefgehende Diagnose    |
| `silent`   | -Infinity | (keine Methode)  | Deaktiviert alle Log-Ausgaben                                     |

Pino gibt nur Logs aus, deren Ebene größer oder gleich der aktuell konfigurierten `level`-Ebene ist. Wenn die Log-Ebene beispielsweise `info` ist, werden `debug`- und `trace`-Logs ignoriert.

## Best Practices in der Plugin-Entwicklung

1.  **Verwenden Sie den Kontext-Logger**  
    Nutzen Sie `ctx.logger` in Plugin-, Modell- oder Anwendungskontexten, um automatisch Quellinformationen mitzuführen.

2.  **Unterscheiden Sie Log-Ebenen**  
    -   Verwenden Sie `error`, um Geschäftsfehler zu protokollieren.  
    -   Verwenden Sie `info`, um Statusänderungen zu erfassen.  
    -   Verwenden Sie `debug`, um Debugging-Informationen für die Entwicklung aufzuzeichnen.

3.  **Vermeiden Sie übermäßige Protokollierung**  
    Insbesondere auf den `debug`- und `trace`-Ebenen wird empfohlen, diese nur in Entwicklungsumgebungen zu aktivieren.

4.  **Verwenden Sie strukturierte Daten**  
    Übergeben Sie Objektparameter anstelle von verketteten Zeichenfolgen. Dies erleichtert die Log-Analyse und -Filterung.

Durch die Befolgung dieser Praktiken können Entwickler die Plugin-Ausführung effizienter verfolgen, Probleme beheben und die Struktur sowie Erweiterbarkeit des Logging-Systems gewährleisten.